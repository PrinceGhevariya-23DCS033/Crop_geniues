# =========================================================
# IMPORT REQUIRED LIBRARIES
# =========================================================
from datetime import date, timedelta
import requests
import pandas as pd
import joblib
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from requests.exceptions import RequestException

# =========================================================
# LOGGING CONFIGURATION
# =========================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# =========================================================
# LOAD TRAINED ML OBJECTS (Place .pkl files in repo root)
# =========================================================
try:
    model = joblib.load("crop_model.pkl")
    scaler = joblib.load("scaler.pkl")
    le = joblib.load("label_encoder.pkl")
    logger.info("ML models loaded successfully")
except Exception as e:
    logger.error("Error loading ML models: %s", str(e))
    raise

# =========================================================
# FASTAPI INITIALIZATION
# =========================================================
app = FastAPI(
    title="Crop Genius - AI Crop Recommendation API",
    version="2.0.0"
)

# =========================================================
# CORS (For React Frontend)
# =========================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# REQUEST BODY SCHEMA
# =========================================================
class CropInput(BaseModel):
    place: str
    N: float
    P: float
    K: float
    ph: float

# =========================================================
# FAO ECOLOGICAL RULES
# (temp_min, temp_max, rain_min, rain_max, ph_min, ph_max)
# =========================================================
FAO_RULES = {
    "apple": (5, 20, 600, 1000, 5.5, 6.5),
    "banana": (20, 30, 1000, 2500, 6.0, 7.5),
    "blackgram": (25, 35, 700, 1200, 6.0, 7.5),
    "chickpea": (10, 30, 400, 800, 6.0, 8.5),
    "coconut": (20, 32, 1500, 2500, 5.2, 8.0),
    "coffee": (18, 25, 1200, 2500, 5.0, 6.5),
    "cotton": (21, 35, 500, 1200, 5.5, 8.0),
    "grapes": (10, 30, 500, 900, 6.0, 7.5),
    "jute": (24, 35, 1200, 2500, 5.0, 7.5),
    "kidneybeans": (18, 30, 400, 900, 5.5, 7.5),
    "lentil": (10, 30, 300, 700, 6.0, 8.0),
    "maize": (18, 27, 500, 800, 5.5, 7.5),
    "mango": (24, 35, 750, 2500, 5.5, 7.5),
    "mothbeans": (25, 35, 200, 500, 6.0, 8.5),
    "mungbean": (20, 35, 300, 800, 6.0, 7.5),
    "muskmelon": (25, 35, 300, 700, 6.0, 7.5),
    "orange": (13, 32, 700, 1500, 5.5, 7.0),
    "papaya": (22, 35, 1000, 2000, 6.0, 7.5),
    "pigeonpeas": (20, 35, 500, 1200, 6.0, 8.0),
    "pomegranate": (15, 35, 500, 1000, 5.5, 7.5),
    "rice": (20, 35, 1000, 2000, 5.0, 7.5),
    "watermelon": (25, 35, 300, 700, 6.0, 7.5),
}

# =========================================================
# ICAR REGIONAL RULES
# =========================================================
ICAR_RULES = {
    "andhra pradesh": ["rice", "cotton", "maize", "banana", "papaya"],
    "bihar": ["rice", "maize", "lentil", "mungbean", "pigeonpeas"],
    "gujarat": [
        "cotton", "maize", "chickpea", "pigeonpeas", "mango",
        "pomegranate", "banana", "watermelon", "muskmelon"
    ],
    "karnataka": ["coffee", "rice", "banana", "mango", "orange", "papaya"],
    "kerala": ["rice", "coconut", "banana", "coffee", "papaya"],
    "maharashtra": ["cotton", "mungbean", "pomegranate", "grapes", "orange", "mango", "chickpea"],
    "punjab": ["rice", "maize", "chickpea", "lentil", "kidneybeans"],
    "rajasthan": ["mothbeans", "mungbean", "chickpea", "pigeonpeas", "watermelon", "muskmelon", "kidneybeans"],
    "tamil nadu": ["rice", "coconut", "banana", "coffee", "papaya", "mango"],
    "uttar pradesh": ["rice", "maize", "chickpea", "lentil", "kidneybeans", "pigeonpeas", "mungbean"],
    "west bengal": ["rice", "jute", "banana", "mango", "coconut", "papaya"],
}

# =========================================================
# VALIDATION FUNCTIONS
# =========================================================
def fao_validate(crop, temp, rain, ph):
    if crop not in FAO_RULES:
        return True
    tmin,tmax,rmin,rmax,pmin,pmax = FAO_RULES[crop]
    return tmin <= temp <= tmax and rmin <= rain <= rmax and pmin <= ph <= pmax


def icar_validate(crop, place):
    place = place.lower()
    for region, crops in ICAR_RULES.items():
        if region in place:
            return crop in crops
    return True


def scientific_filter(crop, place, temp, rain, ph):
    if not fao_validate(crop, temp, rain, ph):
        return False, "Rejected by FAO ecological limits"
    if not icar_validate(crop, place):
        return False, "Rejected by ICAR regional feasibility"
    return True, "Accepted"

# =========================================================
# WEATHER + GEO FUNCTIONS
# =========================================================
def get_lat_lon(place):
    try:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {"name": place, "count": 1, "format": "json"}
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if "results" not in data:
            return None, None

        return data["results"][0]["latitude"], data["results"][0]["longitude"]

    except RequestException:
        raise HTTPException(status_code=503, detail="Geolocation service unavailable")


def get_short_term_temp_humidity(lat, lon, days=14):
    try:
        end = date.today() - timedelta(days=1)
        start = end - timedelta(days=days)

        url = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "daily": "temperature_2m_mean,relative_humidity_2m_mean",
            "timezone": "auto"
        }

        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()

        df = pd.DataFrame({
            "temp": data["daily"]["temperature_2m_mean"],
            "humidity": data["daily"]["relative_humidity_2m_mean"]
        })

        return df["temp"].mean(), df["humidity"].mean()

    except RequestException:
        raise HTTPException(status_code=503, detail="Weather service unavailable")


def get_long_term_rainfall(lat, lon, days=180):
    try:
        end = date.today() - timedelta(days=1)
        start = end - timedelta(days=days)

        url = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "daily": "precipitation_sum",
            "timezone": "auto"
        }

        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()

        return sum(data["daily"]["precipitation_sum"])

    except RequestException:
        raise HTTPException(status_code=503, detail="Rainfall service unavailable")

# =========================================================
# ROOT ENDPOINT
# =========================================================
@app.get("/")
def root():
    return {"message": "🌾 Crop Genius API Running Successfully"}

# =========================================================
# PREDICTION ENDPOINT
# =========================================================
@app.post("/predict")
def predict_crop(data: CropInput):

    lat, lon = get_lat_lon(data.place)
    if lat is None:
        raise HTTPException(status_code=404, detail="Location not found")

    temp, humidity = get_short_term_temp_humidity(lat, lon)
    rain = get_long_term_rainfall(lat, lon)

    # Build feature vector in the same column order the scaler expects.
    X = [[data.N, data.P, data.K, temp, humidity, data.ph, rain]]

    cols = getattr(scaler, 'feature_names_in_', None)
    if cols is not None:
        # scaler was fitted from a DataFrame with feature names — supply the same
        X_scaled = scaler.transform(pd.DataFrame(X, columns=cols))
    else:
        X_scaled = scaler.transform(X)

    preds = model.predict_proba(X_scaled)[0]
    crop_scores = sorted(
        zip([str(label) for label in le.classes_], preds),
        key=lambda x: x[1],
        reverse=True
    )

    # Evaluate crops with soft penalties rather than hard rejection so suggestions vary.
    evaluations = []
    for crop, base_score in crop_scores:
        fao_ok = bool(fao_validate(crop, temp, rain, data.ph))
        icar_ok = bool(icar_validate(crop, data.place))
        reason = 'Accepted' if (fao_ok and icar_ok) else 'Failed checks'

        # Soft penalty multipliers (tunable): failing FAO is stronger penalty than ICAR.
        penalty = 1.0
        if not fao_ok:
            penalty *= 0.35
        if not icar_ok:
            penalty *= 0.6

        adjusted = float(base_score) * penalty

        evaluations.append({
            "crop": str(crop),
            "base_score": float(base_score),
            "adjusted_score": float(adjusted),
            "fao_ok": fao_ok,
            "icar_ok": icar_ok,
            "reason": reason,
        })

    suggestions = [
        {
            "crop": str(item["crop"]),
            "base_score": float(item["base_score"]),
            "adjusted_score": float(item["adjusted_score"]),
            "fao_ok": bool(item["fao_ok"]),
            "icar_ok": bool(item["icar_ok"]),
            "reason": str(item["reason"]),
        }
        for item in evaluations
    ]

    # If any crop fully satisfies both checks, prefer highest base_score among them.
    fully_ok = [e for e in evaluations if e["fao_ok"] and e["icar_ok"]]
    if fully_ok:
        winner = max(fully_ok, key=lambda e: e["base_score"])
        logger.info("Selected fully-valid crop: %s", winner["crop"])
        return {
            "location": data.place,
            "temperature": round(temp, 2),
            "humidity": round(humidity, 2),
            "rainfall": round(rain, 2),
            "recommended_crop": str(winner["crop"]),
            "confidence": round(winner["base_score"], 4),
            "validation": "Accepted",
            "suggestions": sorted(suggestions, key=lambda e: e["base_score"], reverse=True)[:5],
        }

    # Otherwise pick best by adjusted score and return top-5 with explanations.
    evaluations.sort(key=lambda e: e["adjusted_score"], reverse=True)
    top = evaluations[0]

    # If the adjusted top is very small, signal low confidence but still provide suggestions.
    if top["adjusted_score"] < 0.08:
        logger.info("Low-confidence top suggestion: %s (adj=%.4f)", top["crop"], top["adjusted_score"]) 
        return {
            "location": data.place,
            "temperature": round(temp, 2),
            "humidity": round(humidity, 2),
            "rainfall": round(rain, 2),
            "recommended_crop": str(top["crop"]),
            "confidence": round(top["adjusted_score"], 4),
            "validation": "Low confidence (soft-suggest)",
            "suggestions": suggestions[:5],
        }

    logger.info("Returning soft-suggest top crop: %s (adj=%.4f)", top["crop"], top["adjusted_score"]) 
    return {
        "location": data.place,
        "temperature": round(temp, 2),
        "humidity": round(humidity, 2),
        "rainfall": round(rain, 2),
            "recommended_crop": str(top["crop"]),
        "confidence": round(top["adjusted_score"], 4),
        "validation": "Top soft-suggestion",
            "suggestions": suggestions[:5],
    }