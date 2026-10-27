#!/usr/bin/env bash

# FALSEDOOR — Safe Raspberry Pi Hardware Shutdown Procedure
# Ensures honeypot logs, ML caches, and databases are safely flushed to SD card

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# 1. Stop all services cleanly
bash "$DIR/stop_services.sh"

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║             RASPBERRY PI SAFE HARDWARE SHUTDOWN                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  CRITICAL HARDWARE INSTRUCTION:"
echo "   1. Initiating system halt now..."
echo "   2. OBSERVE THE GREEN ACT LED on the Raspberry Pi board."
echo "   3. Wait ~10 to 15 seconds until the green ACT LED STOPS BLINKING"
echo "      and stays completely OFF (leaving only the solid RED power LED)."
echo "   4. Only disconnect power AFTER the green LED is completely OFF"
echo "      to prevent microSD card file system corruption!"
echo ""
echo "Executing system halt..."
sleep 2

sudo shutdown -h now