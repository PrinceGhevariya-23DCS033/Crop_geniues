import argparse
from pathlib import Path

import pandas as pd
import numpy as np


def clean_text_series(series: pd.Series) -> pd.Series:
    return series.astype(str).str.strip()


def safe_divide(numerator: pd.Series, denominator: pd.Series) -> pd.Series:
    denominator = denominator.replace(0, pd.NA)
    return numerator / denominator


def engineer_features(input_path: Path, output_path: Path) -> pd.DataFrame:
    df = pd.read_csv(input_path)
    df.columns = [c.strip().lower() for c in df.columns]

    required_columns = ["crop", "crop_year", "season", "state", "area", "production", "yield"]
    missing = [column for column in required_columns if column not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in input dataset: {missing}")

    df["crop"] = clean_text_series(df["crop"])
    df["season"] = clean_text_series(df["season"])
    df["state"] = clean_text_series(df["state"])

    numeric_columns = [
        "crop_year",
        "area",
        "production",
        "annual_rainfall",
        "fertilizer",
        "pesticide",
        "yield",
        "nitrogen_high",
        "nitrogen_medium",
        "nitrogen_low",
        "phosphorous_high",
        "phosphorous_medium",
        "phosphorous_low",
        "potassium_high",
        "potassium_medium",
        "potassium_low",
        "ph_acidic",
        "ph_neutral",
        "ph_alkaline",
        "annual_rainfall_mm_openmeteo",
        "temperature_max_c",
        "temperature_min_c",
        "humidity_pct",
    ]

    for column in numeric_columns:
        if column in df.columns:
            df[column] = pd.to_numeric(df[column], errors="coerce")

    df["season_clean"] = df["season"].str.lower().str.replace(r"\s+", " ", regex=True).str.strip()

    df["fertilizer_per_area"] = safe_divide(df["fertilizer"], df["area"])
    df["pesticide_per_area"] = safe_divide(df["pesticide"], df["area"])
    df["rainfall_gap"] = df["annual_rainfall_mm_openmeteo"] - df["annual_rainfall"]
    df["temperature_range_c"] = df["temperature_max_c"] - df["temperature_min_c"]
    df["mean_temperature_c"] = (df["temperature_max_c"] + df["temperature_min_c"]) / 2
    df["rainfall_to_temperature_ratio"] = safe_divide(df["annual_rainfall_mm_openmeteo"], df["mean_temperature_c"] + 1)
    df["humidity_to_temperature_ratio"] = safe_divide(df["humidity_pct"], df["temperature_range_c"] + 1)
    df["climate_stress_index"] = (df["temperature_range_c"].abs() + 1) / (df["annual_rainfall_mm_openmeteo"] + 1)
    df["water_use_index"] = safe_divide(df["annual_rainfall_mm_openmeteo"] * df["humidity_pct"], df["temperature_range_c"] + 1)

    nutrient_high_cols = ["nitrogen_high", "phosphorous_high", "potassium_high"]
    nutrient_medium_cols = ["nitrogen_medium", "phosphorous_medium", "potassium_medium"]
    nutrient_low_cols = ["nitrogen_low", "phosphorous_low", "potassium_low"]
    ph_cols = ["ph_acidic", "ph_neutral", "ph_alkaline"]

    df["soil_high_npk_score"] = df[nutrient_high_cols].sum(axis=1, min_count=1) if all(col in df.columns for col in nutrient_high_cols) else pd.NA
    df["soil_medium_npk_score"] = df[nutrient_medium_cols].sum(axis=1, min_count=1) if all(col in df.columns for col in nutrient_medium_cols) else pd.NA
    df["soil_low_npk_score"] = df[nutrient_low_cols].sum(axis=1, min_count=1) if all(col in df.columns for col in nutrient_low_cols) else pd.NA
    df["soil_neutral_ph_score"] = df["ph_neutral"] if "ph_neutral" in df.columns else pd.NA
    df["soil_fertility_score"] = df["soil_high_npk_score"] + df["soil_neutral_ph_score"] if "soil_high_npk_score" in df.columns and "soil_neutral_ph_score" in df.columns else pd.NA

    if all(col in df.columns for col in ph_cols):
        df["soil_ph_balance"] = df["ph_neutral"] - (df["ph_acidic"] + df["ph_alkaline"])
    else:
        df["soil_ph_balance"] = pd.NA

    df["area_log"] = np.log1p(df["area"])
    df["rainfall_per_area"] = safe_divide(df["annual_rainfall_mm_openmeteo"], df["area"])
    df["soil_climate_score"] = (df["soil_fertility_score"] + df["rainfall_to_temperature_ratio"]) / 2

    keep_columns = [
        "crop",
        "season",
        "state",
        "crop_year",
        "area",
        "annual_rainfall",
        "fertilizer",
        "pesticide",
        "yield",
        "annual_rainfall_mm_openmeteo",
        "temperature_max_c",
        "temperature_min_c",
        "humidity_pct",
        "fertilizer_per_area",
        "pesticide_per_area",
        "rainfall_gap",
        "temperature_range_c",
        "mean_temperature_c",
        "rainfall_to_temperature_ratio",
        "humidity_to_temperature_ratio",
        "climate_stress_index",
        "water_use_index",
        "soil_high_npk_score",
        "soil_medium_npk_score",
        "soil_low_npk_score",
        "soil_neutral_ph_score",
        "soil_fertility_score",
        "soil_ph_balance",
        "area_log",
        "rainfall_per_area",
        "soil_climate_score",
    ]

    df = df[[column for column in keep_columns if column in df.columns]].copy()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    return df


def main() -> None:
    parser = argparse.ArgumentParser(description="Feature engineering for Indian crop-yield prediction.")
    parser.add_argument(
        "--input-file",
        type=Path,
        default=Path("crop_yield.csv") / "Final_India_Crop_Yield_Climate_Soil.csv",
        help="Path to the merged climate-soil crop dataset",
    )
    parser.add_argument(
        "--output-file",
        type=Path,
        default=Path("crop_yield.csv") / "Final_India_Crop_Yield_Featured.csv",
        help="Path for the engineered feature dataset",
    )
    args = parser.parse_args()

    engineer_features(args.input_file, args.output_file)
    print(f"Engineered dataset saved to: {args.output_file}")


if __name__ == "__main__":
    main()
