<div align="center">

# 🎬 VidDown

### Fast & Beautiful Social Video Downloader

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![yt-dlp](https://img.shields.io/badge/yt--dlp-latest-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://github.com/yt-dlp/yt-dlp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Download videos from Facebook, Instagram & YouTube — instantly, in HD, for free.**

[🌐 Live Demo](https://vastuai.online) · [📖 Full Setup Guide](./SETUP.md) · [🐛 Report Bug](https://github.com/piyushmaji524/facebook-video-download/issues)

</div>

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🎥 **Multi-Platform** | Facebook, Instagram & YouTube support |
| 🔊 **Video + Audio Merge** | Instagram videos downloaded with full sound (server-side ffmpeg) |
| 📊 **Real-time Progress** | Live progress bar with download speed & ETA |
| 🎵 **Audio Extraction** | Download audio-only (MP3/M4A) from any video |
| 🖼️ **Thumbnail Preview** | Video thumbnail shown before downloading |
| 🔒 **Private Videos** | Download private videos using browser cookie |
| ⚡ **Multiple Qualities** | 1080p, 720p, 480p, 360p — choose what you need |
| 🛡️ **Secure** | Rate limiting, security headers, CORS protection |
| 🌐 **One-Command Deploy** | Full VPS deployment guide included |
| 🔄 **Easy Domain Switch** | Automated script to change domain anytime |

---

## 🖥️ Screenshots

> **Live site:** [https://vastuai.online](https://vastuai.online)

### Home Page
![VidDown Home](https://vastuai.online/preview-home.png)

### Download Card with Progress
![VidDown Download](https://vastuai.online/preview-download.png)

---

## 🛠️ Tech Stack

```
Frontend          Backend           Infrastructure
─────────         ───────           ──────────────
React 18          Node.js 20        Nginx (reverse proxy)
Vite 5            Express 4         PM2 (process manager)
TailwindCSS 3     yt-dlp            Let's Encrypt SSL
Lucide Icons      ffmpeg            Ubuntu VPS
react-hot-toast   Helmet (security) FileBrowser (file mgr)
Axios             Rate Limiting     Certbot (auto SSL)
```

---

## 📁 Project Structure

```
viddown/
├── 📂 client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx      # Navigation + platform badges
│   │   │   ├── Hero.jsx        # URL input + cookie support
│   │   │   ├── DownloadCard.jsx # Video info + download buttons
│   │   │   ├── Features.jsx    # Feature highlights section
│   │   │   ├── HowToUse.jsx    # Step-by-step guide section
│   │   │   └── Footer.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── 📂 server/                  # Express backend
│   ├── routes/
│   │   └── download.js         # All API endpoints
│   ├── public/                 # Built React app (auto-generated)
│   └── index.js                # Express entry point
│
├── nginx.conf                  # Nginx config template
├── change-domain.sh            # One-command domain switcher
├── SETUP.md                    # Complete deployment guide
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** 18+ — [download](https://nodejs.org)
- **Python 3** + **yt-dlp** — `pip install yt-dlp`
- **ffmpeg** — `apt install ffmpeg` / [Windows](https://ffmpeg.org/download.html)

### Run Locally

```bash
# Clone the repo
git clone https://github.com/piyushmaji524/facebook-video-download.git
cd facebook-video-download

# Install & start backend (port 5000)
cd server
npm install
npm run dev

# Install & start frontend in a new terminal (port 3000)
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The frontend proxies API calls to port 5000 automatically via Vite config.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/info` | Fetch video metadata + available formats |
| `POST` | `/api/merge-start` | Start server-side video+audio merge job |
| `GET` | `/api/merge-progress/:jobId` | SSE stream — real-time merge progress |
| `GET` | `/api/merge-file/:jobId` | Download merged MP4 file |
| `GET` | `/api/download` | Proxy direct video/audio download |
| `GET` | `/api/thumbnail` | Proxy thumbnail image (bypass CORS) |
| `GET` | `/health` | Server health check |

### Example Request

```bash
curl -X POST https://vastuai.online/api/info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/reel/XXXXX/"}'
```

```json
{
  "title": "Video Title",
  "thumbnail": "https://...",
  "duration": 30,
  "platform": "Instagram",
  "sourceUrl": "https://www.instagram.com/reel/XXXXX/",
  "formats": [
    { "quality": "1080p", "type": "merged", "ext": "mp4", "hasAudio": true },
    { "quality": "720p",  "type": "merged", "ext": "mp4", "hasAudio": true },
    { "quality": "Audio Only", "type": "audio", "ext": "m4a" }
  ]
}
```

---

## ☁️ Deploy to VPS

See the **[SETUP.md](./SETUP.md)** for the complete step-by-step guide covering:

- ✅ Fresh Ubuntu VPS setup (Node.js, ffmpeg, yt-dlp, Nginx, PM2)
- ✅ Upload project files (Windows PowerShell / Git / SCP)
- ✅ Build & start with PM2 (auto-restart on reboot)
- ✅ Nginx reverse proxy configuration
- ✅ FileBrowser web file manager setup
- ✅ Free SSL with Let's Encrypt / Certbot
- ✅ Firewall configuration
- ✅ Changing domain with one command

### Change Domain Anytime

```bash
# SSH into your VPS and run:
bash /var/www/fbdown/change-domain.sh newdomain.com admin@newdomain.com
```

This script automatically updates Nginx config, issues new SSL certs, and reloads everything.

---

## 🔒 Private Video Support

For private Facebook/Instagram videos:

1. Open the site and paste your video URL
2. Click **"Private video? Add cookie"**
3. From Chrome DevTools (F12 → Network → any request → Headers → copy `cookie` value)
4. Paste cookie → Download

> Cookies are used only for the current request and never stored on the server.

---

## 🤝 Contributing

Contributions are welcome!

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

This tool is intended for downloading videos you have the right to download. Respect copyright laws and platform terms of service. The developers are not responsible for any misuse.

---

<div align="center">

Made with ❤️ · **VidDown** supports Facebook 🔵 · Instagram 🩷 · YouTube 🔴

⭐ **Star this repo** if you found it useful!

</div>
