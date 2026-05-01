---
title: Crop Yield Prediction API
emoji: 🌾
colorFrom: green
colorTo: yellow
sdk: docker
pinned: false
---

# Crop Yield Prediction Module

This module serves crop-yield predictions for Crop Genius using the trained model in:

- `../../model/crop_yield/best_crop_yield_model.pkl`

## Run locally

```bash
pip install -r requirements.txt
python run_server.py
```

The API starts on `http://localhost:8010`.

## Deploy to Hugging Face Spaces (Docker)

1. Create a new Space and choose `Docker` SDK.
2. Push this folder as the Space repository root.
3. Add Space Variables:
  - `HF_MODEL_REPO_ID` = your model repo id (example: `username/crop-yield-model`)
  - Optional: `HF_MODEL_FILENAME` (default: `best_crop_yield_model.pkl`)
  - Optional: `HF_MODEL_REVISION` (branch/tag/commit)

If the local model file is not present in the Space, the app auto-downloads it from `HF_MODEL_REPO_ID`.

## Endpoints

- `GET /health` - service health check
- `POST /predict` - predict yield (t/ha)

## Request body (`POST /predict`)

```json
{
  "area": 5.5,
  "soil_quality": 7,
  "annual_rainfall": 680,
  "mean_temperature": 28,
  "fertilizer": 120,
  "irrigation_type": "Drip Irrigation",
  "crop": "Rice",
  "season": "Kharif",
  "state": "Gujarat",
  "crop_year": 2026
}
```
