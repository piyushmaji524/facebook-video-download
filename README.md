# VidDown — Social Video Downloader

A fast, modern video downloader supporting **Facebook**, **Instagram**, and **YouTube**.
Built with React + Node.js + yt-dlp.

## Features

- Download videos in multiple qualities (1080p, 720p, 480p, 360p)
- Instagram video + audio merge (server-side ffmpeg)
- YouTube videos & Shorts
- Audio-only extraction (MP3/M4A)
- Real-time download progress bar + speed indicator
- Private video support via browser cookie
- Thumbnail preview proxy (no CORS issues)
- Rate limiting, security headers, gzip compression

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Video Engine | yt-dlp + ffmpeg |
| Web Server | Nginx (reverse proxy) |
| Process Manager | PM2 |
| SSL | Let's Encrypt (Certbot) |

## Project Structure

```
/
├── client/          # React frontend (Vite)
├── server/          # Express backend
│   ├── index.js
│   └── routes/
│       └── download.js
├── nginx.conf       # Nginx config template
├── change-domain.sh # Script to switch domains easily
├── SETUP.md         # Full deployment guide ← READ THIS
└── README.md
```

## Quick Start (Local Dev)

```bash
# 1. Install backend
cd server && npm install

# 2. Install frontend
cd ../client && npm install

# 3. Run backend (port 5000)
cd ../server && npm run dev

# 4. Run frontend (port 3000) — in a new terminal
cd client && npm run dev
```

> Requires: Node.js 18+, Python 3, `yt-dlp` (`pip install yt-dlp`), `ffmpeg`

## Deploy to VPS / Change Domain

See **[SETUP.md](./SETUP.md)** for complete step-by-step guide.
