from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "model" / "stock_model.pkl"


def load_model_payload():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run ml_train.py first."
        )
    return joblib.load(MODEL_PATH)


def predict_from_json(stock_json):
    payload = load_model_payload()
    model = payload["model"]
    features = payload["features"]

    df = pd.DataFrame([stock_json])

    missing = [f for f in features if f not in df.columns]
    if missing:
        raise ValueError(f"Missing feature keys: {missing}")

    x = df[features]
    probs = model.predict_proba(x)[0]
    pred_idx = int(np.argmax(probs))
    prediction = model.classes_[pred_idx]
    confidence = float(probs[pred_idx])

    return {
        "prediction": prediction,
        "confidence": round(confidence, 4),
    }
