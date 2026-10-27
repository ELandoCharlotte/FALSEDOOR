#!/usr/bin/env bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "Stopping any existing FastAPI backend..."
pkill -9 -f "main.py" 2>/dev/null || true
sleep 1

cd server
if [ -f "venv/bin/python3" ]; then
    PY="venv/bin/python3"
elif [ -f "$DIR/venv/bin/python3" ]; then
    PY="$DIR/venv/bin/python3"
else
    PY="python3"
fi

echo "Launching FastAPI backend with $PY on port 8000..."
nohup $PY main.py > /tmp/falsedoor_api.log 2>&1 &
API_PID=$!
disown $API_PID 2>/dev/null || true

sleep 2
if curl -s http://127.0.0.1:8000/api/health > /dev/null; then
    echo "SUCCESS: FALSEDOOR API is operational on port 8000 (PID: $API_PID)!"
    echo "Health: http://127.0.0.1:8000/api/health"
    echo "Cloudflare: https://api.falsedoor.dev/api/health"
else
    echo "Warning: Port 8000 check did not return OK yet. Check /tmp/falsedoor_api.log"
    tail -n 15 /tmp/falsedoor_api.log 2>/dev/null || true
fi