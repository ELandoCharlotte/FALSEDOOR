# FALSEDOOR — Raspberry Pi Session Management & Operations Guide

This guide explains how to start, monitor, stop, and safely shut down all FALSEDOOR sessions on your Raspberry Pi.

---

## 🚀 1. How to Start All Sessions

To launch the entire platform (**Cowrie Honeypot Decoy on port 2222**, **FastAPI ML Telemetry Engine on port 8000**, and **Cloudflare Tunnel**):

```bash
cd ~/FALSEDOOR
./start.sh
```

> [!TIP]
> **Aliases also supported:** You can run any of the following commands interchangeably:
> - `./start.sh`
> - `./start_service.sh`
> - `./start_services.sh`
> - `./start_all_services.sh`
> - `bash start.sh`

### What Happens Automatically:
1. **Python & venv Check**: Detects Python 3 and virtual environment; installs missing `python3-venv` if required.
2. **Dependency Verification**: Verifies `FastAPI`, `scikit-learn`, `uvicorn`, `pandas`, and `numpy`.
3. **ML Classifier Check**: Verifies or automatically trains the Random Forest classifier (`ml/random_forest_model.pkl`).
4. **Firewall Rules**: Automatically allows ports `2222` and `8000`.
5. **Cowrie Honeypot Decoy**: Arms the SSH decoy on port `2222`.
6. **FastAPI SOC Backend**: Launches server on `http://<Raspberry-Pi-IP>:8000`.
7. **Cloudflare Tunnel**: Connects to the public endpoint (`https://falsedoor.dev`).
8. **Interactive Stream**: Streams live logs directly in your terminal.

---

## ⏹️ 2. How to Stop All Sessions

When you want to stop the honeypot, API backend, and tunnel without turning off your Raspberry Pi:

```bash
cd ~/FALSEDOOR
./stop_services.sh
```

> [!TIP]
> **Aliases also supported:**
> - `./stop.sh`
> - `./stop_service.sh`
> - `./stop_services.sh`
> - `bash stop_services.sh`

### What This Does:
- Gracefully signals Cowrie Honeypot to terminate and save session logs.
- Terminates the FastAPI backend server process.
- Stops the Cloudflare tunnel process.
- Runs `sync` to flush unwritten data from RAM to the microSD card.
- Leaves your Raspberry Pi running normally for other tasks.

---

## 🔌 3. Safe Hardware Shutdown Procedure

**Never pull the power plug directly from a running Raspberry Pi!** Doing so risks corrupting the microSD card file system and losing ML datasets or honeypot logs.

Run:
```bash
cd ~/FALSEDOOR
./safe_shutdown.sh
```

### Hardware LED Observation:
1. The script stops all services and flushes all storage buffers (`sync && sync`).
2. It sends the system halt command (`sudo shutdown -h now`).
3. **Look at the Raspberry Pi board's green Activity LED (ACT LED)**:
   - The green LED will blink rapidly while shutting down.
   - Wait **10 to 15 seconds** until the green ACT LED **turns completely OFF**.
   - Only the solid RED power LED will remain lit.
4. **Once the green LED is completely off, it is 100% safe to disconnect power.**

---

## 🔍 4. Why `./start.sh` and `./start_service.sh` Failed Before

If you encountered errors previously, here is the diagnosis and how it has been resolved:

| Previous Issue | Root Cause | Solution Applied |
| :--- | :--- | :--- |
| **`./start_service.sh: No such file or directory`** | The original script was named `start_all_services.sh` or `start.sh`; `start_service.sh` did not exist. | Created `start_service.sh` and `start_services.sh` as universal wrappers calling `start.sh`. |
| **`Permission denied`** | Git previously tracked `.sh` files with permission `644` (non-executable). | Updated Git index with `--chmod=+x` on all shell scripts so cloning automatically sets execute permissions. |
| **`^M: bad interpreter` or `$'\r': command not found`** | Files edited on Windows had CRLF (`\r\n`) line endings instead of Unix LF (`\n`). | Added `.gitattributes` enforcing `*.sh text eol=lf` across all environments. |
| **Silent Abort / Exit** | The previous launcher had `set -e` at the top, causing the entire script to abort silently if any non-essential command returned non-zero. | Removed `set -e` and implemented explicit error checks and self-healing logic. |
| **`python3-venv` Missing on Raspberry Pi OS** | Raspberry Pi OS Bookworm has `python3` preinstalled but lacks `python3-venv` by default, causing `python3 -m venv` to fail. | Launcher now explicitly verifies `python3 -c "import venv"` and auto-installs `python3-venv`. |
| **Cowrie Root Restriction** | Cowrie honeypot strictly forbids running as `root` for security reasons. | Added a clear check warning users not to execute launcher under `sudo`. |

---

## 📊 5. Quick Health Check Commands

Check your sessions anytime with these commands:

```bash
# 1. Check if Honeypot Decoy is listening on port 2222:
ss -tlpn | grep 2222
# Or test connecting:
ssh -p 2222 root@127.0.0.1

# 2. Check if FastAPI SOC Server is running:
curl http://127.0.0.1:8000/api/health

# 3. View live Cowrie attack logs:
tail -f ~/FALSEDOOR/var/log/cowrie/cowrie.json

# 4. View live FastAPI server logs:
tail -f /tmp/falsedoor_api.log
```
