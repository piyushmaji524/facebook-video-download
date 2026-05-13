# Deployment Guide

> **This file is outdated. Please refer to the new comprehensive guide:**
> **[SETUP.md](./SETUP.md)**

---

# Old VPS Deployment Guide (archived)

## Step 1 — Server Setup

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python3, pip, ffmpeg
sudo apt install -y python3 python3-pip ffmpeg

# Install yt-dlp
sudo pip3 install yt-dlp
# Verify
yt-dlp --version

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

---

## Step 2 — Upload Project

```bash
# On your local machine, upload via scp or rsync
scp -r "fb-downloader/" user@YOUR_VPS_IP:/var/www/fb-downloader
```

Or use Git:
```bash
git clone https://github.com/yourrepo/fb-downloader.git /var/www/fb-downloader
```

---

## Step 3 — Install Dependencies & Build

```bash
cd /var/www/fb-downloader

# Install server deps
cd server && npm install

# Install client deps & build
cd ../client && npm install && npm run build
# Built files will be in /server/public/
```

---

## Step 4 — Start with PM2

```bash
cd /var/www/fb-downloader/server

# Start app
NODE_ENV=production pm2 start index.js --name "fb-downloader"

# Auto-restart on reboot
pm2 save
pm2 startup
```

---

## Step 5 — Configure Nginx

```bash
# Copy nginx config
sudo cp /var/www/fb-downloader/nginx.conf /etc/nginx/sites-available/fb-downloader

# Edit and replace 'yourdomain.com' with your actual domain
sudo nano /etc/nginx/sites-available/fb-downloader

# Enable the site
sudo ln -s /etc/nginx/sites-available/fb-downloader /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 6 — SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew is set up automatically
```

---

## Step 7 — Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Useful Commands

```bash
# View logs
pm2 logs fb-downloader

# Restart app
pm2 restart fb-downloader

# Update yt-dlp (important for staying up-to-date)
sudo pip3 install -U yt-dlp

# Monitor
pm2 monit
```

---

## Update yt-dlp Regularly

Facebook often changes their API. Keep yt-dlp updated weekly:

```bash
# Add cron job to auto-update
echo "0 3 * * 1 root pip3 install -U yt-dlp" | sudo tee /etc/cron.d/ytdlp-update
```
