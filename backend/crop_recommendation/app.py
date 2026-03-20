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
    logger.info("✅ ML models loaded successfully")
except Exception as e:
    logger.error("❌ Error loading ML models: %s", str(e))
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
    "rice": (20,35,1000,2000,5.0,7.5),
    "maize": (18,27,500,800,5.5,7.5),
    "jute": (24,35,1200,2500,5.0,7.5),
    "cotton": (21,35,500,1200,5.5,8.0),
    "coconut": (20,32,1500,2500,5.2,8.0),
    "banana": (20,30,1000,2500,6.0,7.5),
    "mango": (24,35,750,2500,5.5,7.5),
    "apple": (5,20,600,1000,5.5,6.5),
    "coffee": (18,25,1200,2500,5.0,6.5),
}

# =========================================================
# ICAR REGIONAL RULES
# =========================================================
ICAR_RULES = {
    "gujarat": ["cotton","maize","chickpea","pigeonpeas"],
    "maharashtra": ["cotton","wheat","mungbean"],
    "punjab": ["rice","wheat","maize"],
    "karnataka": ["coffee","rice","banana"],
    "kerala": ["rice","coconut","banana","coffee"]
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

    X = [[data.N, data.P, data.K, temp, humidity, data.ph, rain]]
    X_scaled = scaler.transform(X)

    preds = model.predict_proba(X_scaled)[0]
    crop_scores = sorted(
        zip(le.classes_, preds),
        key=lambda x: x[1],
        reverse=True
    )

    for crop, score in crop_scores:
        ok, reason = scientific_filter(crop, data.place, temp, rain, data.ph)
        if ok:
            return {
                "location": data.place,
                "temperature": round(temp,2),
                "humidity": round(humidity,2),
                "rainfall": round(rain,2),
                "recommended_crop": crop,
                "confidence": round(float(score),4),
                "validation": reason
            }

    return {
        "message": "No scientifically valid crop found"
    }