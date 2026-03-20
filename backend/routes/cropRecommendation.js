/**
 * Crop Recommendation Route
 * 
 * Proxies to HuggingFace: POST /predict
 * Input:  { place, N, P, K, ph }
 * Output: { location, temperature, humidity, rainfall, recommended_crop, confidence }
 */

import { Router } from 'express';

const router = Router();
const API_BASE = () => process.env.CROP_RECOMMENDATION_API;

// POST /api/crop-recommendation/predict
router.post('/predict', async (req, res) => {
  try {
    const { place, N, P, K, ph } = req.body;

    // Validation
    if (!place) return res.status(400).json({ error: 'Location (place) is required' });
    if (N == null || P == null || K == null || ph == null) {
      return res.status(400).json({ error: 'N, P, K, and ph are all required' });
    }

    // Open-Meteo geocoding expects a simple city name (e.g. "Surat"), not
    // a full comma-separated address ("Surat, Gujarat, India") which returns 404.
    // Extract just the district/city part before the first comma.
    const geocodePlace = place.includes(',') ? place.split(',')[0].trim() : place;

    console.log(`📥 Crop recommendation request: place=${place} → geocodePlace=${geocodePlace}, N=${N}, P=${P}, K=${K}, ph=${ph}`);

    const response = await fetch(`${API_BASE()}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ place: geocodePlace, N: Number(N), P: Number(P), K: Number(K), ph: Number(ph) }),
      signal: AbortSignal.timeout(30000), // 30s timeout (weather APIs can be slow)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ HF API error:', response.status, errorData);
      return res.status(response.status).json({
        error: errorData.detail || 'Crop recommendation service failed',
      });
    }

    const data = await response.json();
    console.log(`✅ Recommended: ${data.recommended_crop} (${data.confidence})`);

    res.json(data);
  } catch (err) {
    console.error('❌ Crop recommendation error:', err.message);
    if (err.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Request timed out. Weather APIs may be slow. Try again.' });
    }
    res.status(500).json({ error: 'Failed to get crop recommendation', detail: err.message });
  }
});

// GET /api/crop-recommendation/health
router.get('/health', async (_req, res) => {
  try {
    const r = await fetch(`${API_BASE()}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ status: 'unreachable', error: err.message });
  }
});

export { router as cropRecommendationRouter };
