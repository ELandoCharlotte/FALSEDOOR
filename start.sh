#!/usr/bin/env bash

# FALSEDOOR — Universal Master Launcher for Raspberry Pi / Ubuntu Server
# Seamlessly starts Honeypot Decoy (2222), FastAPI SOC Server (8000), and Cloudflare Tunnel

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║             FALSEDOOR — ONE-CLICK MASTER LAUNCHER                ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Prevent running Cowrie as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  WARNING: You are currently running as root (or via sudo)."
    echo "    Cowrie Honeypot cannot run as root for security reasons."
    echo "    Recommendation: Run as normal user (e.g., 'bash start.sh')."
    echo ""
    sleep 2
fi

# Ensure all scripts are executable
chmod +x "$DIR"/*.sh "$DIR"/server/*.sh "$DIR"/ml/*.py 2>/dev/null || true

# 1. Verify Python 3 & venv support
echo "[1/5] Checking Python environment..."
if ! command -v python3 >/dev/null 2>&1; then
    echo "      Installing Python3..."
    sudo apt update -qq && sudo apt install -y python3 python3-pip python3-venv python3-full
fi

if ! python3 -c "import venv" >/dev/null 2>&1; then
    echo "      Installing python3-venv..."
    sudo apt update -qq && sudo apt install -y python3-venv python3-pip
fi

# 2. Virtual environment setup
VENV_DIR="$DIR/server/venv"
if [ ! -d "$VENV_DIR" ] || [ ! -f "$VENV_DIR/bin/python3" ]; then
    echo "      Creating virtual environment at server/venv..."
    python3 -m venv --system-site-packages "$VENV_DIR" 2>/dev/null || python3 -m venv "$VENV_DIR"
fi

# 3. Check and install dependencies
echo "[2/5] Checking Python dependencies..."
if ! "$VENV_DIR/bin/python3" -c "import fastapi, uvicorn, sklearn, pandas, numpy" >/dev/null 2>&1; then
    echo "      Installing required packages (FastAPI, scikit-learn, uvicorn)..."
    "$VENV_DIR/bin/pip" install --upgrade pip -q 2>/dev/null || true
    "$VENV_DIR/bin/pip" install -r "$DIR/server/requirements.txt" -q 2>/dev/null || "$VENV_DIR/bin/pip" install -r "$DIR/server/requirements.txt"
    echo "      ✓ Packages installed."
else
    echo "      ✓ All Python packages verified."
fi

# 4. Train ML model if not present
if [ ! -f "$DIR/ml/random_forest_model.pkl" ]; then
    echo "[3/5] Training Random Forest ML classifier..."
    "$VENV_DIR/bin/python3" "$DIR/ml/train_model.py"
else
    echo "[3/5] ✓ Machine Learning model verified."
fi

# Open firewall ports if ufw or iptables exist
if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow 8000/tcp >/dev/null 2>&1 || true
    sudo ufw allow 2222/tcp >/dev/null 2>&1 || true
fi
sudo iptables -I INPUT -p tcp --dport 2222 -j ACCEPT >/dev/null 2>&1 || true
sudo iptables -I INPUT -p tcp --dport 8000 -j ACCEPT >/dev/null 2>&1 || true

# 5. Cloudflare Tunnel binary check
CF_TOKEN="eyJhIjoiOTAxODJkZjFmOTE5ZDg0YzI1ZDVjYTgwZjE4NDg0ZTMiLCJ0IjoiYTk2ZmE3MmYtNGI0My00NzJiLWFlMTQtNDQyNGI5ZjY3OTQwIiwicyI6IlpUSTRNRGhsTnpNdE9XUXlNeTAwTkdZM0xXSXdPVEV0TlRNMFpXSXdaakJtTmpsayJ9"

if ! command -v cloudflared >/dev/null 2>&1 && [ ! -f /usr/local/bin/cloudflared ]; then
    echo "[4/5] Installing cloudflared daemon..."
    ARCH=$(uname -m 2>/dev/null || echo "arm64")
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
        CF_BIN="cloudflared-linux-arm64"
    elif [ "$ARCH" = "armv7l" ] || [ "$ARCH" = "armhf" ]; then
        CF_BIN="cloudflared-linux-arm"
    else
        CF_BIN="cloudflared-linux-amd64"
    fi
    sudo curl -sSL -L --output /usr/local/bin/cloudflared "https://github.com/cloudflare/cloudflared/releases/latest/download/${CF_BIN}" 2>/dev/null && sudo chmod +x /usr/local/bin/cloudflared 2>/dev/null || true
fi

# 6. Start Cowrie Honeypot (Port 2222)
echo "[4/5] Launching Cowrie Decoy Honeypot (Port 2222)..."
mkdir -p "$DIR/var/log/cowrie" "$DIR/server/var/log/cowrie" "$DIR/var/run" "$DIR/var/lib/cowrie/downloads" "$HOME/var/log/cowrie" "$HOME/var/run" "$HOME/cowrie/var/log/cowrie" 2>/dev/null || true
touch "$DIR/var/log/cowrie/cowrie.json" "$DIR/server/var/log/cowrie/cowrie.json" "$HOME/var/log/cowrie/cowrie.json" 2>/dev/null || true

# Clean stale PID files
for pidfile in "$DIR/var/run/cowrie.pid" "$DIR/cowrie.pid" "$HOME/cowrie/var/run/cowrie.pid" /var/run/cowrie.pid; do
    if [ -f "$pidfile" ]; then
        old_pid=$(cat "$pidfile" 2>/dev/null || true)
        if [ -n "$old_pid" ] && ! kill -0 "$old_pid" 2>/dev/null; then
            rm -f "$pidfile" 2>/dev/null || true
        fi
    fi
done

COWRIE_EXEC=""
if [ -x "$DIR/server/venv/bin/cowrie" ]; then
    COWRIE_EXEC="$DIR/server/venv/bin/cowrie"
elif [ -x "$DIR/cowrie-env/bin/cowrie" ]; then
    COWRIE_EXEC="$DIR/cowrie-env/bin/cowrie"
elif [ -x "$HOME/cowrie-env/bin/cowrie" ]; then
    COWRIE_EXEC="$HOME/cowrie-env/bin/cowrie"
elif [ -x "$HOME/cowrie/bin/cowrie" ]; then
    COWRIE_EXEC="$HOME/cowrie/bin/cowrie"
elif [ -x "$HOME/cowrie/cowrie-env/bin/cowrie" ]; then
    COWRIE_EXEC="$HOME/cowrie/cowrie-env/bin/cowrie"
elif [ -x "$HOME/.local/bin/cowrie" ]; then
    COWRIE_EXEC="$HOME/.local/bin/cowrie"
elif command -v cowrie >/dev/null 2>&1; then
    COWRIE_EXEC="$(command -v cowrie)"
fi

if [ -z "$COWRIE_EXEC" ] && [ "$EUID" -ne 0 ]; then
    echo "      Installing Cowrie in $DIR/cowrie-env..."
    python3 -m venv "$DIR/cowrie-env" 2>/dev/null || true
    "$DIR/cowrie-env/bin/pip" install --upgrade pip -q 2>/dev/null || true
    "$DIR/cowrie-env/bin/pip" install cowrie -q 2>/dev/null || true
    if [ -x "$DIR/cowrie-env/bin/cowrie" ]; then
        COWRIE_EXEC="$DIR/cowrie-env/bin/cowrie"
    fi
fi

if [ -n "$COWRIE_EXEC" ] && [ -x "$COWRIE_EXEC" ]; then
    $COWRIE_EXEC start >/dev/null 2>&1 || true
elif command -v cowrie >/dev/null 2>&1; then
    cowrie start >/dev/null 2>&1 || true
fi

sleep 1
COWRIE_LIVE=0
if (echo > /dev/tcp/127.0.0.1/2222) 2>/dev/null; then
    COWRIE_LIVE=1
elif ss -tlpn 2>/dev/null | grep -q ":2222 "; then
    COWRIE_LIVE=1
elif netstat -tlpn 2>/dev/null | grep -q ":2222 "; then
    COWRIE_LIVE=1
fi

if [ "$COWRIE_LIVE" -eq 1 ]; then
    echo "      ✓ Cowrie SSH Honeypot is ARMED and LISTENING on port 2222"
else
    echo "      ℹ Cowrie initialized. Honeypot decoy active."
fi

# 7. Start FastAPI Backend & Cloudflare Tunnel
echo "[5/5] Launching FastAPI SOC Server & Cloudflare Tunnel..."
pkill -9 -f "main.py" 2>/dev/null || true
pkill -9 -f "uvicorn" 2>/dev/null || true
sleep 1

cd "$DIR/server"
if [ -f "$VENV_DIR/bin/python3" ]; then
    nohup "$VENV_DIR/bin/python3" main.py > /tmp/falsedoor_api.log 2>&1 &
elif [ -f "venv/bin/python3" ]; then
    nohup venv/bin/python3 main.py > /tmp/falsedoor_api.log 2>&1 &
else
    nohup python3 main.py > /tmp/falsedoor_api.log 2>&1 &
fi
API_PID=$!
disown $API_PID 2>/dev/null || true
cd "$DIR"

sleep 2
if curl -s http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo "      ✓ FastAPI Backend is LIVE on port 8000 (PID: $API_PID)"
else
    echo "      ✓ FastAPI Backend running in background (PID: $API_PID)"
fi

# Launch Cloudflare Tunnel
if systemctl is-active --quiet cloudflared 2>/dev/null; then
    echo "      ✓ Cloudflare Tunnel systemd service is active."
else
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    nohup cloudflared tunnel run --token "$CF_TOKEN" > /tmp/cloudflared.log 2>&1 &
    CF_PID=$!
    disown $CF_PID 2>/dev/null || true
    echo "      ✓ Cloudflare Tunnel connected to https://falsedoor.dev"
fi

PI_LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$PI_LOCAL_IP" ] && PI_LOCAL_IP="127.0.0.1"

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                           FALSEDOOR IS LIVE                              ║"
echo "╠══════════════════════════════════════════════════════════════════════════╣"
echo "║                                                                          ║"
printf "║  %-70.70s  ║\n" "Honeypot SSH Decoy: port 2222 (ssh -p 2222 root@${PI_LOCAL_IP})"
printf "║  %-70.70s  ║\n" "Local SOC Dashboard: http://${PI_LOCAL_IP}:8000"
printf "║  %-70.70s  ║\n" "Public SOC Domain  : https://falsedoor.dev"
printf "║  %-70.70s  ║\n" "Stop Services Cmd  : ./stop_services.sh (or ./stop.sh)"
echo "║                                                                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Press [Ctrl+C] to exit log stream (services will remain running in background)."
echo "Log file: /tmp/falsedoor_api.log"
echo ""

trap "echo ''; echo 'Exiting log stream. FALSEDOOR services remain running in background.'; exit 0" SIGINT SIGTERM

tail -f /tmp/falsedoor_api.log
