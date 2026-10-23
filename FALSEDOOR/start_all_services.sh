#!/bin/bash
# ==============================================================================
# FALSEDOOR: Start All Services Script
# ==============================================================================
set -e

echo "🚀 [1/3] Verifying Admin SSH Service..."
sudo systemctl start ssh || sudo service ssh start
echo "   ✅ Admin SSH active."

echo "🍯 [2/3] Starting Cowrie Honeypot Decoy (Port 2222)..."
if systemctl list-unit-files | grep -q cowrie.service; then
    sudo systemctl start cowrie
else
    # Fallback to manual startup if not configured as systemd service
    cd ~/FALSEDOOR
    if [ -f "bin/cowrie" ]; then
        bin/cowrie start || true
    fi
fi
echo "   ✅ Cowrie Honeypot started."

echo "📊 [3/3] Starting FALSEDOOR FastAPI Telemetry & SOC Dashboard (Port 8000)..."
if systemctl list-unit-files | grep -q falsedoor-web.service; then
    sudo systemctl restart falsedoor-web
elif systemctl list-unit-files | grep -q falsedoor-api.service; then
    sudo systemctl restart falsedoor-api
else
    # Fallback manual startup in background
    cd ~/FALSEDOOR/server
    nohup ./start_server.sh > ~/FALSEDOOR/server.log 2>&1 &
fi
echo "   ✅ FALSEDOOR Web SOC Dashboard active on http://localhost:8000"

echo ""
echo "=============================================================================="
echo "🎯 ALL FALSEDOOR SERVICES ARE OPERATIONAL:"
echo "   - Admin SSH:       Port 2022"
echo "   - Cowrie Decoy:    Port 2222"
echo "   - SOC Web UI:      Port 8000 (http://<ip>:8000)"
echo "=============================================================================="
