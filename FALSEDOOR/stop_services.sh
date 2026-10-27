#!/usr/bin/env bash

# FALSEDOOR — Universal Master Stopper for Raspberry Pi / Ubuntu Server
# Gracefully terminates Honeypot decoy, FastAPI backend, and Cloudflare Tunnel

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║             FALSEDOOR — STOPPING ALL SESSIONS                    ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Stop Cowrie Honeypot Decoy
echo "[1/4] Stopping Cowrie Honeypot Decoy Service..."
COWRIE_STOPPED=0

for c_cmd in "$DIR/server/venv/bin/cowrie" "$DIR/cowrie-env/bin/cowrie" "$HOME/cowrie-env/bin/cowrie" "$HOME/cowrie/bin/cowrie" "$(command -v cowrie 2>/dev/null)"; do
    if [ -x "$c_cmd" ]; then
        $c_cmd stop >/dev/null 2>&1 || true
        COWRIE_STOPPED=1
        break
    fi
done

# Kill any remaining cowrie processes by pattern
pkill -f "twisted.*cowrie" >/dev/null 2>&1 || true
pkill -f "cowrie.*start" >/dev/null 2>&1 || true

# Remove leftover pid files
rm -f "$DIR/var/run/cowrie.pid" "$DIR/cowrie.pid" "$HOME/cowrie/var/run/cowrie.pid" /var/run/cowrie.pid 2>/dev/null || true
echo "      ✓ Honeypot decoy on port 2222 stopped."

# 2. Stop FastAPI Backend Server
echo "[2/4] Stopping FastAPI Backend SOC Service..."
pkill -9 -f "python3.*main.py" >/dev/null 2>&1 || true
pkill -9 -f "uvicorn" >/dev/null 2>&1 || true
echo "      ✓ FastAPI backend (port 8000) stopped."

# 3. Stop Cloudflare Tunnel
echo "[3/4] Stopping Cloudflare Tunnel session..."
pkill -f "cloudflared tunnel run" >/dev/null 2>&1 || true
echo "      ✓ Cloudflare Tunnel stopped."

# 4. Flush file system writes
echo "[4/4] Flushing storage write buffers..."
sync && sync
echo "      ✓ Storage buffers flushed."

echo ""
echo "=========================================================="
echo " ✓ All FALSEDOOR sessions and services are now STOPPED."
echo "   Host operating system is running in standard idle state."
echo "   To restart services anytime, run: ./start.sh"
echo "=========================================================="
echo ""