#!/bin/bash
# ==============================================================================
# FALSEDOOR: Safe Shutdown for Ubuntu Server / Raspberry Pi (No Kernel Panic)
# ==============================================================================

echo "🛑 [1/3] Stopping Cowrie Honeypot..."
if command -v cowrie &> /dev/null; then
    cowrie stop 2>/dev/null || true
elif [ -f ~/FALSEDOOR/bin/cowrie ]; then
    ~/FALSEDOOR/bin/cowrie stop 2>/dev/null || true
elif [ -f ~/cowrie/bin/cowrie ]; then
    ~/cowrie/bin/cowrie stop 2>/dev/null || true
else
    source ~/FALSEDOOR/cowrie-env/bin/activate 2>/dev/null || source ~/cowrie-env/bin/activate 2>/dev/null || true
    cowrie stop 2>/dev/null || true
fi

echo "🛑 [2/3] Stopping FALSEDOOR Web Server..."
pkill -f "python3.*main.py" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true
sleep 1

echo "💾 [3/3] Flushing RAM caches to MicroSD..."
sync && sync

echo ""
echo "🔌 Shutting down Raspberry Pi..."
echo "⚠️  PENTING: Tunggu lampu hijau (ACT LED) padam (~15 saat) sebelum cabut plug power!"
echo ""

sudo shutdown -h now
