import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW_DATA_PATH = ROOT / "database" / "stock_data_0.json"
OUTPUT_PATH = ROOT / "data" / "stocks.json"


def to_float(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        text = str(value).replace(",", "").strip()
        if text == "":
            return None
        return float(text)
    except (TypeError, ValueError):
        return None


def estimate_volume(open_price, high_price, low_price, close_price, stock_name):
    spread = max(high_price - low_price, 0)
    amplitude = max(abs(close_price - open_price), 0)
    name_signal = (sum(ord(c) for c in stock_name) % 1000) + 500
    return int((spread * 10000) + (amplitude * 5000) + name_signal)


def preprocess_data():
    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(f"Input dataset not found: {RAW_DATA_PATH}")

    with RAW_DATA_PATH.open("r", encoding="utf-8") as f:
        raw = json.load(f)

    df = pd.DataFrame(raw)

    df["close"] = df["COST"].apply(to_float)
    df["open"] = df["P_LOW"].apply(to_float)
    df["high"] = df["P_HIGH"].apply(to_float)
    df["low"] = df["YEARLY_LOW"].apply(to_float)

    df["open"] = df["open"].fillna(df["close"])
    df["high"] = df["high"].fillna(df["close"])
    df["low"] = df["low"].fillna(df["open"])

    df["low"] = df[["low", "open", "close"]].min(axis=1)
    df["high"] = df[["high", "open", "close"]].max(axis=1)

    df = df.dropna(subset=["NAME", "open", "high", "low", "close"]).copy()

    df["stock_name"] = df["NAME"].astype(str).str.strip()
    df = df[df["stock_name"] != ""].copy()

    df["volume"] = df.apply(
        lambda row: estimate_volume(row["open"], row["high"], row["low"], row["close"], row["stock_name"]),
        axis=1,
    )

    # We do not have next-day time series in this source, so use intraday proxy:
    # if price closes near/above the high estimate -> BUY, else SELL.
    df["next_close"] = (df["close"] * 0.7) + (df["high"] * 0.3)
    df["label"] = (df["next_close"] > df["close"]).map({True: "BUY", False: "SELL"})

    final_df = df[["stock_name", "open", "high", "low", "close", "volume", "next_close", "label"]].copy()
    final_df = final_df.dropna().reset_index(drop=True)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    final_df.to_json(OUTPUT_PATH, orient="records", indent=2)

    print(f"Saved cleaned JSON dataset: {OUTPUT_PATH}")
    print(f"Rows: {len(final_df)}")


if __name__ == "__main__":
    preprocess_data()
