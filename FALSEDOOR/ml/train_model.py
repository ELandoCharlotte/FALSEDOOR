import pandas as pd
import pickle

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

INPUT_FILE = "data/extracted_features.csv"
MODEL_FILE = "ml/random_forest_model.pkl"

df = pd.read_csv(INPUT_FILE)

print("Dataset loaded.")
print(f"Total records: {len(df)}")

features = [
     "eventid",
     "timestamps",
     "src_ip",
     "username",
     "password",
     "input",
     "session",
     "protocol"
]

target = "attack_type"

missing = [column for column in features + [target] if column not in df.columns]

if missing:
   print("Missing column:")
   print(missing)
   raise SystemExit

df = df[features + [target]].fillna("")

print("\nAttack type distribution:")
print(df[target].value_counts())

class_counts = df[target].value_counts()

if class_counts.min() < 2:
   print("\nTraining stopped.")
   print("Each attack class needs at least 2 records before training.")
   print("Collect more controlled attack data and run this script again.")
   raise SystemExit

x = df[features]
y = df[target]


label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)


preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            features
        )
    ]
)

X_encoded = preprocessor.fit_transform(x)

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    class_weight="balanced"
)

model.fit(X_encoded, y_encoded)

y_pred = model.predict(X_encoded)
accuracy = accuracy_score(y_encoded, y_pred)

print(f"\nRandom Forest training accuracy: {accuracy:.2%}")

model_package = {
    "preprocessor": preprocessor,
    "model": model,
    "label_encoder": label_encoder,
    "features": features
}

with open(MODEL_FILE, "wb") as file:
    pickle.dump(model_package, file)

print("\nRandom Forest training completed.")
print(f"Model saved to: {MODEL_FILE}")

print("\nClasses:")
for label in label_encoder.classes_:
    print("-", label)
