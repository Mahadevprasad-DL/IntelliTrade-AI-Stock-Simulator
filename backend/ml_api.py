import json
import os
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ml_predict import predict_from_json

BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://127.0.0.1:4000").rstrip("/")
UPSTOX_ACCESS_TOKEN = os.getenv("UPSTOX_ACCESS_TOKEN", "").strip()

app = FastAPI(title="Stock Buy/Sell Prediction API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    symbol: Optional[str] = Field(default=None, description="Stock ticker symbol, example: ITC, TCS.BSE, INFY.NSE")
    access_token: Optional[str] = Field(default=None, description="Optional Upstox access token")
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[float] = None


def normalize_symbol(raw_symbol: str) -> str:
    symbol = str(raw_symbol or "").strip().upper()
    if not symbol:
        return ""
    if "|" in symbol or symbol.endswith(".BSE") or symbol.endswith(".NSE"):
        return symbol
    return f"{symbol}.BSE"


def http_get_json(url: str, headers: Optional[dict] = None) -> dict:
    req = Request(url, headers=headers or {})
    try:
        with urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except HTTPError as exc:
        payload = exc.read().decode("utf-8") if exc.fp else ""
        detail = payload
        try:
            parsed = json.loads(payload) if payload else {}
            detail = parsed.get("message") or parsed.get("detail") or payload
        except Exception:
            pass
        raise HTTPException(status_code=exc.code, detail=detail or "HTTP request failed") from exc
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"Unable to reach backend service: {exc.reason}") from exc


def get_live_features(symbol: str, access_token: str) -> dict:
    normalized_symbol = normalize_symbol(symbol)
    if not normalized_symbol:
        raise HTTPException(status_code=400, detail="symbol is required")

    resolve_url = f"{BACKEND_BASE_URL}/upstox/resolve-instrument?symbol={normalized_symbol}"
    resolved = http_get_json(resolve_url)
    instrument_key = str(resolved.get("instrumentKey", "")).strip()

    if not instrument_key:
        raise HTTPException(status_code=404, detail=f"Unable to resolve instrument for {normalized_symbol}")

    quote_url = f"{BACKEND_BASE_URL}/upstox/quotes?instrument_key={instrument_key}"
    headers = {"x-upstox-token": access_token}
    quote_payload = http_get_json(quote_url, headers=headers)

    quote = {}
    if isinstance(quote_payload.get("data"), dict) and quote_payload["data"]:
        quote = next(iter(quote_payload["data"].values()))

    if not quote:
        raise HTTPException(status_code=502, detail=f"No quote data returned for {normalized_symbol}")

    ohlc = quote.get("ohlc") or {}
    last_price = float(quote.get("last_price") or ohlc.get("close") or 0)
    features = {
        "open": float(ohlc.get("open") or 0),
        "high": float(ohlc.get("high") or 0),
        "low": float(ohlc.get("low") or 0),
        "close": last_price,
        "volume": float(quote.get("volume") or 0),
    }

    if features["close"] <= 0:
        raise HTTPException(status_code=502, detail=f"Invalid live close price for {normalized_symbol}")

    return {
        "symbol": str(resolved.get("apiSymbol") or normalized_symbol),
        "instrument_key": instrument_key,
        "features": features,
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/stocks")
def search_stocks(q: str = "", limit: int = 20):
    # Dataset-based search is intentionally disabled for live-only prediction flow.
    return {"count": 0, "items": [], "message": "Use /predict-live with a ticker symbol for real-time prediction."}


@app.post("/predict-live")
def predict_live(payload: PredictRequest):
    try:
        symbol = normalize_symbol(payload.symbol or "")
        if not symbol:
            raise HTTPException(status_code=400, detail="symbol is required. Example: ITC, TCS.BSE, INFY.NSE")

        token = (payload.access_token or UPSTOX_ACCESS_TOKEN).strip()
        if not token:
            raise HTTPException(status_code=400, detail="Upstox access token is missing. Set it in request or environment.")

        live = get_live_features(symbol, token)
        prediction = predict_from_json(live["features"])

        return {
            "stock_name": live["symbol"],
            "prediction": prediction["prediction"],
            "confidence": prediction["confidence"],
            "features": live["features"],
            "source": "live-upstox",
            "instrument_key": live["instrument_key"],
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/predict")
def predict(payload: PredictRequest):
    try:
        if payload.symbol:
            return predict_live(payload)

        values = {
            "open": payload.open,
            "high": payload.high,
            "low": payload.low,
            "close": payload.close,
            "volume": payload.volume,
        }
        if any(v is None for v in values.values()):
            raise HTTPException(
                status_code=400,
                detail="Provide symbol for live prediction or all features: open, high, low, close, volume",
            )

        stock_json = {k: float(v) for k, v in values.items()}
        prediction = predict_from_json(stock_json)

        return {
            "stock_name": "custom-input",
            "prediction": prediction["prediction"],
            "confidence": prediction["confidence"],
            "features": stock_json,
            "source": "manual-features",
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
