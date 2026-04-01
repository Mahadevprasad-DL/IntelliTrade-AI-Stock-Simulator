from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "stocks.json"
MODEL_PATH = ROOT / "model" / "stock_model.pkl"

FEATURES = ["open", "high", "low", "close", "volume"]
TARGET = "label"


def train_model():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Processed dataset not found at {DATA_PATH}. Run ml_preprocess.py first."
        )

    df = pd.read_json(DATA_PATH)
    df = df.dropna(subset=FEATURES + [TARGET]).copy()

    x = df[FEATURES]
    y = df[TARGET]

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=250,
        max_depth=10,
        min_samples_split=6,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )

    model.fit(x_train, y_train)

    preds = model.predict(x_test)
    accuracy = accuracy_score(y_test, preds)

    print(f"Model accuracy: {accuracy:.4f}")
    print("Classification report:")
    print(classification_report(y_test, preds))

    payload = {
        "model": model,
        "features": FEATURES,
        "classes": list(model.classes_),
        "accuracy": float(accuracy),
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(payload, MODEL_PATH)
    print(f"Saved trained model: {MODEL_PATH}")


if __name__ == "__main__":
    train_model()
