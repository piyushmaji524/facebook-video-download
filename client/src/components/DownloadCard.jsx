import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Download,
  Clock,
  User,
  Film,
  Music,
  X,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Volume2,
} from 'lucide-react';

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatFileSize(bytes) {
  if (!bytes) return null;
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function QualityBadge({ quality, type }) {
  const isAudio = type === 'audio';
  const is1080 = quality === '1080p';
  const is720 = quality === '720p';

  if (isAudio) return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
      MP3
    </span>
  );
  if (is1080) return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
      Full HD
    </span>
  );
  if (is720) return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
      HD
    </span>
  );
  return null;
}

function formatSpeed(bps) {
  if (bps > 1e6) return `${(bps / 1e6).toFixed(1)} MB/s`;
  if (bps > 1e3) return `${(bps / 1e3).toFixed(0)} KB/s`;
  return `${bps.toFixed(0)} B/s`;
}

export default function DownloadCard({ data, onReset }) {
  const [progress, setProgress] = useState({});

  const setP = (key, val) => setProgress(prev => ({ ...prev, [key]: val }));
  const clearP = (key) => setProgress(prev => { const n = { ...prev }; delete n[key]; return n; });

  const handleDownload = async (format, index) => {
    const safeTitle = data.title?.slice(0, 40) || 'video';
    const key = `${format.type}_${index}`;

    if (format.type === 'merged') {
      setP(key, { percent: 0, speed: '', eta: '', status: 'starting' });
      try {
        const startRes = await fetch('/api/merge-start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: data.sourceUrl, height: format.height, title: safeTitle, cookie: data.cookie || undefined }),
        });
        if (!startRes.ok) throw new Error('Failed to start merge');
        const { jobId } = await startRes.json();

        await new Promise((resolve, reject) => {
          const es = new EventSource(`/api/merge-progress/${jobId}`);
          es.onmessage = async (e) => {
            const job = JSON.parse(e.data);
            setP(key, { percent: job.progress, speed: job.speed, eta: job.eta, status: job.status });
            if (job.status === 'done') {
              es.close();
              const fileRes = await fetch(`/api/merge-file/${jobId}`);
              if (!fileRes.ok) { reject(new Error('File download failed')); return; }
              const blob = await fileRes.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `${safeTitle}.mp4`;
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              URL.revokeObjectURL(url);
              toast.success(`Downloaded: ${format.quality} with sound ✓`);
              resolve();
            } else if (job.status === 'error') {
              es.close();
              reject(new Error(job.error || 'Merge failed'));
            }
          };
          es.onerror = () => { es.close(); reject(new Error('Connection lost')); };
        });
      } catch (err) {
        toast.error(err.message || 'Merge failed, try again');
      } finally {
        clearP(key);
      }
      return;
    }

    const filename = `${safeTitle}.${format.ext}`;
    const proxyUrl = `/api/download?url=${encodeURIComponent(format.url)}&filename=${encodeURIComponent(filename)}`;
    setP(key, { percent: null, speed: '', status: 'downloading', received: 0 });
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Download failed');
      const contentLength = parseInt(response.headers.get('content-length') || '0');
      const reader = response.body.getReader();
      const chunks = []; let received = 0, lastTime = Date.now(), lastReceived = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); received += value.length;
        const now = Date.now(), elapsed = (now - lastTime) / 1000;
        if (elapsed > 0.4) {
          const spd = (received - lastReceived) / elapsed;
          setP(key, { percent: contentLength ? (received / contentLength) * 100 : null, speed: formatSpeed(spd), status: 'downloading', received });
          lastTime = now; lastReceived = received;
        }
      }
      const blob = new Blob(chunks);
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
      toast.success(`Downloaded: ${format.quality} ✓`);
    } catch (err) {
      toast.error(err.message || 'Download failed');
    } finally {
      clearP(key);
    }
  };

  const duration = formatDuration(data.duration);
  const videoFormats = data.formats.filter(f => f.type === 'video' || f.type === 'merged');
  const audioFormats = data.formats.filter(f => f.type === 'audio');
  const thumbnailSrc = data.thumbnail
    ? `/api/thumbnail?url=${encodeURIComponent(data.thumbnail)}`
    : null;

  return (
    <section id="result-card" className="px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <div className="relative">
            {thumbnailSrc ? (
              <div className="relative">
                <img
                  src={thumbnailSrc}
                  alt={data.title}
                  className="w-full h-52 sm:h-72 object-cover"
                  onError={(e) => {
                    e.target.closest('.relative').style.display = 'none';
                    document.getElementById('thumb-fallback')?.style.setProperty('display', 'block');
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-semibold text-lg line-clamp-2 drop-shadow-lg">
                    {data.title}
                  </p>
                </div>
              </div>
            ) : null}

            <div id="thumb-fallback" className={thumbnailSrc ? 'hidden' : 'block'} style={{display: thumbnailSrc ? 'none' : 'block'}}>
              <div className="p-5 pb-3 flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Film size={22} className="text-blue-400" />
                </div>
                <p className="text-white font-semibold text-base line-clamp-3">{data.title}</p>
              </div>
            </div>

            <button
              onClick={onReset}
              className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 hover:bg-black/70 transition-colors text-white"
              title="Clear"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap gap-4 mb-6 text-sm text-slate-400">
              {data.platform && (
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    data.platform === 'Instagram'
                      ? 'bg-pink-500/20 text-pink-400 border-pink-500/30'
                      : data.platform === 'YouTube'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}>{data.platform}</span>
                </div>
              )}
              {data.uploader && (
                <div className="flex items-center gap-1.5">
                  <User size={14} className="text-blue-400" />
                  <span>{data.uploader}</span>
                </div>
              )}
              {duration && (
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-purple-400" />
                  <span>{duration}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-green-400" />
                <span>{data.formats.length} format{data.formats.length > 1 ? 's' : ''} available</span>
              </div>
            </div>

            {videoFormats.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Film size={15} className="text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Video Formats</span>
                </div>
                <div className="grid gap-2">
                  {videoFormats.map((format, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/40 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                          format.type === 'merged'
                            ? 'bg-gradient-to-br from-green-600/30 to-teal-600/30 border-green-500/20'
                            : 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 border-blue-500/20'
                        }`}>
                          <Film size={16} className={format.type === 'merged' ? 'text-green-400' : 'text-blue-400'} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{format.quality}</span>
                            <QualityBadge quality={format.quality} type={format.type} />
                            {format.type === 'merged' && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                <Volume2 size={10} /> Sound
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
                            {format.ext.toUpperCase()}
                            {format.type === 'merged' ? ' · Server merge' : ''}
                            {format.filesize && ` · ${formatFileSize(format.filesize)}`}
                          </span>
                        </div>
                      </div>

                      {progress[`${format.type}_${i}`] ? (
                        <div className="min-w-[140px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Loader2 size={11} className="animate-spin" />
                              {format.type === 'merged'
                                ? progress[`${format.type}_${i}`].status === 'starting' ? 'Starting...' : 'Merging...'
                                : 'Downloading...'}
                            </span>
                            <span className="text-slate-400">
                              {progress[`${format.type}_${i}`].percent != null
                                ? `${Math.round(progress[`${format.type}_${i}`].percent)}%`
                                : '...'}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            {progress[`${format.type}_${i}`].percent != null ? (
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${format.type === 'merged' ? 'bg-gradient-to-r from-green-500 to-teal-400' : 'bg-gradient-to-r from-blue-500 to-purple-400'}`}
                                style={{ width: `${Math.min(progress[`${format.type}_${i}`].percent, 100)}%` }}
                              />
                            ) : (
                              <div className="h-full w-1/3 rounded-full bg-blue-500 animate-[slide_1.2s_ease-in-out_infinite]" />
                            )}
                          </div>
                          {progress[`${format.type}_${i}`].speed && (
                            <p className="text-xs text-slate-500 mt-1 text-right">
                              {progress[`${format.type}_${i}`].speed}
                              {progress[`${format.type}_${i}`].eta ? ` · ETA ${progress[`${format.type}_${i}`].eta}` : ''}
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDownload(format, i)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg ${
                            format.type === 'merged'
                              ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 shadow-green-500/20'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/20'
                          }`}
                        >
                          <Download size={15} />
                          Download
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {audioFormats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Music size={15} className="text-orange-400" />
                  <span className="text-sm font-medium text-slate-300">Audio Only</span>
                </div>
                <div className="grid gap-2">
                  {audioFormats.map((format, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:border-orange-500/40 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600/30 to-red-600/30 border border-orange-500/20 flex items-center justify-center">
                          <Music size={16} className="text-orange-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">{format.quality}</span>
                            <QualityBadge quality={format.quality} type={format.type} />
                          </div>
                          <span className="text-xs text-slate-500">
                            {format.ext.toUpperCase()}
                            {format.filesize && ` · ${formatFileSize(format.filesize)}`}
                          </span>
                        </div>
                      </div>

                      {progress[`${format.type}_${i}`] ? (
                        <div className="min-w-[140px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-400 flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Downloading...</span>
                            <span className="text-slate-400">{progress[`${format.type}_${i}`].percent != null ? `${Math.round(progress[`${format.type}_${i}`].percent)}%` : '...'}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            {progress[`${format.type}_${i}`].percent != null
                              ? <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-400 transition-all duration-300" style={{ width: `${Math.min(progress[`${format.type}_${i}`].percent, 100)}%` }} />
                              : <div className="h-full w-1/3 rounded-full bg-orange-500 animate-[slide_1.2s_ease-in-out_infinite]" />}
                          </div>
                          {progress[`${format.type}_${i}`].speed && <p className="text-xs text-slate-500 mt-1 text-right">{progress[`${format.type}_${i}`].speed}</p>}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDownload(format, i)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 transition-all"
                        >
                          <Download size={15} />
                          Download
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-500 flex items-start gap-2">
              <ExternalLink size={12} className="mt-0.5 shrink-0 text-slate-600" />
              <span>
                Only download videos you have permission to download. Respect copyright laws.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
