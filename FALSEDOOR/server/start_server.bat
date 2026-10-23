@echo off
REM ==============================================================================
REM FALSEDOOR: FastAPI Backend Startup Script (Windows - Local Testing Only)
REM Place inside: FALSEDOOR\server\start_server.bat
REM ==============================================================================

cd /d "%~dp0"
title FALSEDOOR FastAPI Backend

echo ======================================================================
echo   FALSEDOOR - FastAPI Backend (Windows Local Test)
echo ======================================================================

python --version >nul 2>&1
if errorlevel 1 (
    echo [!] Python not found. Please install Python 3.10+ and add to PATH.
    pause
    exit /b 1
)

if not exist venv (
    echo [+] Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo [+] Installing packages (fastapi, uvicorn, scikit-learn, pandas)...
pip install -r requirements.txt -q

echo [+] Starting FastAPI server on http://127.0.0.1:8000
echo [+] API Docs: http://127.0.0.1:8000/docs
echo [+] Press Ctrl+C to stop.
echo ----------------------------------------------------------------------
python main.py

pause
