#!/bin/bash
# ==============================================================================
# FALSEDOOR: Start All Services on Ubuntu Server / Raspberry Pi
# ==============================================================================

echo "🚀 [1/2] Starting Cowrie Honeypot (Port 2222)..."
if command -v cowrie &> /dev/null; then
    cowrie start
elif [ -f ~/FALSEDOOR/bin/cowrie ]; then
    ~/FALSEDOOR/bin/cowrie start
elif [ -f ~/cowrie/bin/cowrie ]; then
    ~/cowrie/bin/cowrie start
else
    echo "⚠️  cowrie command not found in PATH, trying cowrie-env..."
    source ~/FALSEDOOR/cowrie-env/bin/activate 2>/dev/null || source ~/cowrie-env/bin/activate 2>/dev/null || true
    cowrie start || true
fi

echo "📊 [2/2] Starting FALSEDOOR Web Dashboard (Port 8000)..."
cd ~/FALSEDOOR/server
nohup python3 main.py > ~/FALSEDOOR/server.log 2>&1 &

echo ""
echo "✅ All services started successfully!"
echo "   - Cowrie Honeypot: Port 2222"
echo "   - SOC Web UI:      Port 8000 (http://$(hostname -I | awk '{print $1}'):8000)"
