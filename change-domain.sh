#!/bin/bash

set -e

NEW_DOMAIN="$1"
EMAIL="${2:-}"
NGINX_CONF="/etc/nginx/sites-available/fbdown"
PROJECT_CONF="/var/www/fbdown/nginx.conf"

# --- Validation ---
if [ -z "$NEW_DOMAIN" ]; then
  echo "Usage:   bash change-domain.sh <new-domain.com> [your@email.com]"
  echo "Example: bash change-domain.sh mynewsite.com admin@mynewsite.com"
  exit 1
fi

# Detect current domain
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
echo "  Current domain : $CURRENT_DOMAIN"
echo "  New domain     : $NEW_DOMAIN"
echo "  SSL email      : $EMAIL"
echo "========================================"
echo ""
read -p "Proceed? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Step 1: Update Nginx server_name and SSL paths
echo ""
echo "[1/4] Updating Nginx config..."
sed -i \
  -e "s/server_name ${CURRENT_DOMAIN} www\.${CURRENT_DOMAIN}/server_name ${NEW_DOMAIN} www.${NEW_DOMAIN}/g" \
  -e "s|/etc/letsencrypt/live/${CURRENT_DOMAIN}/|/etc/letsencrypt/live/${NEW_DOMAIN}/|g" \
  "$NGINX_CONF"
echo "      Done: server_name -> $NEW_DOMAIN"

# Step 2: Verify nginx syntax before going further
echo "[2/4] Testing Nginx config syntax..."
nginx -t
echo "      Syntax OK"

# Step 3: Issue SSL cert for new domain
echo "[3/4] Issuing SSL certificate for $NEW_DOMAIN..."
certbot certonly --nginx \
  -d "$NEW_DOMAIN" -d "www.$NEW_DOMAIN" \
  --non-interactive --agree-tos \
  --email "$EMAIL"
echo "      Certificate issued"

# Reload nginx to apply new cert
systemctl reload nginx

# Step 4: Restart app
echo "[4/4] Restarting application..."
pm2 restart fb-downloader
echo "      App restarted"

# Update project's reference nginx.conf too
if [ -f "$PROJECT_CONF" ]; then
  sed -i \
    -e "s/server_name ${CURRENT_DOMAIN} www\.${CURRENT_DOMAIN}/server_name ${NEW_DOMAIN} www.${NEW_DOMAIN}/g" \
    -e "s|/etc/letsencrypt/live/${CURRENT_DOMAIN}/|/etc/letsencrypt/live/${NEW_DOMAIN}/|g" \
    "$PROJECT_CONF"
fi

echo ""
echo "========================================"
echo "  SUCCESS!"
echo "  Old domain : https://$CURRENT_DOMAIN"
echo "  New domain : https://$NEW_DOMAIN"
echo ""
echo "  Make sure DNS A record for $NEW_DOMAIN"
echo "  points to this server IP before using."
echo "========================================"
