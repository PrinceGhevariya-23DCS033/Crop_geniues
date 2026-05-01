/**
 * Crop Yield Prediction Route
 *
 * Proxies to Crop Yield API (FastAPI-based)
 * Endpoint:
 *   POST /predict -> predict crop yield in t/ha
 */

import { Router } from 'express';

const router = Router();
const API_BASE = () => process.env.CROP_YIELD_API;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const buildFallbackYieldPrediction = (payload) => {
  const area = Number(payload.area || 1);
  const soilQuality = Number(payload.soilQuality ?? 7);
  const rainfall = payload.rainfall != null ? Number(payload.rainfall) : 900 + soilQuality * 70;
  const temperature = payload.temperature != null ? Number(payload.temperature) : 26 + (7 - soilQuality) * 0.35;
  const fertilizer = Number(payload.fertilizer || 0);
  const irrigationType = String(payload.irrigationType || 'Rain-fed').trim().toLowerCase();
  const crop = String(payload.crop || 'Rice').trim().toLowerCase();

  const irrigationBonus = {
    'drip irrigation': 0.55,
    'sprinkler irrigation': 0.38,
    'flood irrigation': 0.12,
    'furrow irrigation': 0.22,
    'rain-fed': -0.18,
    'canal irrigation': 0.28,
  }[irrigationType] ?? 0.15;

  const cropBonus = {
    rice: 0.45,
    wheat: 0.35,
    maize: 0.32,
    cotton: 0.25,
    potato: 0.5,
  }[crop] ?? 0.2;

  const moistureScore = rainfall / 1100;
  const temperaturePenalty = Math.abs(temperature - 27) * 0.08;
  const fertilizerScore = Math.min(fertilizer / Math.max(area * 140, 1), 3) * 0.18;

  const predictedYield = clamp(
    1.2 + soilQuality * 0.42 + moistureScore + fertilizerScore + irrigationBonus + cropBonus - temperaturePenalty,
    0.4,
    12
  );

  const confidence = clamp(72 + soilQuality * 1.2 - temperaturePenalty * 3, 68, 94);

  const tips = [
    'Maintain balanced NPK application according to soil test results.',
    'Monitor weeds during the first 30 to 40 days after sowing.',
    'Scout crop weekly to detect pests and diseases early.',
  ];

  if (soilQuality < 5) {
    tips.unshift('Increase organic matter using compost or green manure to improve soil health.');
  }

  if (irrigationType === 'rain-fed') {
    tips.push('Use moisture-conservation practices like mulching for rain-fed fields.');
  } else {
    tips.push('Schedule irrigation at critical growth stages to reduce stress.');
  }

  if (predictedYield < 2.5) {
    tips.push('Consider improved seed variety and split fertilizer doses for better response.');
  } else if (predictedYield > 4.5) {
    tips.push('Current management is strong; focus on timely harvest and post-harvest handling.');
  }

  const chartData = Array.from({ length: 6 }, (_item, index) => ({
    week: `Wk ${index + 1}`,
    estimated: Number((predictedYield * (0.62 + index * 0.075)).toFixed(2)),
    optimal: Number((predictedYield * (0.68 + index * 0.07)).toFixed(2)),
  }));

  return {
    predicted_yield: Number(predictedYield.toFixed(3)),
    unit: 't/ha',
    confidence: Number(confidence.toFixed(1)),
    tips: tips.slice(0, 5),
    chart_data: chartData,
    model: 'heuristic_fallback',
    source: 'local-fallback',
    timestamp: new Date().toISOString(),
  };
};

const shouldFallbackFromYieldError = (err, response) => {
  if (response) {
    return response.status >= 500;
  }

  const message = String(err?.message || '').toLowerCase();
  return (
    message.includes('fetch failed') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('timeout') ||
    message.includes('aborted')
  );
};

// POST /api/yield-prediction/predict
router.post('/predict', async (req, res) => {
  try {
    const {
      area,
      soilQuality,
      rainfall,
      temperature,
      fertilizer,
      irrigationType,
      crop,
      season,
      state,
      district,
      cropYear,
    } = req.body;

    if (area == null || !irrigationType) {
      return res.status(400).json({
        error: 'area and irrigationType are required',
      });
    }

    const hasManualWeather = rainfall != null && temperature != null;
    const place = district && state ? `${district}, ${state}, India` : null;

    const body = {
      area: Number(area),
      soil_quality: soilQuality == null ? 7 : Number(soilQuality),
      annual_rainfall: hasManualWeather ? Number(rainfall) : null,
      mean_temperature: hasManualWeather ? Number(temperature) : null,
      fertilizer: fertilizer == null || fertilizer === '' ? 0 : Number(fertilizer),
      irrigation_type: irrigationType,
      crop: crop || 'Rice',
      season: season || 'Kharif',
      state: state || 'Gujarat',
      district: district || null,
      place,
      use_openmeteo: !hasManualWeather,
      crop_year: cropYear ? Number(cropYear) : new Date().getFullYear(),
    };

    const response = await fetch(`${API_BASE()}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (shouldFallbackFromYieldError(null, response)) {
        return res.json(buildFallbackYieldPrediction(req.body));
      }

      return res.status(response.status).json({
        error: errorData.detail || errorData.error || 'Yield prediction service failed',
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    if (shouldFallbackFromYieldError(err)) {
      return res.json(buildFallbackYieldPrediction(req.body));
    }

    if (err.name === 'TimeoutError') {
      return res.json(buildFallbackYieldPrediction(req.body));
    }
    res.status(500).json({ error: 'Failed to get yield prediction', detail: err.message });
  }
});

// GET /api/yield-prediction/health
router.get('/health', async (_req, res) => {
  try {
    const r = await fetch(`${API_BASE()}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ status: 'unreachable', error: err.message });
  }
});

export { router as yieldPredictionRouter };
