#!/usr/bin/env bash
set -e

PORT=8000

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       FALSEDOOR — Cloudflare Unlimited Tunnel Starter        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if ! command -v cloudflared &>/dev/null && [ ! -f /usr/local/bin/cloudflared ]; then
    echo "[1] cloudflared not found. Installing..."
    ARCH=$(uname -m 2>/dev/null || echo "arm64")
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
        CF_BIN="cloudflared-linux-arm64"
    elif [ "$ARCH" = "armv7l" ] || [ "$ARCH" = "armhf" ]; then
        CF_BIN="cloudflared-linux-arm"
    else
        CF_BIN="cloudflared-linux-amd64"
    fi
    sudo curl -sSL --output /usr/local/bin/cloudflared "https://github.com/cloudflare/cloudflared/releases/latest/download/${CF_BIN}"
    sudo chmod +x /usr/local/bin/cloudflared
    echo "    ✓ cloudflared installed successfully."
else
    echo "[1] ✓ cloudflared is already installed."
fi

CF_TOKEN="eyJhIjoiOTAxODJkZjFmOTE5ZDg0YzI1ZDVjYTgwZjE4NDg0ZTMiLCJ0IjoiYTk2ZmE3MmYtNGI0My00NzJiLWFlMTQtNDQyNGI5ZjY3OTQwIiwicyI6IlpUSTRNRGhsTnpNdE9XUXlNeTAwTkdZM0xXSXdPVEV0TlRNMFpXSXdaakJtTmpsayJ9"

pkill -f "cloudflared" 2>/dev/null || true
echo "[2] Launching Cloudflare Zero Trust Tunnel (falsedoor)..."
echo ""
cloudflared tunnel run --token "$CF_TOKEN"