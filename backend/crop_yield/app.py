import logging
import os
import pickle
from datetime import date, datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import hf_hub_download
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
PRIMARY_MODEL_PATH = BASE_DIR / "model" / "crop_yield" / "best_crop_yield_model.pkl"
FALLBACK_MODEL_PATH = Path(__file__).resolve().parents[3] / "Model" / "best_crop_yield_model.pkl"

HF_MODEL_REPO_ID = os.getenv("HF_MODEL_REPO_ID", "")
HF_MODEL_FILENAME = os.getenv("HF_MODEL_FILENAME", "best_crop_yield_model.pkl")
HF_MODEL_REVISION = os.getenv("HF_MODEL_REVISION")


def download_model_from_hf() -> Path | None:
    if not HF_MODEL_REPO_ID:
        return None
    try:
        downloaded = hf_hub_download(
            repo_id=HF_MODEL_REPO_ID,
            filename=HF_MODEL_FILENAME,
            revision=HF_MODEL_REVISION,
        )
        logger.info("Downloaded crop-yield model from Hugging Face repo: %s", HF_MODEL_REPO_ID)
        return Path(downloaded)
    except Exception as exc:
        logger.error("Failed to download model from Hugging Face: %s", exc)
        return None


def resolve_model_path() -> Path:
    if PRIMARY_MODEL_PATH.exists():
        return PRIMARY_MODEL_PATH
    if FALLBACK_MODEL_PATH.exists():
        return FALLBACK_MODEL_PATH
    downloaded = download_model_from_hf()
    if downloaded and downloaded.exists():
        return downloaded
    raise FileNotFoundError(
        "best_crop_yield_model.pkl not found locally and Hugging Face download is unavailable. "
        "Set HF_MODEL_REPO_ID (and optional HF_MODEL_FILENAME/HF_MODEL_REVISION)."
    )


MODEL_PATH = resolve_model_path()

with MODEL_PATH.open("rb") as fh:
    artifact = pickle.load(fh)

pipeline = artifact["pipeline"]
feature_columns = artifact["feature_columns"]

logger.info("Crop yield model loaded from %s", MODEL_PATH)

app = FastAPI(title="Crop Genius Yield Prediction API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class YieldInput(BaseModel):
    area: float = Field(..., gt=0, description="Area in hectares")
    soil_quality: float = Field(7, ge=1, le=10)
    annual_rainfall: float | None = Field(None, gt=0, description="Annual rainfall in mm")
    mean_temperature: float | None = Field(None, ge=-20, le=60, description="Mean seasonal temperature in C")
    fertilizer: float = Field(0, ge=0, description="Fertilizer usage in kg")
    irrigation_type: str = Field("Rain-fed")
    crop: str = Field("Rice")
    season: str = Field("Kharif")
    state: str = Field("Gujarat")
    district: str | None = Field(None)
    place: str | None = Field(None)
    use_openmeteo: bool = Field(True)
    crop_year: int = Field(datetime.now().year, ge=1990, le=2100)
    humidity_pct: float | None = Field(None, ge=1, le=100)
    pesticide: float | None = Field(None, ge=0)


def get_lat_lon(place: str) -> tuple[float | None, float | None]:
    candidates = [place]
    if "," in place:
        first = place.split(",")[0].strip()
        second = ", ".join([p.strip() for p in place.split(",")[:2] if p.strip()])
        if first:
            candidates.append(first)
        if second and second != place:
            candidates.append(second)

    # Deduplicate while preserving order.
    unique_candidates = list(dict.fromkeys([c for c in candidates if c]))

    for candidate in unique_candidates:
        try:
            response = requests.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": candidate, "count": 1, "format": "json"},
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            if "results" in data and data["results"]:
                return data["results"][0]["latitude"], data["results"][0]["longitude"]
        except requests.RequestException:
            continue

    return None, None


def get_openmeteo_weather(place: str) -> tuple[float, float, float]:
    lat, lon = get_lat_lon(place)
    if lat is None or lon is None:
        raise HTTPException(status_code=404, detail=f"Location not found in Open-Meteo: {place}")

    end = date.today() - timedelta(days=1)
    start_14 = end - timedelta(days=14)
    start_180 = end - timedelta(days=180)

    try:
        weather_resp = requests.get(
            "https://archive-api.open-meteo.com/v1/archive",
            params={
                "latitude": lat,
                "longitude": lon,
                "start_date": start_14.isoformat(),
                "end_date": end.isoformat(),
                "daily": "temperature_2m_mean,relative_humidity_2m_mean",
                "timezone": "auto",
            },
            timeout=20,
        )
        weather_resp.raise_for_status()
        weather_data = weather_resp.json()

        rain_resp = requests.get(
            "https://archive-api.open-meteo.com/v1/archive",
            params={
                "latitude": lat,
                "longitude": lon,
                "start_date": start_180.isoformat(),
                "end_date": end.isoformat(),
                "daily": "precipitation_sum",
                "timezone": "auto",
            },
            timeout=20,
        )
        rain_resp.raise_for_status()
        rain_data = rain_resp.json()
    except requests.RequestException as exc:
        raise HTTPException(status_code=503, detail=f"Open-Meteo service unavailable: {exc}")

    temperature = float(np.mean(weather_data.get("daily", {}).get("temperature_2m_mean", [28.0])))
    humidity = float(np.mean(weather_data.get("daily", {}).get("relative_humidity_2m_mean", [65.0])))
    rainfall = float(np.sum(rain_data.get("daily", {}).get("precipitation_sum", [800.0])))
    return rainfall, temperature, humidity


def clamp(val: float, low: float, high: float) -> float:
    return max(low, min(high, val))


def map_soil_quality_to_npk(q: float) -> dict:
    # Keep nutrient profile distributions realistic while controlled by quality index.
    high = clamp(20 + q * 6, 15, 80)
    medium = clamp(60 - q * 3, 10, 70)
    low = clamp(100 - high - medium, 5, 70)

    ph_neutral = clamp(30 + q * 5, 20, 85)
    ph_acidic = clamp((100 - ph_neutral) * 0.45, 5, 50)
    ph_alkaline = clamp(100 - ph_neutral - ph_acidic, 5, 50)

    return {
        "nitrogen_high": high,
        "nitrogen_medium": medium,
        "nitrogen_low": low,
        "phosphorous_high": high,
        "phosphorous_medium": medium,
        "phosphorous_low": low,
        "potassium_high": high,
        "potassium_medium": medium,
        "potassium_low": low,
        "ph_neutral": ph_neutral,
        "ph_acidic": ph_acidic,
        "ph_alkaline": ph_alkaline,
    }


def build_feature_row(payload: YieldInput) -> dict:
    soil = map_soil_quality_to_npk(payload.soil_quality)

    area = payload.area
    if payload.use_openmeteo:
        place = payload.place or (f"{payload.district}, {payload.state}, India" if payload.district else f"{payload.state}, India")
        annual_rainfall, mean_temperature, weather_humidity = get_openmeteo_weather(place)
    else:
        if payload.annual_rainfall is None or payload.mean_temperature is None:
            raise HTTPException(status_code=400, detail="annual_rainfall and mean_temperature are required when use_openmeteo=false")
        annual_rainfall = payload.annual_rainfall
        mean_temperature = payload.mean_temperature
        weather_humidity = payload.humidity_pct

    fertilizer = payload.fertilizer

    irrigation_factor = {
        "drip irrigation": 0.88,
        "sprinkler irrigation": 0.94,
        "flood irrigation": 1.05,
        "furrow irrigation": 0.98,
        "rain-fed": 1.0,
        "canal irrigation": 1.02,
    }.get(payload.irrigation_type.strip().lower(), 1.0)

    openmeteo_rainfall = annual_rainfall * irrigation_factor
    temp_max = mean_temperature + 5.0
    temp_min = mean_temperature - 5.0
    humidity = weather_humidity if weather_humidity is not None else clamp(45 + annual_rainfall * 0.03, 35, 95)
    pesticide = payload.pesticide if payload.pesticide is not None else fertilizer * 0.00035

    temperature_range_c = temp_max - temp_min
    mean_temperature_c = (temp_max + temp_min) / 2

    fertilizer_per_area = fertilizer / area if area else np.nan
    pesticide_per_area = pesticide / area if area else np.nan
    rainfall_gap = openmeteo_rainfall - annual_rainfall
    rainfall_to_temperature_ratio = openmeteo_rainfall / (mean_temperature_c + 1)
    humidity_to_temperature_ratio = humidity / (temperature_range_c + 1)
    climate_stress_index = (abs(temperature_range_c) + 1) / (openmeteo_rainfall + 1)
    water_use_index = (openmeteo_rainfall * humidity) / (temperature_range_c + 1)

    soil_high_npk_score = soil["nitrogen_high"] + soil["phosphorous_high"] + soil["potassium_high"]
    soil_medium_npk_score = soil["nitrogen_medium"] + soil["phosphorous_medium"] + soil["potassium_medium"]
    soil_low_npk_score = soil["nitrogen_low"] + soil["phosphorous_low"] + soil["potassium_low"]
    soil_neutral_ph_score = soil["ph_neutral"]
    soil_fertility_score = soil_high_npk_score + soil_neutral_ph_score
    soil_ph_balance = soil_neutral_ph_score - (soil["ph_acidic"] + soil["ph_alkaline"])

    area_log = float(np.log1p(area))
    rainfall_per_area = openmeteo_rainfall / area if area else np.nan
    soil_climate_score = (soil_fertility_score + rainfall_to_temperature_ratio) / 2

    row = {
        "crop_year": float(payload.crop_year),
        "area": float(area),
        "annual_rainfall": float(annual_rainfall),
        "fertilizer": float(fertilizer),
        "pesticide": float(pesticide),
        "annual_rainfall_mm_openmeteo": float(openmeteo_rainfall),
        "temperature_max_c": float(temp_max),
        "temperature_min_c": float(temp_min),
        "humidity_pct": float(humidity),
        "fertilizer_per_area": float(fertilizer_per_area),
        "pesticide_per_area": float(pesticide_per_area),
        "rainfall_gap": float(rainfall_gap),
        "temperature_range_c": float(temperature_range_c),
        "mean_temperature_c": float(mean_temperature_c),
        "rainfall_to_temperature_ratio": float(rainfall_to_temperature_ratio),
        "humidity_to_temperature_ratio": float(humidity_to_temperature_ratio),
        "climate_stress_index": float(climate_stress_index),
        "water_use_index": float(water_use_index),
        "soil_high_npk_score": float(soil_high_npk_score),
        "soil_medium_npk_score": float(soil_medium_npk_score),
        "soil_low_npk_score": float(soil_low_npk_score),
        "soil_neutral_ph_score": float(soil_neutral_ph_score),
        "soil_fertility_score": float(soil_fertility_score),
        "soil_ph_balance": float(soil_ph_balance),
        "area_log": float(area_log),
        "rainfall_per_area": float(rainfall_per_area),
        "soil_climate_score": float(soil_climate_score),
        "crop": str(payload.crop).strip(),
        "season": str(payload.season).strip(),
        "state": str(payload.state).strip(),
    }

    return row


def make_tips(predicted_yield: float, soil_quality: float, irrigation_type: str) -> list[str]:
    base_tips = [
        "Maintain balanced NPK application according to soil test report.",
        "Monitor weeds during the first 30-40 days after sowing.",
        "Scout crop weekly to detect pests and diseases early.",
    ]

    if soil_quality < 5:
        base_tips.insert(0, "Increase organic matter using compost or green manure to improve soil health.")

    if irrigation_type.strip().lower() == "rain-fed":
        base_tips.append("Use moisture-conservation practices like mulching for rain-fed fields.")
    else:
        base_tips.append("Schedule irrigation at critical growth stages to reduce stress.")

    if predicted_yield < 2.0:
        base_tips.append("Consider improved seed variety and split fertilizer doses for better response.")
    elif predicted_yield > 4.0:
        base_tips.append("Current management is strong; focus on timely harvest and post-harvest handling.")

    return base_tips[:5]


@app.get("/")
def root():
    return {
        "service": "Crop Genius Yield Prediction API",
        "status": "online",
        "model": MODEL_PATH.name,
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": True,
        "model_path": str(MODEL_PATH),
    }


@app.post("/predict")
def predict(payload: YieldInput):
    try:
        row = build_feature_row(payload)
        frame = pd.DataFrame([row])

        for col in feature_columns:
            if col not in frame.columns:
                frame[col] = pd.NA

        frame = frame[feature_columns]
        prediction = float(pipeline.predict(frame)[0])
        prediction = max(0.0, prediction)

        confidence = clamp(86.0 - abs(payload.soil_quality - 7) * 2.2, 70.0, 95.0)
        chart_data = [
            {"week": f"Wk {i + 1}", "estimated": round(prediction * (0.62 + i * 0.075), 2), "optimal": round(prediction * (0.68 + i * 0.07), 2)}
            for i in range(6)
        ]

        return {
            "predicted_yield": round(prediction, 3),
            "unit": "t/ha",
            "confidence": round(confidence, 1),
            "tips": make_tips(prediction, payload.soil_quality, payload.irrigation_type),
            "chart_data": chart_data,
            "model": artifact.get("best_model_name", "best_crop_yield_model"),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Yield prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")
