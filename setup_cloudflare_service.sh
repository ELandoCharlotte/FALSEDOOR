#!/usr/bin/env bash
set -e

CF_TOKEN="eyJhIjoiOTAxODJkZjFmOTE5ZDg0YzI1ZDVjYTgwZjE4NDg0ZTMiLCJ0IjoiYTk2ZmE3MmYtNGI0My00NzJiLWFlMTQtNDQyNGI5ZjY3OTQwIiwicyI6IlpUSTRNRGhsTnpNdE9XUXlNeTAwTkdZM0xXSXdPVEV0TlRNMFpXSXdaakJtTmpsayJ9"

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║      FALSEDOOR — Cloudflare Zero Trust Tunnel Setup              ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

ARCH=$(uname -m 2>/dev/null || echo "arm64")
if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    CF_BIN="cloudflared-linux-arm64"
elif [ "$ARCH" = "armv7l" ] || [ "$ARCH" = "armhf" ]; then
    CF_BIN="cloudflared-linux-arm"
else
    CF_BIN="cloudflared-linux-amd64"
fi

echo "[1/4] Downloading cloudflared (${CF_BIN})..."
sudo curl -sSL -L --output /usr/local/bin/cloudflared "https://github.com/cloudflare/cloudflared/releases/latest/download/${CF_BIN}"
sudo chmod +x /usr/local/bin/cloudflared

echo "[2/4] Configuring Cloudflare system service..."
sudo pkill -f cloudflared 2>/dev/null || true
sudo cloudflared service uninstall 2>/dev/null || true
sudo cloudflared service install "$CF_TOKEN"

echo "[3/4] Enabling and starting cloudflared service..."
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl restart cloudflared

echo "[4/4] Verifying connection status..."
sleep 2
sudo systemctl status cloudflared --no-pager

echo ""
echo "✅ Cloudflare Tunnel is now active and permanently connected!"