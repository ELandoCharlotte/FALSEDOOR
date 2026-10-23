#!/bin/bash
# ==============================================================================
# FALSEDOOR: Safe Shutdown Script (Prevents Raspberry Pi Kernel Panic)
# ==============================================================================
# Why Kernel Panic Happens:
# An abrupt power cut or dirty shutdown while Cowrie or FastAPI is writing to
# cowrie.json/SQLite corrupts the MicroSD card ext4 filesystem journal.
#
# This script:
# 1. Gracefully stops all honeypot & web services.
# 2. Terminates lingering Python / Cowrie processes cleanly.
# 3. Flushes all write caches from RAM to MicroSD (sync).
# 4. Safely powers down the Raspberry Pi / Ubuntu OS.
# ==============================================================================

echo "🛑 [1/4] Stopping FALSEDOOR Web & API services..."
sudo systemctl stop falsedoor-web falsedoor-api 2>/dev/null || true

echo "🛑 [2/4] Stopping Cowrie Honeypot (flushing attack logs)..."
sudo systemctl stop cowrie 2>/dev/null || true
if [ -f ~/FALSEDOOR/bin/cowrie ]; then
    ~/FALSEDOOR/bin/cowrie stop 2>/dev/null || true
fi

# Ensure no orphaned python/cowrie process is locking disk writes
pkill -u "$USER" -f "cowrie|uvicorn|main.py" 2>/dev/null || true
sleep 2

echo "💾 [3/4] Flushing RAM write caches to MicroSD (sync)..."
sync
sync
sync
echo "   ✅ MicroSD filesystem is clean and uncommitted buffers are saved."

echo "🔌 [4/4] Initiating clean system shutdown..."
echo "⚠️  CRITICAL: Wait ~15 seconds until the green/yellow ACT LED on the"
echo "   Raspberry Pi stops blinking and turns completely OFF before pulling the power cord!"
echo ""

sudo shutdown -h now
