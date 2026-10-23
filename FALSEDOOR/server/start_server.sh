#!/usr/bin/env bash
# ==============================================================================
# FALSEDOOR: FastAPI Backend Startup Script
# Place this inside ~/FALSEDOOR/server/start_server.sh on your Ubuntu server
# ==============================================================================

set -e

# Navigate to the server/ folder where this script lives
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Go one level up to reach the FALSEDOOR root folder
FALSEDOOR_ROOT="$(dirname "$DIR")"

echo "======================================================================"
echo "  FALSEDOOR - FastAPI Backend Startup"
echo "======================================================================"
echo "  Server dir:  $DIR"
echo "  FALSEDOOR:   $FALSEDOOR_ROOT"
echo "  Cowrie log:  $FALSEDOOR_ROOT/var/log/cowrie/cowrie.json"
echo "  ML model:    $FALSEDOOR_ROOT/ml/random_forest_model.pkl"
echo "======================================================================"

# Check Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "[-] Python3 not found. Installing..."
    sudo apt update && sudo apt install -y python3 python3-pip python3-venv
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "[+] Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/upgrade requirements
echo "[+] Installing required packages (fastapi, uvicorn, scikit-learn, pandas)..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

# Check if Random Forest model exists
if [ ! -f "$FALSEDOOR_ROOT/ml/random_forest_model.pkl" ]; then
    echo ""
    echo "[!] WARNING: random_forest_model.pkl NOT FOUND!"
    echo "[!] You need to run: cd $FALSEDOOR_ROOT && python3 ml/train_model.py"
    echo "[!] The API will still start but predictions will not work."
    echo ""
fi

echo "[+] Starting FastAPI server on port 8000..."
echo "[+] Dashboard API: http://0.0.0.0:8000"
echo "[+] API Docs:      http://0.0.0.0:8000/docs"
echo "[+] Health check:  http://0.0.0.0:8000/api/health"
echo "----------------------------------------------------------------------"
echo ""

python3 main.py
