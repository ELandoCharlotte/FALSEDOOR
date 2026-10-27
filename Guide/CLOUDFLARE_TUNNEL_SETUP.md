# Cloudflare Zero Trust Tunnel Setup Guide for FALSEDOOR

This guide details configuring a permanent, high-performance **Cloudflare Zero Trust Tunnel** with **unlimited bandwidth** and **real-time live attack streaming**.

---

## One-Command Setup (Copy & Paste to Raspberry Pi Terminal)

Open your terminal on your Raspberry Pi (or SSH into it) and paste this single command:

```bash
sudo pkill -f cloudflared 2>/dev/null; ARCH=$(uname -m); [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ] && BIN="cloudflared-linux-arm64" || { [ "$ARCH" = "armv7l" ] && BIN="cloudflared-linux-arm" || BIN="cloudflared-linux-amd64"; }; sudo curl -sSL -L --output /usr/local/bin/cloudflared "https://github.com/cloudflare/cloudflared/releases/latest/download/${BIN}" && sudo chmod +x /usr/local/bin/cloudflared && (sudo cloudflared service uninstall 2>/dev/null || true) && sudo cloudflared service install eyJhIjoiOTAxODJkZjFmOTE5ZDg0YzI1ZDVjYTgwZjE4NDg0ZTMiLCJ0IjoiYTk2ZmE3MmYtNGI0My00NzJiLWFlMTQtNDQyNGI5ZjY3OTQwIiwicyI6IlpUSTRNRGhsTnpNdE9XUXlNeTAwTkdZM0xXSXdPVEV0TlRNMFpXSXdaakJtTmpsayJ9 && sudo systemctl daemon-reload && sudo systemctl enable cloudflared && sudo systemctl restart cloudflared && sudo systemctl status cloudflared --no-pager
```

### What this single command does automatically:
1. Detects your Raspberry Pi architecture (`arm64` on Raspberry Pi 5 / Ubuntu aarch64).
2. Downloads the official `cloudflared` binary into `/usr/local/bin/cloudflared`.
3. Installs and registers the Cloudflare service with your permanent tunnel token:
   - **Tunnel Name:** `falsedoor`
   - **Tunnel ID:** `a96fa72f-4b43-472b-ae14-4424b9f67940`
4. Starts the service in the background so it runs 24/7 and automatically restarts if the Pi reboots.

---

## 🖥️ What to Do in Cloudflare Dashboard (Next Steps)

After running the command above, look at your browser where you have the Cloudflare **Create a Tunnel** page open:

1. **Check Connection Status**:
   - The box that previously said *"No connection detected yet"* will turn **Green** and say **Connected**!
2. **Click "Continue"**:
   - Click the blue **"Continue"** button at the bottom right.
3. **Configure Public Hostname for falsedoor.dev**:
   - Under **Public Hostname Page**, fill in:
     - **Subdomain:** Leave **blank** (for root `https://falsedoor.dev`) OR type `soc` / `www`
     - **Domain:** Select **`falsedoor.dev`** from the dropdown
     - **Path:** Leave empty
     - **Service Type:** `HTTP`
     - **URL:** `localhost:8000`
4. **Click "Save tunnel"**:
   - That's it! Your domain `https://falsedoor.dev` is permanently connected directly to your Raspberry Pi!
   - *(Optional: You can add a second hostname for `www.falsedoor.dev` also pointing to `HTTP -> localhost:8000`).*

---

## 🚀 Starting the Honeypot & Web Dashboard

On your Raspberry Pi:

```bash
cd ~/FALSEDOOR
./start.sh
```

Your terminal banner will display:
```
╔══════════════════════════════════════════════════════════════════════════╗
║                           FALSEDOOR IS INBOUND                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  Honeypot SSH Port : 2222                                                ║
║  Local Interface   : http://172.20.10.2:8000                             ║
║  Cloudflare Tunnel : ACTIVE                                              ║
║  Public Domain     : https://falsedoor.dev                               ║
║  Attack Target     : ssh -p 2222 root@172.20.10.2                        ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 How to View the Live Dashboard

You can now view your live SOC dashboard from anywhere in the world on any phone, tablet, or laptop:

1. **Via Your Custom Domain (Global Access):**
   - Open: `https://falsedoor.dev` (or `https://www.falsedoor.dev`)
   - Works from any cellular network, university Wi-Fi, or home network.
   - Zero bandwidth limits, zero timeouts.
2. **Via Local IP (Fastest for Offline Presentation):**
   - Open: `http://172.20.10.2:8000` (when connected to same Wi-Fi / hotspot)

---

## ⚔️ Testing Live Attack Capture & Real-Time Sync

To demonstrate live attack capture to your panel:

1. Open your dashboard in browser (`https://falsedoor.dev`).
2. Unlock the screen with the biometric fingerprint button.
3. Go to the **Confusion Matrix** or **Overview** tab.
4. From another computer or terminal, initiate an attack:
   ```bash
   ssh -p 2222 root@172.20.10.2
   ```
5. Enter any incorrect passwords.
6. **Watch the Dashboard:**
   - The attack counter increments immediately.
   - The Confusion Matrix updates its diagonal cell and total support count in real time without refreshing the page!
