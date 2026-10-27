# FALSEDOOR: Real-Time Honeypot Threat Intelligence with Machine Learning

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-Random%20Forest-orange.svg)](https://scikit-learn.org/)
[![Cowrie](https://img.shields.io/badge/Cowrie-SSH%2FTelnet%20Honeypot-red.svg)](https://github.com/cowrie/cowrie)
[![PWA Ready](https://img.shields.io/badge/PWA-Responsive%20SOC-purple.svg)]()

> **FALSEDOOR** is an end-to-end cyber threat intelligence platform integrating a Cowrie medium-interaction honeypot, machine learning classification via Random Forest, and a real-time reactive Security Operations Center (SOC) dashboard.

---

## Quick Reference Guide (Ubuntu Server / Raspberry Pi)

### 1. Start All Services
```bash
# 1. Start Cowrie Honeypot:
cowrie start

# 2. Start FALSEDOOR Telemetry Engine:
cd ~/FALSEDOOR/server && python3 main.py &
```
Access dashboard locally: `http://<IP-Raspberry-Pi>:8000` or via domain `https://falsedoor.dev`

---

### 2. Stop Services & Safe Shutdown
```bash
# 1. Stop Cowrie Honeypot:
cowrie stop

# 2. Stop Web Server:
pkill -f main.py

# 3. Flush storage write buffers:
sync

# 4. Shutdown host:
sudo shutdown -h now
```
> **Important Hardware Shutdown Procedure:**  
> After executing `sudo shutdown -h now`, monitor the green activity LED (ACT LED) on the Raspberry Pi. Wait approximately 10 to 15 seconds until the green LED turns off completely (leaving only the solid red power LED). Disconnect the power supply only after the green LED has extinguished.

---

### Automation Scripts
For one-command execution:
- Start all services: `./start_all_services.sh`
- Safe shutdown: `./safe_shutdown.sh`

---

## 🏛️ System Architecture

```
                                  [ Attacker Traffic ]
                                           │
                                           ▼ (Port 2222: Decoy SSH)
                               ┌───────────────────────┐
                               │    Cowrie Honeypot    │
                               │   (Medium-Interaction)│
                               └───────────┬───────────┘
                                           │ Generates cowrie.json
                                           ▼
                               ┌───────────────────────┐
                               │   Log Ingestion &     │
                               │ Feature Extraction    │
                               └───────────┬───────────┘
                                           │
                                           ▼
                               ┌───────────────────────┐
                               │ Random Forest Model   │
                               │  (Threat Classifier)  │
                               └───────────┬───────────┘
                                           │
                                           ▼
                               ┌───────────────────────┐
                               │   FastAPI Telemetry   │
                               │    WebSocket / SSE    │
                               └───────────┬───────────┘
                                           │ (Port 8000)
                                           ▼
                               ┌───────────────────────┐
                               │ FALSEDOOR SOC Web UI  │
                               │  - Overview Charts    │
                               │  - Live Attack Feed   │
                               │  - Forensic Logs      │
                               │  - Pipeline Health    │
                               └───────────────────────┘
```

---

## 🚀 Key Features

1. **Medium-Interaction Honeypot (Cowrie)**
   - Deployed on non-standard port `2222` to capture unauthorized SSH reconnaissance, brute-force credential stuffing, and command injection attempts.
   - Preserves complete operational logs in standard JSON format (`cowrie.json`).

2. **Machine Learning Threat Classification**
   - Pre-trained **Random Forest Classifier** (`random_forest_model.pkl`) evaluates incoming sessions in real-time.
   - Categorizes threats into **Brute Force**, **Reconnaissance**, **Exploit Attempt**, **Data Exfiltration**, and **Normal Activity**.

3. **Responsive Mobile & Desktop SOC Dashboard**
   - **Static Biometric Entry Screen**: Mobile-optimized, lock-screen landing page with haptic fingerprint simulation.
   - **Overview Intelligence**: Interactive visualization including threat classification distributions, top attacker IP leaderboards, and event breakdown telemetry.
   - **Live Ingestion Feed**: Chronological tabular feed with color-coded severity badges and full command payload inspection.
   - **Forensic Raw Log Viewer**: Direct real-time streaming and filtering of actual `cowrie.json` records with one-click download.
   - **Live Pipeline Health**: Real-time Linux hardware metrics (CPU, RAM, Disk) combined with dynamic TCP socket probing (verifying port `2222` availability).

---

## 📂 Repository Structure

```
FALSEDOOR/
├── data/                         # Feature datasets and training data
│   └── extracted_features.csv
├── etc/                          # Honeypot configuration files
│   └── cowrie.cfg
├── ml/                           # Machine Learning components
│   ├── feature_extraction.py     # Feature engineering from Cowrie logs
│   ├── train_model.py            # Random Forest training script
│   ├── predict.py                # Real-time inference logic
│   └── random_forest_model.pkl   # Serialized ML model
├── server/                       # Web Application & API
│   ├── main.py                   # FastAPI backend & telemetry endpoints
│   ├── random_forest_service.py  # Python inference service
│   ├── requirements.txt          # Python dependencies
│   ├── start_server.sh           # Linux start script
│   ├── start_server.bat          # Windows start script
│   └── static/
│       └── index.html            # Production responsive dashboard
├── falsedoor_dashboard_preview.html # Standalone offline preview
├── start_all_services.sh         # 1-Click start script
├── safe_shutdown.sh              # 1-Click safe shutdown script
└── UBUNTU_SERVER_DEPLOYMENT.md   # Complete server deployment guide
```

---

## 📜 Full Server Deployment Guide
For complete step-by-step setup (Nginx reverse proxy, UFW firewall rules, and systemd daemon configurations), refer to [`UBUNTU_SERVER_DEPLOYMENT.md`](./UBUNTU_SERVER_DEPLOYMENT.md).

---

## 🎓 Academic FYP Project
Developed for Universiti Teknologi MARA (UiTM) Final Year Project (FYP).  
Author: **ELandoCharlotte**


