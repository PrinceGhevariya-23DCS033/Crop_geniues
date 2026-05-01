import argparse
import json
import pickle
import math
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Tuple

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


CAT_FEATURES = ["crop", "season", "state"]
NUM_FEATURES = [
    "crop_year",
    "area",
    "annual_rainfall",
    "fertilizer",
    "pesticide",
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


@dataclass
class ModelResult:
    model_name: str
    rmse: float
    mae: float
    r2: float


def load_dataset(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]
    if "yield" not in df.columns:
        raise ValueError("Input dataset must contain a yield column.")
    return df


def make_one_hot_encoder() -> OneHotEncoder:
    try:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        return OneHotEncoder(handle_unknown="ignore", sparse=False)


def select_features(df: pd.DataFrame) -> Tuple[List[str], List[str]]:
    numeric_columns = [column for column in NUM_FEATURES if column in df.columns]
    categorical_columns = [column for column in CAT_FEATURES if column in df.columns]
    return numeric_columns, categorical_columns


def build_pipeline(model) -> Pipeline:
    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", make_one_hot_encoder()),
        ]
    )

    preprocess = ColumnTransformer(
        transformers=[
            ("numeric", numeric_transformer, NUMERIC_COLUMNS),
            ("categorical", categorical_transformer, CATEGORICAL_COLUMNS),
        ]
    )

    full_model = Pipeline(
        steps=[
            ("preprocess", preprocess),
            ("model", model),
        ]
    )
    return full_model


def evaluate_model(name: str, pipeline: Pipeline, x_test: pd.DataFrame, y_test: pd.Series) -> ModelResult:
    predictions = pipeline.predict(x_test)
    rmse = math.sqrt(mean_squared_error(y_test, predictions))
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    return ModelResult(model_name=name, rmse=rmse, mae=mae, r2=r2)


def train_models(df: pd.DataFrame, output_dir: Path, test_size: float, random_state: int) -> None:
    global NUMERIC_COLUMNS, CATEGORICAL_COLUMNS

    NUMERIC_COLUMNS, CATEGORICAL_COLUMNS = select_features(df)
    if not NUMERIC_COLUMNS and not CATEGORICAL_COLUMNS:
        raise ValueError("No usable features were found after filtering the dataset.")

    feature_columns = NUMERIC_COLUMNS + CATEGORICAL_COLUMNS
    working_df = df[feature_columns + ["yield"]].copy()
    working_df = working_df.dropna(subset=["yield"])

    x = working_df[feature_columns]
    y = working_df["yield"]

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=test_size,
        random_state=random_state,
    )

    candidate_models = {
        "ridge": Ridge(alpha=2.0, random_state=random_state),
        "random_forest": RandomForestRegressor(
            n_estimators=180,
            random_state=random_state,
            n_jobs=-1,
            min_samples_leaf=2,
        ),
        "hist_gradient_boosting": HistGradientBoostingRegressor(
            random_state=random_state,
            max_depth=8,
            learning_rate=0.08,
            max_iter=220,
        ),
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    results: List[ModelResult] = []
    fitted_pipelines: Dict[str, Pipeline] = {}

    for name, estimator in candidate_models.items():
        pipeline = build_pipeline(estimator)
        pipeline.fit(x_train, y_train)
        result = evaluate_model(name, pipeline, x_test, y_test)
        results.append(result)
        fitted_pipelines[name] = pipeline
        print(
            f"{name}: RMSE={result.rmse:.4f}, MAE={result.mae:.4f}, R2={result.r2:.4f}"
        )

        model_path = output_dir / f"{name}_crop_yield_model.pkl"
        with model_path.open("wb") as file_handle:
            pickle.dump(
                {
                    "pipeline": pipeline,
                    "feature_columns": feature_columns,
                    "numeric_columns": NUMERIC_COLUMNS,
                    "categorical_columns": CATEGORICAL_COLUMNS,
                },
                file_handle,
            )

    best_result = min(results, key=lambda item: item.rmse)
    best_name = best_result.model_name
    final_pipeline = build_pipeline(candidate_models[best_name])
    final_pipeline.fit(x, y)
    best_model_path = output_dir / "best_crop_yield_model.pkl"
    with best_model_path.open("wb") as file_handle:
        pickle.dump(
            {
                "pipeline": final_pipeline,
                "best_model_name": best_name,
                "feature_columns": feature_columns,
                "numeric_columns": NUMERIC_COLUMNS,
                "categorical_columns": CATEGORICAL_COLUMNS,
                "metrics": asdict(best_result),
            },
            file_handle,
        )

    report_path = output_dir / "model_metrics_report.json"
    with report_path.open("w", encoding="utf-8") as file_handle:
        json.dump(
            {
                "feature_columns": feature_columns,
                "numeric_columns": NUMERIC_COLUMNS,
                "categorical_columns": CATEGORICAL_COLUMNS,
                "test_size": test_size,
                "random_state": random_state,
                "results": [asdict(result) for result in results],
                "best_model": asdict(best_result),
                "best_model_path": str(best_model_path),
            },
            file_handle,
            indent=2,
        )

    print(f"Best model: {best_name}")
    print(f"Saved best model to: {best_model_path}")
    print(f"Saved metrics report to: {report_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train crop yield prediction models.")
    parser.add_argument(
        "--input-file",
        type=Path,
        default=Path("crop_yield.csv") / "Final_India_Crop_Yield_Featured.csv",
        help="Path to engineered dataset",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("Model"),
        help="Directory to save trained models",
    )
    parser.add_argument("--test-size", type=float, default=0.2, help="Test split ratio")
    parser.add_argument("--random-state", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    dataset = load_dataset(args.input_file)
    train_models(dataset, args.output_dir, args.test_size, args.random_state)


if __name__ == "__main__":
    main()
