import json
import pandas as pd

INPUT_FILE = "var/log/cowrie/cowrie.json"
OUTPUT_FILE = "data/extracted_features.csv"

records = [ ]

with open(INPUT_FILE, "r", encoding="utf-8") as file:
    for line in file:
        line = line.strip()

        if not line:
           continue

        try:
             event = json.loads(line)
        except json.JSONDecodeError:
             continue

        eventid = event.get("eventid", " ")
        command = event.get("input", " ")

        if eventid == "cowrie.login.failed":
            attack_type = "Brute Force"

        elif eventid == "cowrie.command.input":
             command_lower = command.lower()

             if "wget " in command_lower or "curl" in command_lower:
                 attack_type = "Malware Download Attempt"
             else:
                 attack_type = "Command Execution"

        else:
             continue

        records.append({
            "eventid": eventid,
            "timestamps": event.get("timestamp", " "),
            "src_ip": event.get("src_ip", " "),
            "username": event.get("username", " "),
            "password": event.get("password", " "),
            "input": command,
            "session": event.get("session", " "),
            "protocol": event.get("protocol", " "),
            "attack_type": attack_type
        })

df = pd.DataFrame(records)

df.to_csv(OUTPUT_FILE, index=False)

print("Feature extraction completed!")
print(f"Total extracted records: {len(df)}")
print(f"Output file: {OUTPUT_FILE}")

if not df.empty:
   print("\nAttack type distribution:")
   print(df["attack_type"].value_counts())
