#!/usr/bin/env bash
# ==============================================================================
# FALSEDOOR: FastAPI Backend Startup Script
# Raspberry Pi / Ubuntu Server — used when dashboard is on Netlify
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

FALSEDOOR_ROOT="$(dirname "$DIR")"

echo "======================================================================"
echo "  FALSEDOOR - FastAPI Backend (Netlify Mode)"
echo "======================================================================"
echo "  Server dir:  $DIR"
echo "  FALSEDOOR:   $FALSEDOOR_ROOT"
echo "  Cowrie log:  $FALSEDOOR_ROOT/var/log/cowrie/cowrie.json"
echo "  ML model:    $FALSEDOOR_ROOT/ml/random_forest_model.pkl"
echo ""
echo "  ⚠️  IMPORTANT: Port 8000 must be reachable from the internet"
echo "     so that falsedoor.netlify.app can call this API."
echo "     Options:"
echo "     A) Open port 8000 on your router (port forward to Pi)"
echo "     B) Use ngrok: ngrok http 8000  (free tunnel)"
echo "     C) Use a reverse proxy (nginx) with a domain + SSL"
echo "======================================================================"

if ! command -v python3 &> /dev/null; then
    echo "[-] Python3 not found. Installing..."
    sudo apt update && sudo apt install -y python3 python3-pip python3-venv
fi

if [ ! -d "venv" ]; then
    echo "[+] Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "[+] Installing required packages..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

if [ ! -f "$FALSEDOOR_ROOT/ml/random_forest_model.pkl" ]; then
    echo ""
    echo "[!] WARNING: random_forest_model.pkl NOT FOUND!"
    echo "[!] Run: cd $FALSEDOOR_ROOT && python3 ml/train_model.py"
    echo ""
fi

# Allow port 8000 through ufw firewall if available
if command -v ufw &> /dev/null; then
    echo "[+] Opening port 8000 in UFW firewall..."
    sudo ufw allow 8000/tcp || true
fi

echo "[+] Starting FastAPI server on port 8000 (all interfaces)..."
echo "[+] Netlify dashboard will connect to: http://$(hostname -I | awk '{print $1}'):8000"
echo "[+] API Docs:     http://0.0.0.0:8000/docs"
echo "[+] Health check: http://0.0.0.0:8000/api/health"
echo "----------------------------------------------------------------------"
echo ""

python3 main.py
