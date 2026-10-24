#!/usr/bin/env bash
# ==============================================================================
# FALSEDOOR: One-Click Master Launcher (Raspberry Pi / Ubuntu Server)
# Zero configuration, zero nano, starts everything automatically!
# ==============================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║             FALSEDOOR — ONE-CLICK LAUNCHER                       ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Ensure all scripts are executable
chmod +x server/*.sh ml/*.py 2>/dev/null || true

# 2. Check & Install Python packages
if ! command -v python3 &>/dev/null; then
    echo "[1/5] Installing Python3..."
    sudo apt update -qq && sudo apt install -y python3 python3-pip python3-venv
fi

# Setup Virtual Environment
if [ ! -d "server/venv" ]; then
    echo "[2/5] Setting up Python virtual environment..."
    python3 -m venv server/venv
fi
source server/venv/bin/activate
pip install --upgrade pip -q
pip install -r server/requirements.txt -q

# 3. Train ML Model if missing
if [ ! -f "ml/random_forest_model.pkl" ]; then
    echo "[3/5] Training Random Forest ML classifier..."
    python3 ml/train_model.py
else
    echo "[3/5] ✓ ML Model verified."
fi

# 4. Open Firewall Ports in UFW
if command -v ufw &>/dev/null; then
    sudo ufw allow 8000/tcp &>/dev/null || true
    sudo ufw allow 2222/tcp &>/dev/null || true
fi

# 5. Check & Install ngrok with pre-configured token
NGROK_TOKEN="3L7JPrPgQCp6OC7NgCqlDObfQbm_64CedrzrSkAuzcUeqs9UK"
if ! command -v ngrok &>/dev/null; then
    echo "[4/5] Installing ngrok..."
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt update -qq && sudo apt install -y ngrok
fi
ngrok config add-authtoken "$NGROK_TOKEN" &>/dev/null

# 6. Start FastAPI Backend in background
echo "[5/5] Launching FastAPI Backend & ngrok Tunnel..."
killall uvicorn python3 ngrok 2>/dev/null || true
cd server
python3 main.py > /tmp/falsedoor_api.log 2>&1 &
API_PID=$!
cd "$DIR"

# Wait for API to initialize
sleep 2

# Check if a permanent static ngrok domain is configured
STATIC_DOMAIN=""
if [ -f "$DIR/server/ngrok_domain.txt" ]; then
    STATIC_DOMAIN=$(cat "$DIR/server/ngrok_domain.txt" | tr -d '\r\n ')
fi

# Start ngrok tunnel on port 8000 (with static domain if provided)
if [ -n "$STATIC_DOMAIN" ]; then
    echo "    Using permanent static domain: $STATIC_DOMAIN"
    ngrok http 8000 --url="$STATIC_DOMAIN" --log=stdout > /tmp/ngrok.log 2>&1 &
else
    ngrok http 8000 --log=stdout > /tmp/ngrok.log 2>&1 &
fi
NGROK_PID=$!

sleep 3

# Retrieve public HTTPS URL
PUBLIC_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*ngrok-free.app' | head -n 1 || true)
if [ -z "$PUBLIC_URL" ]; then
    PUBLIC_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*ngrok.io' | head -n 1 || true)
fi

PI_LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          FALSEDOOR HONEYPOT & TELEMETRY STREAM IS LIVE!          ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║                                                                  ║"
echo "║  🎯 Honeypot SSH Port:  2222 (Ready for attacker connections)    ║"
echo "║  ⚡ Local API:          http://$PI_LOCAL_IP:8000                 ║"
if [ -n "$PUBLIC_URL" ]; then
echo "║  🌐 Public ngrok URL:   $PUBLIC_URL"
echo "║                                                                  ║"
echo "║  👉 WHAT TO DO NOW (SUPER EASY — NO NANO NEEDED!):               ║"
echo "║     1. Open your browser: https://falsedoor.netlify.app/         ║"
echo "║     2. Click the top-right [STREAMING LIVE] badge                ║"
echo "║     3. Paste: $PUBLIC_URL"
echo "║     4. Click 'Save & Connect'                                    ║"
else
echo "║  🌐 Public ngrok:       Starting up... Check: curl localhost:4040 ║"
fi
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Honeypot is active and monitoring. Press [Ctrl+C] to stop all services."

# Graceful cleanup on Ctrl+C
trap "echo ''; echo 'Shutting down FALSEDOOR...'; kill $API_PID $NGROK_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Tail API log in foreground
tail -f /tmp/falsedoor_api.log
