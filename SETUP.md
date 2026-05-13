# VidDown — Complete Setup & Deployment Guide

This guide covers everything from a **fresh Ubuntu VPS** to a **live website with SSL**.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [VPS Server Setup](#2-vps-server-setup)
3. [Upload Project Files](#3-upload-project-files)
4. [Install Dependencies & Build](#4-install-dependencies--build)
5. [Start App with PM2](#5-start-app-with-pm2)
6. [Configure Nginx](#6-configure-nginx)
7. [Point Domain to VPS](#7-point-domain-to-vps)
8. [Install SSL Certificate](#8-install-ssl-certificate)
9. [Firewall Setup](#9-firewall-setup)
10. [Verify Everything Works](#10-verify-everything-works)
11. [Change Domain Later](#11-change-domain-later)
12. [Maintenance Commands](#12-maintenance-commands)

---

## 1. Prerequisites

Before starting, you need:

| What | Details |
|------|---------|
| VPS | Ubuntu 20.04 or 22.04 (minimum 1GB RAM) |
| Domain | Any domain (e.g. from Namecheap, Hostinger, GoDaddy) |
| SSH Access | `ssh root@YOUR_VPS_IP` must work |
| Local Tools | Windows: PowerShell + Posh-SSH module |

---

## 2. VPS Server Setup

SSH into your VPS and run these commands one by one:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node
node -v   # should show v20.x.x
npm -v

# Install Python3, pip, ffmpeg
apt install -y python3 python3-pip ffmpeg

# Install yt-dlp
pip3 install yt-dlp
yt-dlp --version   # verify

# Install Nginx
apt install -y nginx

# Install Certbot (for SSL)
apt install -y certbot python3-certbot-nginx

# Install PM2 (process manager)
npm install -g pm2

# Create project directory
mkdir -p /var/www/fbdown
```

---

## 3. Upload Project Files

### Option A — ZIP upload (Windows PowerShell)

On your **local Windows machine**:

```powershell
# Install Posh-SSH if not already installed
Install-Module -Name Posh-SSH -Force

# Zip the project (exclude node_modules)
Compress-Archive -Path ".\server", ".\client", ".\nginx.conf", ".\change-domain.sh" `
  -DestinationPath ".\fbdown.zip" -Force

# Upload to VPS
$pass = ConvertTo-SecureString "YOUR_VPS_PASSWORD" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential("root", $pass)
Set-SCPItem -ComputerName "YOUR_VPS_IP" -Credential $cred -AcceptKey `
  -Path ".\fbdown.zip" -Destination "/var/www/fbdown/"
```

### Option B — Git clone (on VPS)

```bash
cd /var/www/fbdown
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
```

### Option C — Manual SCP (Linux/Mac)

```bash
scp -r ./server ./client ./nginx.conf ./change-domain.sh root@YOUR_VPS_IP:/var/www/fbdown/
```

---

## 4. Install Dependencies & Build

On the **VPS**, after uploading:

```bash
cd /var/www/fbdown

# If uploaded as ZIP, unzip first
unzip -o fbdown.zip

# Install backend dependencies
cd server
npm install

# Install frontend dependencies and build
cd ../client
npm install
npm run build
# Built files go to: /var/www/fbdown/server/public/

cd /var/www/fbdown
```

---

## 5. Start App with PM2

```bash
cd /var/www/fbdown/server

# Start the app
NODE_ENV=production pm2 start index.js --name "fb-downloader"

# Check it's running
pm2 status

# Save PM2 config so it restarts after reboot
pm2 save
pm2 startup
# Run the command that pm2 startup prints (copy-paste it)
```

Verify the app is running:
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok"}
```

---

## 6. Configure Nginx

```bash
# Copy the nginx config template
cp /var/www/fbdown/nginx.conf /etc/nginx/sites-available/fbdown

# Open and replace 'vastuai.online' with YOUR domain
nano /etc/nginx/sites-available/fbdown
```

In the file, change every occurrence of `vastuai.online` to your domain.
The file has 4 places to change:
- Line 3: `server_name yourdomain.com www.yourdomain.com;`
- Line 9: `server_name yourdomain.com www.yourdomain.com;`
- Line 11: `/etc/letsencrypt/live/yourdomain.com/fullchain.pem;`
- Line 12: `/etc/letsencrypt/live/yourdomain.com/privkey.pem;`

```bash
# Enable the site
ln -sf /etc/nginx/sites-available/fbdown /etc/nginx/sites-enabled/fbdown

# Remove default nginx site (if exists)
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t
# Should say: syntax is ok

# Start nginx
systemctl enable nginx
systemctl start nginx
```

---

## 7. Point Domain to VPS

Go to your domain registrar (Hostinger, Namecheap, etc.) and add these **DNS A records**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` (or blank) | `YOUR_VPS_IP` | 300 |
| A | `www` | `YOUR_VPS_IP` | 300 |

Wait for DNS to propagate (usually 5–30 minutes).

Verify DNS is working:
```bash
# On your local machine
nslookup yourdomain.com
# Should show your VPS IP
```

---

## 8. Install SSL Certificate

Once DNS is pointing to your VPS:

```bash
# Get free SSL from Let's Encrypt
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms (A)
# - Choose redirect option (2) — recommended

# Verify auto-renewal works
certbot renew --dry-run
```

SSL renews automatically every 90 days. Nothing extra needed.

---

## 9. Firewall Setup

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

---

## 10. Verify Everything Works

```bash
# 1. App health check
curl https://yourdomain.com/health
# Expected: {"status":"ok"}

# 2. Check PM2 status
pm2 status

# 3. Check Nginx status
systemctl status nginx

# 4. View app logs (for debugging)
pm2 logs fb-downloader --lines 20
```

Open `https://yourdomain.com` in your browser — the site should load!

---

## 11. Change Domain Later

A script is included to automate domain switching.

### Step A — Update DNS at your registrar

Add A records for the **new domain** pointing to the same VPS IP.
Wait 5–30 minutes for DNS propagation.

### Step B — Run the change-domain script

SSH into your VPS and run:

```bash
bash /var/www/fbdown/change-domain.sh newdomain.com your@email.com
```

**What the script does automatically:**
1. Detects the current domain from Nginx config
2. Updates `server_name` in Nginx config
3. Issues a new SSL certificate via Certbot
4. Reloads Nginx
5. Restarts the app via PM2

**Example:**
```bash
bash /var/www/fbdown/change-domain.sh mysite.com admin@mysite.com
```

> Note: The old domain's SSL cert is kept by Let's Encrypt but the Nginx config will point to the new one.

---

## 12. Maintenance Commands

### App Management

```bash
pm2 restart fb-downloader    # Restart app
pm2 stop fb-downloader       # Stop app
pm2 logs fb-downloader       # View live logs
pm2 logs fb-downloader --lines 50  # Last 50 log lines
pm2 monit                    # Live CPU/RAM monitor
```

### Update yt-dlp (Do this weekly!)

Facebook/Instagram/YouTube change their APIs frequently. Keep yt-dlp updated:

```bash
pip3 install -U yt-dlp
```

Set up auto-update every Monday at 3am:
```bash
echo "0 3 * * 1 root pip3 install -U yt-dlp" | tee /etc/cron.d/ytdlp-update
```

### Deploy Code Updates

When you make changes locally:

```powershell
# Windows PowerShell — rezip and upload
Compress-Archive -Path ".\server", ".\client" -DestinationPath ".\fbdown.zip" -Force
$pass = ConvertTo-SecureString "YOUR_PASSWORD" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential("root", $pass)
Set-SCPItem -ComputerName "YOUR_VPS_IP" -Credential $cred -AcceptKey `
  -Path ".\fbdown.zip" -Destination "/var/www/fbdown/"
```

Then on VPS:
```bash
cd /var/www/fbdown
unzip -o fbdown.zip
cd client && npm run build
cd /var/www/fbdown
pm2 restart fb-downloader
```

### Nginx

```bash
nginx -t                      # Test config syntax
systemctl reload nginx        # Reload config (no downtime)
systemctl restart nginx       # Full restart
tail -f /var/log/nginx/error.log  # View error logs
```

### SSL Certificate

```bash
certbot renew                 # Manual renewal
certbot certificates          # List all certificates
```

---

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| `403 Forbidden` | Nginx serving wrong folder | Check nginx config `proxy_pass` |
| `ERR_SSL_PROTOCOL_ERROR` | SSL cert not issued yet | Run `certbot --nginx -d yourdomain.com` |
| `502 Bad Gateway` | App not running | Run `pm2 restart fb-downloader` |
| Video not found error | yt-dlp outdated | Run `pip3 install -U yt-dlp` |
| Instagram no sound | Normal — use "Sound" (green) button | Server merges video+audio automatically |
| DNS not resolving | DNS not propagated yet | Wait 5-30 min, check with `nslookup yourdomain.com` |

---

## Ports Reference

| Service | Port | Notes |
|---------|------|-------|
| Node.js app | 5000 | Internal only, proxied by Nginx |
| Nginx HTTP | 80 | Redirects to HTTPS |
| Nginx HTTPS | 443 | Main site |
| SSH | 22 | Server access |

---

*Built with ❤️ — VidDown supports Facebook, Instagram & YouTube*
