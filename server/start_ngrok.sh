#!/usr/bin/env bash
# ==============================================================================
# FALSEDOOR: Automated ngrok Tunnel Starter
# Automatically authenticates and prints your live public URL for Netlify
# ==============================================================================
set -e

NGROK_TOKEN="3L7JPrPgQCp6OC7NgCqlDObfQbm_64CedrzrSkAuzcUeqs9UK"
PORT=8000

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       FALSEDOOR — Starting ngrok Public Tunnel               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 1. Install ngrok if not present
if ! command -v ngrok &>/dev/null; then
    echo "[1] ngrok not found. Installing ngrok..."
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt update -qq && sudo apt install -y ngrok
    echo "    ✓ ngrok installed."
else
    echo "[1] ✓ ngrok already installed."
fi

# 2. Configure Auth Token
echo "[2] Configuring your ngrok auth token..."
ngrok config add-authtoken "$NGROK_TOKEN"
echo "    ✓ Token configured successfully."

# 3. Check if FastAPI port 8000 is running
if ! nc -z 127.0.0.1 $PORT 2>/dev/null && ! ss -tlpn | grep -q ":$PORT"; then
    echo ""
    echo "⚠️  NOTE: Port 8000 is not running yet."
    echo "    Make sure to run 'python3 main.py' in another terminal."
    echo ""
fi

# 4. Start ngrok in background to fetch URL
echo "[3] Starting ngrok tunnel on port $PORT..."
killall ngrok 2>/dev/null || true
ngrok http $PORT --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for tunnel initialization
sleep 3

# Fetch the assigned public HTTPS URL from ngrok's local inspection API
PUBLIC_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*ngrok-free.app' | head -n 1 || true)

if [ -z "$PUBLIC_URL" ]; then
    PUBLIC_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*ngrok.io' | head -n 1 || true)
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   SUCCESS! YOUR NGROK TUNNEL IS ACTIVE                      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
if [ -n "$PUBLIC_URL" ]; then
    echo "║                                                              ║"
    echo "║  👉 YOUR PUBLIC API URL:                                     ║"
    echo "║     $PUBLIC_URL"
    echo "║                                                              ║"
    echo "║  Open index.html line 1624 and update:                       ║"
    echo "║     const PI_API_URL = '$PUBLIC_URL';                        ║"
    echo "║                                                              ║"
    echo "║  Then upload to Netlify (https://falsedoor.netlify.app/)     ║"
else
    echo "║  ngrok started! View status with:                            ║"
    echo "║     curl http://127.0.0.1:4040/api/tunnels                   ║"
fi
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Keep this process running. Press [Ctrl+C] to stop the tunnel."
wait $NGROK_PID
