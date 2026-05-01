# Plant Disease API Usage Guide

This document explains how to send parameters and an image file to the Plant Disease Detection API hosted on Hugging Face Spaces.

## 1. Base URL

Use this base URL:

`https://princegh410-plant-disease-api.hf.space`

## 2. Prediction Endpoint

- Method: `POST`
- URL: `/predict`
- Content-Type: `multipart/form-data`
- Required form field:
  - `file` (image file)

Full endpoint:

`https://princegh410-plant-disease-api.hf.space/predict`

## 3. Allowed Input

- Send a real image file (`image/*` content type)
- Examples: `.jpg`, `.jpeg`, `.png`

If the request does not contain an image in the `file` field, API returns error `400`.

## 4. Output Format

Successful response (`200`) example:

```json
{
  "prediction": {
    "class": "Tomato___Late_blight",
    "plant": "Tomato",
    "disease": "Late_blight",
    "confidence": 0.9821
  }
}
```

## 5. cURL Example

```bash
curl -X POST "https://princegh410-plant-disease-api.hf.space/predict" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@leaf.jpg"
```

## 6. Python Example (requests)

```python
import requests

url = "https://princegh410-plant-disease-api.hf.space/predict"

with open("leaf.jpg", "rb") as img:
    files = {"file": ("leaf.jpg", img, "image/jpeg")}
    response = requests.post(url, files=files, timeout=60)

print("Status:", response.status_code)
print("Response:", response.json())
```

## 7. JavaScript Example (fetch)

```javascript
async function detectPlantDisease(imageFile) {
  const url = "https://princegh410-plant-disease-api.hf.space/predict";

  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  return response.json();
}
```

## 8. Postman Setup

1. Create request with method `POST`
2. URL: `https://princegh410-plant-disease-api.hf.space/predict`
3. Open Body tab -> choose `form-data`
4. Add key `file`
5. Change key type from Text to File
6. Choose your image and send request

## 9. Health and Docs URLs

- Health check: `https://princegh410-plant-disease-api.hf.space/health`
- Swagger docs: `https://princegh410-plant-disease-api.hf.space/docs`

## 10. Common Errors

- `400 Invalid image file`
  - Cause: file field is not an image
  - Fix: upload jpg/png image using form field name exactly `file`

- `503 Model not loaded`
  - Cause: model failed during startup
  - Fix: check Hugging Face Space logs and restart Space
