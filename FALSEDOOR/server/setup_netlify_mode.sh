#!/usr/bin/env bash
# ==============================================================================
# FALSEDOOR: Netlify Mode Setup — Run this ONCE on your Raspberry Pi
# This configures your Pi so falsedoor.netlify.app fetches live data from it.
# ==============================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"
FALSEDOOR_ROOT="$(dirname "$DIR")"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   FALSEDOOR — Netlify ↔ Raspberry Pi Setup                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Get Pi's local IP ──────────────────────────────────────
PI_IP=$(hostname -I | awk '{print $1}')
echo "[1] Pi Local IP: $PI_IP"
echo "    API will be accessible at: http://$PI_IP:8000"

# ── Step 2: Open port 8000 in UFW firewall ─────────────────────────
if command -v ufw &>/dev/null; then
    echo "[2] Opening port 8000 in UFW firewall..."
    sudo ufw allow 8000/tcp
    sudo ufw allow 2222/tcp
    sudo ufw --force enable
    echo "    ✓ UFW rules applied."
else
    echo "[2] UFW not found. Skipping firewall config."
fi

# ── Step 3: Install Python venv & deps ────────────────────────────
echo "[3] Setting up Python environment..."
if ! command -v python3 &>/dev/null; then
    sudo apt update && sudo apt install -y python3 python3-pip python3-venv
fi
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "    ✓ Python deps installed."

# ── Step 4: Check for ML model ────────────────────────────────────
if [ ! -f "$FALSEDOOR_ROOT/ml/random_forest_model.pkl" ]; then
    echo ""
    echo "⚠️  [4] ML model NOT found!"
    echo "    Run this to train it:"
    echo "    cd $FALSEDOOR_ROOT && python3 ml/train_model.py"
    echo ""
else
    echo "[4] ✓ ML model found."
fi

# ── Step 5: Show what URL to put in index.html ────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ACTION REQUIRED — Update your Netlify index.html            ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                              ║"
echo "║  Find this line in index.html:                               ║"
echo "║    const PI_API_URL = 'http://YOUR_PI_IP_HERE:8000';        ║"
echo "║                                                              ║"
echo "║  Replace with:                                               ║"
echo "║    const PI_API_URL = 'http://$PI_IP:8000';             ║"
echo "║                                                              ║"
echo "║  ⚠️  If your Pi is behind a NAT router:                       ║"
echo "║     Port-forward router port 8000 → $PI_IP:8000          ║"
echo "║     Then use your public IP (check: curl ifconfig.me)        ║"
echo "║                                                              ║"
echo "║  OR use ngrok for a free public tunnel:                      ║"
echo "║     ngrok http 8000                                          ║"
echo "║     Then use the https://xxxx.ngrok.io URL instead           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "[5] Starting FastAPI backend now..."
echo ""
python3 main.py
