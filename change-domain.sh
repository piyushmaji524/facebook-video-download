#!/bin/bash

set -e

NEW_DOMAIN="$1"
EMAIL="${2:-}"
NGINX_CONF="/etc/nginx/sites-available/fbdown"
FB_CONF="/etc/nginx/sites-available/filebrowser"
PROJECT_CONF="/var/www/fbdown/nginx.conf"

# --- Validation ---
if [ -z "$NEW_DOMAIN" ]; then
  echo "Usage:   bash change-domain.sh <new-domain.com> [your@email.com]"
  echo "Example: bash change-domain.sh mynewsite.com admin@mynewsite.com"
  exit 1
fi

# Detect current main domain
CURRENT_DOMAIN=$(grep -oP 'server_name \K[^ ;]+' "$NGINX_CONF" 2>/dev/null | grep -v '^www\.' | head -1)
if [ -z "$CURRENT_DOMAIN" ]; then
  echo "ERROR: Could not detect current domain from $NGINX_CONF"
  exit 1
fi

if [ -z "$EMAIL" ]; then
  EMAIL="admin@${NEW_DOMAIN}"
fi

echo "========================================"
echo "  VidDown — Domain Change Script"
echo "========================================"
echo "  Current domain  : $CURRENT_DOMAIN"
echo "  New domain      : $NEW_DOMAIN"
echo "  Files subdomain : files.$NEW_DOMAIN"
echo "  SSL email       : $EMAIL"
echo "========================================"
echo ""
read -p "Proceed? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Step 1: Update main app Nginx config
echo ""
echo "[1/5] Updating main Nginx config..."
sed -i \
  -e "s/server_name ${CURRENT_DOMAIN} www\.${CURRENT_DOMAIN}/server_name ${NEW_DOMAIN} www.${NEW_DOMAIN}/g" \
  -e "s|/etc/letsencrypt/live/${CURRENT_DOMAIN}/|/etc/letsencrypt/live/${NEW_DOMAIN}/|g" \
  "$NGINX_CONF"
echo "      Done: $CURRENT_DOMAIN -> $NEW_DOMAIN"

# Step 2: Update FileBrowser subdomain config (files.olddomain -> files.newdomain)
echo "[2/5] Updating FileBrowser subdomain config..."
if [ -f "$FB_CONF" ]; then
  sed -i "s/files\.${CURRENT_DOMAIN}/files.${NEW_DOMAIN}/g" "$FB_CONF"
  echo "      Done: files.$CURRENT_DOMAIN -> files.$NEW_DOMAIN"
else
  echo "      Skipped: $FB_CONF not found"
fi

# Step 3: Test nginx syntax
echo "[3/5] Testing Nginx config syntax..."
nginx -t
echo "      Syntax OK"

# Step 4: Issue SSL certificates
echo "[4/5] Issuing SSL certificates..."
certbot certonly --nginx \
  -d "$NEW_DOMAIN" -d "www.$NEW_DOMAIN" \
  --non-interactive --agree-tos \
  --email "$EMAIL"
echo "      Main domain cert issued"

certbot certonly --nginx \
  -d "files.$NEW_DOMAIN" \
  --non-interactive --agree-tos \
  --email "$EMAIL" || echo "      Warning: files.$NEW_DOMAIN cert skipped (DNS may not be set)"

# Reload nginx to apply new certs
systemctl reload nginx

# Step 5: Restart app
echo "[5/5] Restarting application..."
pm2 restart fb-downloader
echo "      Done"

# Update project reference files
if [ -f "$PROJECT_CONF" ]; then
  sed -i \
    -e "s/server_name ${CURRENT_DOMAIN} www\.${CURRENT_DOMAIN}/server_name ${NEW_DOMAIN} www.${NEW_DOMAIN}/g" \
    -e "s|/etc/letsencrypt/live/${CURRENT_DOMAIN}/|/etc/letsencrypt/live/${NEW_DOMAIN}/|g" \
    "$PROJECT_CONF"
fi

echo ""
echo "========================================"
echo "  SUCCESS!"
echo ""
echo "  Main site   : https://$NEW_DOMAIN"
echo "  File manager: http://files.$NEW_DOMAIN"
echo ""
echo "  DNS records needed at your registrar:"
echo "    A  @           -> $(hostname -I | awk '{print $1}')"
echo "    A  www         -> $(hostname -I | awk '{print $1}')"
echo "    A  files       -> $(hostname -I | awk '{print $1}')"
echo "========================================"
