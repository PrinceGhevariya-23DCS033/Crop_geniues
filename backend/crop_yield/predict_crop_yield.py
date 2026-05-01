import argparse
import json
import pickle
from pathlib import Path
from typing import Dict, List

import pandas as pd
import numpy as np


DEFAULT_MODEL_PATH = Path("Model") / "best_crop_yield_model.pkl"


RAW_INPUT_FIELDS = [
    "crop",
    "season",
    "state",
    "crop_year",
    "area",
    "annual_rainfall",
    "fertilizer",
    "pesticide",
    "annual_rainfall_mm_openmeteo",
    "temperature_max_c",
    "temperature_min_c",
    "humidity_pct",
    "nitrogen_high",
    "nitrogen_medium",
    "nitrogen_low",
    "phosphorous_high",
    "phosphorous_medium",
    "phosphorous_low",
    "potassium_high",
    "potassium_medium",
    "potassium_low",
    "ph_neutral",
    "ph_acidic",
    "ph_alkaline",
]


def load_artifact(model_path: Path) -> Dict:
    with model_path.open("rb") as file_handle:
        return pickle.load(file_handle)


def clean_text(value: str) -> str:
    return str(value).strip()


def to_float(value) -> float:
    return float(value)


def build_feature_row(raw_input: Dict) -> Dict:
    row = {key: raw_input.get(key) for key in RAW_INPUT_FIELDS}

    for key in ["crop", "season", "state"]:
        row[key] = clean_text(row[key])

    numeric_keys = [field for field in RAW_INPUT_FIELDS if field not in {"crop", "season", "state"}]
    for key in numeric_keys:
        row[key] = to_float(row[key])

    area = row["area"]
    annual_rainfall = row["annual_rainfall"]
    fertilizer = row["fertilizer"]
    pesticide = row["pesticide"]
    openmeteo_rainfall = row["annual_rainfall_mm_openmeteo"]
    temp_max = row["temperature_max_c"]
    temp_min = row["temperature_min_c"]
    humidity = row["humidity_pct"]

    temperature_range_c = temp_max - temp_min
    mean_temperature_c = (temp_max + temp_min) / 2

    fertilizer_per_area = fertilizer / area if area else None
    pesticide_per_area = pesticide / area if area else None
    rainfall_gap = openmeteo_rainfall - annual_rainfall
    rainfall_to_temperature_ratio = openmeteo_rainfall / (mean_temperature_c + 1)
    humidity_to_temperature_ratio = humidity / (temperature_range_c + 1)
    climate_stress_index = (abs(temperature_range_c) + 1) / (openmeteo_rainfall + 1)
    water_use_index = (openmeteo_rainfall * humidity) / (temperature_range_c + 1)

    soil_high_npk_score = row["nitrogen_high"] + row["phosphorous_high"] + row["potassium_high"]
    soil_medium_npk_score = row["nitrogen_medium"] + row["phosphorous_medium"] + row["potassium_medium"]
    soil_low_npk_score = row["nitrogen_low"] + row["phosphorous_low"] + row["potassium_low"]
    soil_neutral_ph_score = row["ph_neutral"]
    soil_fertility_score = soil_high_npk_score + soil_neutral_ph_score
    soil_ph_balance = soil_neutral_ph_score - (row["ph_acidic"] + row["ph_alkaline"])
    area_log = float(np.log1p(area))
    rainfall_per_area = openmeteo_rainfall / area if area else None
    soil_climate_score = (soil_fertility_score + rainfall_to_temperature_ratio) / 2

    engineered = {
        "crop_year": row["crop_year"],
        "area": area,
        "annual_rainfall": annual_rainfall,
        "fertilizer": fertilizer,
        "pesticide": pesticide,
        "annual_rainfall_mm_openmeteo": openmeteo_rainfall,
        "temperature_max_c": temp_max,
        "temperature_min_c": temp_min,
        "humidity_pct": humidity,
        "fertilizer_per_area": fertilizer_per_area,
        "pesticide_per_area": pesticide_per_area,
        "rainfall_gap": rainfall_gap,
        "temperature_range_c": temperature_range_c,
        "mean_temperature_c": mean_temperature_c,
        "rainfall_to_temperature_ratio": rainfall_to_temperature_ratio,
        "humidity_to_temperature_ratio": humidity_to_temperature_ratio,
        "climate_stress_index": climate_stress_index,
        "water_use_index": water_use_index,
        "soil_high_npk_score": soil_high_npk_score,
        "soil_medium_npk_score": soil_medium_npk_score,
        "soil_low_npk_score": soil_low_npk_score,
        "soil_neutral_ph_score": soil_neutral_ph_score,
        "soil_fertility_score": soil_fertility_score,
        "soil_ph_balance": soil_ph_balance,
        "area_log": area_log,
        "rainfall_per_area": rainfall_per_area,
        "soil_climate_score": soil_climate_score,
        "crop": row["crop"],
        "season": row["season"],
        "state": row["state"],
    }

    return engineered


def make_feature_dataframe(raw_rows: List[Dict], feature_columns: List[str]) -> pd.DataFrame:
    engineered_rows = [build_feature_row(row) for row in raw_rows]
    df = pd.DataFrame(engineered_rows)
    missing_columns = [column for column in feature_columns if column not in df.columns]
    for column in missing_columns:
        df[column] = pd.NA
    return df[feature_columns]


def demo_samples() -> List[Dict]:
    return [
        {
            "crop": "Rice",
            "season": "Kharif",
            "state": "Assam",
            "crop_year": 2018,
            "area": 220000.0,
            "annual_rainfall": 2650.0,
            "fertilizer": 18000000.0,
            "pesticide": 5200.0,
            "annual_rainfall_mm_openmeteo": 2550.0,
            "temperature_max_c": 31.0,
            "temperature_min_c": 22.0,
            "humidity_pct": 84.0,
            "nitrogen_high": 45.0,
            "nitrogen_medium": 40.0,
            "nitrogen_low": 15.0,
            "phosphorous_high": 50.0,
            "phosphorous_medium": 35.0,
            "phosphorous_low": 15.0,
            "potassium_high": 55.0,
            "potassium_medium": 30.0,
            "potassium_low": 15.0,
            "ph_neutral": 62.0,
            "ph_acidic": 18.0,
            "ph_alkaline": 20.0,
        },
        {
            "crop": "Wheat",
            "season": "Rabi",
            "state": "Punjab",
            "crop_year": 2017,
            "area": 180000.0,
            "annual_rainfall": 620.0,
            "fertilizer": 11500000.0,
            "pesticide": 4300.0,
            "annual_rainfall_mm_openmeteo": 585.0,
            "temperature_max_c": 24.0,
            "temperature_min_c": 9.0,
            "humidity_pct": 64.0,
            "nitrogen_high": 55.0,
            "nitrogen_medium": 30.0,
            "nitrogen_low": 15.0,
            "phosphorous_high": 60.0,
            "phosphorous_medium": 25.0,
            "phosphorous_low": 15.0,
            "potassium_high": 52.0,
            "potassium_medium": 33.0,
            "potassium_low": 15.0,
            "ph_neutral": 71.0,
            "ph_acidic": 14.0,
            "ph_alkaline": 15.0,
        },
        {
            "crop": "Maize",
            "season": "Kharif",
            "state": "Karnataka",
            "crop_year": 2019,
            "area": 95000.0,
            "annual_rainfall": 1250.0,
            "fertilizer": 6900000.0,
            "pesticide": 2100.0,
            "annual_rainfall_mm_openmeteo": 1180.0,
            "temperature_max_c": 30.0,
            "temperature_min_c": 18.0,
            "humidity_pct": 73.0,
            "nitrogen_high": 40.0,
            "nitrogen_medium": 42.0,
            "nitrogen_low": 18.0,
            "phosphorous_high": 47.0,
            "phosphorous_medium": 38.0,
            "phosphorous_low": 15.0,
            "potassium_high": 50.0,
            "potassium_medium": 34.0,
            "potassium_low": 16.0,
            "ph_neutral": 67.0,
            "ph_acidic": 16.0,
            "ph_alkaline": 17.0,
        },
        {
            "crop": "Cotton(lint)",
            "season": "Kharif",
            "state": "Maharashtra",
            "crop_year": 2016,
            "area": 132000.0,
            "annual_rainfall": 910.0,
            "fertilizer": 8400000.0,
            "pesticide": 3800.0,
            "annual_rainfall_mm_openmeteo": 875.0,
            "temperature_max_c": 33.0,
            "temperature_min_c": 20.0,
            "humidity_pct": 69.0,
            "nitrogen_high": 44.0,
            "nitrogen_medium": 38.0,
            "nitrogen_low": 18.0,
            "phosphorous_high": 41.0,
            "phosphorous_medium": 40.0,
            "phosphorous_low": 19.0,
            "potassium_high": 49.0,
            "potassium_medium": 33.0,
            "potassium_low": 18.0,
            "ph_neutral": 66.0,
            "ph_acidic": 17.0,
            "ph_alkaline": 17.0,
        },
        {
            "crop": "Potato",
            "season": "Whole Year",
            "state": "West Bengal",
            "crop_year": 2018,
            "area": 110000.0,
            "annual_rainfall": 1600.0,
            "fertilizer": 9200000.0,
            "pesticide": 2600.0,
            "annual_rainfall_mm_openmeteo": 1525.0,
            "temperature_max_c": 28.0,
            "temperature_min_c": 16.0,
            "humidity_pct": 77.0,
            "nitrogen_high": 46.0,
            "nitrogen_medium": 36.0,
            "nitrogen_low": 18.0,
            "phosphorous_high": 48.0,
            "phosphorous_medium": 34.0,
            "phosphorous_low": 18.0,
            "potassium_high": 53.0,
            "potassium_medium": 29.0,
            "potassium_low": 18.0,
            "ph_neutral": 68.0,
            "ph_acidic": 16.0,
            "ph_alkaline": 16.0,
        },
    ]


def run_prediction(model_path: Path, rows: List[Dict]) -> pd.DataFrame:
    artifact = load_artifact(model_path)
    pipeline = artifact["pipeline"]
    feature_columns = artifact["feature_columns"]

    features = make_feature_dataframe(rows, feature_columns)
    predictions = pipeline.predict(features)

    result = pd.DataFrame(rows)
    result["predicted_yield"] = predictions
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict Indian crop yield using the saved model.")
    parser.add_argument(
        "--model-path",
        type=Path,
        default=DEFAULT_MODEL_PATH,
        help="Path to the saved model pickle",
    )
    parser.add_argument(
        "--input-json",
        type=Path,
        default=None,
        help="Path to a JSON file containing one or more raw input samples",
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run built-in demo samples and print analysis",
    )
    args = parser.parse_args()

    if args.input_json:
        raw_rows = json.loads(args.input_json.read_text(encoding="utf-8"))
        if isinstance(raw_rows, dict):
            raw_rows = [raw_rows]
        result = run_prediction(args.model_path, raw_rows)
        print(result.to_string(index=False))
        return

    if args.demo:
        raw_rows = demo_samples()
        result = run_prediction(args.model_path, raw_rows)
        print("Predicted yields for demo samples:\n")
        print(result[["crop", "season", "state", "crop_year", "predicted_yield"]].to_string(index=False))
        print("\nSimple analysis:")
        best_row = result.loc[result["predicted_yield"].idxmax()]
        worst_row = result.loc[result["predicted_yield"].idxmin()]
        print(
            f"Highest predicted yield: {best_row['crop']} in {best_row['state']} ({best_row['season']}) "
            f"at {best_row['predicted_yield']:.3f}"
        )
        print(
            f"Lowest predicted yield: {worst_row['crop']} in {worst_row['state']} ({worst_row['season']}) "
            f"at {worst_row['predicted_yield']:.3f}"
        )
        print("\nInterpretation:")
        print("- Cooler, wetter, and more balanced soil profiles generally produce higher predicted yield here.")
        print("- Drier or hotter scenarios with larger climate stress index tend to reduce yield.")
        return

    parser.print_help()


if __name__ == "__main__":
    main()
