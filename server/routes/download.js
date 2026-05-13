const express = require('express');
const { exec, spawn } = require('child_process');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const router = express.Router();

const mergeJobs = new Map();

const SUPPORTED_URL_REGEX = /^(https?:\/\/)?(www\.|m\.|web\.)?(facebook\.com|fb\.watch|instagram\.com|instagr\.am|youtube\.com|youtu\.be)\/.+/i;

function isValidUrl(url) {
  return SUPPORTED_URL_REGEX.test(url);
}

function detectPlatform(url) {
  if (/instagram\.com|instagr\.am/i.test(url)) return 'Instagram';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'YouTube';
  return 'Facebook';
}

function writeCookieFile(cookieStr) {
  const tmpPath = path.join(os.tmpdir(), `ck_${Date.now()}.txt`);
  const netscape = `# Netscape HTTP Cookie File\n${cookieStr
    .split(';')
    .map(pair => {
      const [name, ...valParts] = pair.trim().split('=');
      const value = valParts.join('=');
      if (!name) return null;
      return `.facebook.com\tTRUE\t/\tFALSE\t0\t${name.trim()}\t${value ? value.trim() : ''}`;
    })
    .filter(Boolean)
    .join('\n')}`;
  fs.writeFileSync(tmpPath, netscape);
  return tmpPath;
}

function runYtDlp(url, cookieStr) {
  return new Promise((resolve, reject) => {
    let cookieFile = null;
    let cookieArg = '';
    if (cookieStr) {
      try {
        cookieFile = writeCookieFile(cookieStr);
        cookieArg = `--cookies "${cookieFile}"`;
      } catch (e) {
        console.error('Cookie file error:', e.message);
      }
    }
    const cmd = `yt-dlp --dump-json --no-playlist ${cookieArg} "${url}"`;
    exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
      if (cookieFile) fs.unlink(cookieFile, () => {});
      if (error) return reject(new Error(stderr || error.message));
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error('Failed to parse video info'));
      }
    });
  });
}

function extractFormats(ytdlpData) {
  const formats = ytdlpData.formats || [];
  const result = [];
  const seenMerged = new Set();
  const seenDirect = new Set();

  const hasAudioTrack = formats.some(f => f.vcodec === 'none' && f.acodec !== 'none' && f.url);

  // Combined formats (video + audio in one stream)
  const combinedFormats = formats
    .filter(f => f.vcodec !== 'none' && f.acodec && f.acodec !== 'none' && f.url)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  for (const f of combinedFormats) {
    const label = f.height ? `${f.height}p` : (f.format_note || f.format_id);
    if (!seenDirect.has(label)) {
      seenDirect.add(label);
      result.push({
        quality: label,
        url: f.url,
        ext: f.ext || 'mp4',
        filesize: f.filesize || f.filesize_approx || null,
        type: 'video',
        hasAudio: true,
      });
    }
  }

  // Video-only streams — need server-side merge with audio
  if (hasAudioTrack) {
    const videoOnlyFormats = formats
      .filter(f => f.vcodec !== 'none' && (f.acodec === 'none' || !f.acodec) && f.height && f.url)
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    for (const f of videoOnlyFormats) {
      const label = `${f.height}p`;
      if (!seenMerged.has(label) && !seenDirect.has(label)) {
        seenMerged.add(label);
        result.push({
          quality: label,
          height: f.height,
          ext: 'mp4',
          filesize: null,
          type: 'merged',
          hasAudio: true,
        });
      }
    }
  }

  // Audio only
  const audioFormats = formats.filter(f => f.vcodec === 'none' && f.acodec !== 'none' && f.url);
  if (audioFormats.length > 0) {
    const best = audioFormats[audioFormats.length - 1];
    result.push({
      quality: 'Audio Only',
      url: best.url,
      ext: best.ext || 'm4a',
      filesize: best.filesize || best.filesize_approx || null,
      type: 'audio',
    });
  }

  return result;
}

router.post('/info', async (req, res) => {
  const { url, cookie } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  const trimmedUrl = url.trim();

  if (!isValidUrl(trimmedUrl)) {
    return res.status(400).json({ error: 'Please enter a valid Facebook, Instagram or YouTube URL' });
  }

  try {
    const data = await runYtDlp(trimmedUrl, cookie);
    const formats = extractFormats(data);

    if (formats.length === 0) {
      return res.status(404).json({ error: 'No downloadable formats found for this video' });
    }

    return res.json({
      title: data.title || 'Video',
      thumbnail: data.thumbnail || null,
      duration: data.duration || null,
      uploader: data.uploader || data.channel || null,
      platform: detectPlatform(trimmedUrl),
      sourceUrl: trimmedUrl,
      cookie: cookie || null,
      formats,
    });
  } catch (err) {
    console.error('yt-dlp error:', err.message);

    if (err.message.includes('Private') || err.message.includes('login')) {
      return res.status(403).json({ error: 'This video is private or requires login' });
    }
    if (err.message.includes('not found') || err.message.includes('404')) {
      return res.status(404).json({ error: 'Video not found' });
    }

    return res.status(500).json({ error: 'Failed to fetch video info. Make sure yt-dlp is installed.' });
  }
});

function startMergeJob(jobId, sourceUrl, height, safeTitle, cookieStr) {
  const job = mergeJobs.get(jobId);
  const tmpFile = path.join(os.tmpdir(), `vd_${jobId}.mp4`);
  const formatStr = height
    ? `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`
    : 'bestvideo+bestaudio/best';

  let cookieFile = null;
  const args = ['-f', formatStr, '--merge-output-format', 'mp4', '--newline', '-o', tmpFile, sourceUrl];
  if (cookieStr) {
    try { cookieFile = writeCookieFile(cookieStr); args.push('--cookies', cookieFile); } catch (e) {}
  }

  job.status = 'processing';
  const proc = spawn('yt-dlp', args);

  proc.stdout.on('data', (data) => {
    const line = data.toString();
    const m = line.match(/\[download\]\s+([\d.]+)%.*?at\s+([\d.]+\s*\S+\/s).*?ETA\s+(\S+)/);
    if (m) { job.progress = parseFloat(m[1]); job.speed = m[2].trim(); job.eta = m[3]; }
  });

  proc.on('close', (code) => {
    if (cookieFile) fs.unlink(cookieFile, () => {});
    if (code === 0 && fs.existsSync(tmpFile)) {
      job.status = 'done'; job.filePath = tmpFile; job.progress = 100;
    } else {
      job.status = 'error'; job.error = 'Merge failed. Try a lower quality.';
      fs.unlink(tmpFile, () => {});
    }
    setTimeout(() => {
      const j = mergeJobs.get(jobId);
      if (j && j.filePath) fs.unlink(j.filePath, () => {});
      mergeJobs.delete(jobId);
    }, 15 * 60 * 1000);
  });
}

router.post('/merge-start', (req, res) => {
  const { url, height, title, cookie } = req.body;
  if (!url || !isValidUrl(url)) return res.status(400).json({ error: 'Valid social media URL required' });

  const jobId = `j${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
  const safeTitle = (title || 'video').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 50);
  mergeJobs.set(jobId, { status: 'pending', progress: 0, speed: '', eta: '', filePath: null, error: null, title: safeTitle });

  startMergeJob(jobId, url, height, safeTitle, cookie);
  res.json({ jobId });
});

router.get('/merge-progress/:jobId', (req, res) => {
  const job = mergeJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = () => {
    const j = mergeJobs.get(req.params.jobId);
    if (!j) { res.end(); return; }
    res.write(`data: ${JSON.stringify(j)}\n\n`);
    if (j.status === 'done' || j.status === 'error') { clearInterval(timer); setTimeout(() => res.end(), 200); }
  };

  const timer = setInterval(send, 600);
  send();
  req.on('close', () => clearInterval(timer));
});

router.get('/merge-file/:jobId', (req, res) => {
  const job = mergeJobs.get(req.params.jobId);
  if (!job || job.status !== 'done' || !job.filePath || !fs.existsSync(job.filePath)) {
    return res.status(404).json({ error: 'File not ready or expired' });
  }
  const stat = fs.statSync(job.filePath);
  res.setHeader('Content-Disposition', `attachment; filename="${job.title}.mp4"`);
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Length', stat.size);
  const stream = fs.createReadStream(job.filePath);
  stream.pipe(res);
  stream.on('close', () => { fs.unlink(job.filePath, () => {}); mergeJobs.delete(req.params.jobId); });
});

router.get('/thumbnail', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).end();

  try {
    const parsedUrl = new URL(decodeURIComponent(url));
    const proto = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.facebook.com/',
      },
    };

    const request = proto.get(options, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return res.redirect(`/api/thumbnail?url=${encodeURIComponent(response.headers.location)}`);
      }
      res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      response.pipe(res);
    });

    request.on('error', () => res.status(500).end());
    request.setTimeout(10000, () => { request.destroy(); res.status(504).end(); });
  } catch {
    res.status(400).end();
  }
});

router.get('/download', (req, res) => {
  const { url, filename } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const parsedUrl = new URL(url);
    const proto = parsedUrl.protocol === 'https:' ? https : http;
    const safeFilename = (filename || 'facebook_video').replace(/[^a-zA-Z0-9_\-\.]/g, '_');

    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const request = proto.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return res.redirect(`/api/download?url=${encodeURIComponent(response.headers.location)}&filename=${safeFilename}`);
      }
      response.pipe(res);
    });

    request.on('error', (err) => {
      console.error('Proxy error:', err.message);
      if (!res.headersSent) res.status(500).json({ error: 'Download failed' });
    });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
});

module.exports = router;
