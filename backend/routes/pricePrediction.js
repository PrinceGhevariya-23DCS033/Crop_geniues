/**
 * Crop Price Prediction Route
 * 
 * Proxies to HuggingFace Crop Price API (FastAPI-based)
 * Endpoints:
 *   GET  /crops       → list supported crops
 *   GET  /districts   → list supported districts
 *   POST /predict     → predict harvest price
 */

import { Router } from 'express';

const router = Router();
const API_BASE = () => process.env.CROP_PRICE_API;

// GET /api/price-prediction/crops
router.get('/crops', async (_req, res) => {
  try {
    const response = await fetch(`${API_BASE()}/api/crops`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`HF returned ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('❌ Fetch crops error:', err.message);
    // Return hardcoded crop list as fallback
    res.json([
      "Ajwan", "Amaranthus", "Apple", "Banana", "Beans", "Beetroot", "Brinjal",
      "Cabbage", "Capsicum", "Carrot", "Castor Seed", "Cauliflower", "Chili Red",
      "Colacasia", "Cotton", "Drumstick", "Dry Chillies", "Garlic", "Green Chilli",
      "Green Peas", "Ground Nut Seed", "Groundnut", "Guar", "Guava",
      "Leafy Vegetable", "Maize", "Mango", "Methi Seeds", "Moath Dal",
      "Mustard", "Onion", "Onion Green", "Orange", "Papaya", "Peas Wet",
      "Pomegranate", "Pumpkin", "Raddish", "Rajgir", "Soanf", "Sweet Potato",
      "Tinda", "Tobacco", "Tomato", "Water Melon", "Wheat"
    ]);
  }
});

// GET /api/price-prediction/districts
router.get('/districts', async (_req, res) => {
  try {
    const response = await fetch(`${API_BASE()}/api/districts`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`HF returned ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('❌ Fetch districts error:', err.message);
    // Fallback Gujarat districts (lowercase as API expects)
    res.json([
      "ahmadabad", "amreli", "anand", "aravalli", "banaskantha", "bharuch",
      "bhavnagar", "botad", "chhotaudaipur", "dahod", "devbhumidwarka",
      "gandhinagar", "girsomnath", "jamnagar", "junagadh", "kachchh",
      "kheda", "mahesana", "mahisagar", "morbi", "narmada", "navsari",
      "panchmahals", "patan", "porbandar", "rajkot", "sabarkantha",
      "surat", "surendranagar", "tapi", "thedangs", "vadodara", "valsad"
    ]);
  }
});

// Helper function to normalize commodity names
function normalizeCommodity(name) {
  const mapping = {
    'ajwan': 'Ajwan',
    'ajwain': 'Ajwan',
    'tomato': 'Tomato',
    'onion': 'Onion',
    'potato': 'Potato',
    'wheat': 'Wheat',
    'rice': 'Rice',
  };
  const lower = name.toLowerCase().trim();
  return mapping[lower] || name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Helper function to normalize district names (API expects lowercase)
function normalizeDistrict(name) {
  const mapping = {
    'ahmedabad': 'ahmadabad',  // Common spelling variation
    'chhota udaipur': 'chhotaudaipur',
    'devbhumi dwarka': 'devbhumidwarka',
    'gir somnath': 'girsomnath',
    'panchmahal': 'panchmahals',
    'the dangs': 'thedangs',
  };
  const lower = name.toLowerCase().trim().replace(/\s+/g, '');
  return mapping[lower] || lower;
}

// POST /api/price-prediction/predict
router.post('/predict', async (req, res) => {
  try {
    let { commodity, district } = req.body;

    if (!commodity || !district) {
      return res.status(400).json({ error: 'commodity and district are required' });
    }

    // Normalize inputs for better API compatibility
    commodity = normalizeCommodity(commodity);
    district = normalizeDistrict(district);

    console.log(`📥 Price prediction request: ${commodity} in ${district}`);

    // Use actual current month — cache is updated monthly and available throughout the month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() is 0-indexed, +1 gives correct current month

    const body = {
      commodity,
      district,
      year,
      month,
    };

    const response = await fetch(`${API_BASE()}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000), // 60s → data fetching may be slow
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      console.error('❌ HF Price API error:', response.status);
      console.error('   Request body:', JSON.stringify(body));
      console.error('   Response:', errorText || '(empty)');
      
      // Check if it's a validation error
      if (response.status === 422 || response.status === 400) {
        return res.status(400).json({
          error: 'Invalid commodity or district',
          detail: `The combination "${commodity}" in "${district}" is not supported. Please check the available crops and districts.`,
          suggestion: 'Try using /crops and /districts endpoints to see valid options',
        });
      }
      
      // Handle 500 errors with better messaging
      if (response.status === 500) {
        return res.status(400).json({
          error: 'Price prediction unavailable',
          detail: `Unable to predict price for "${commodity}" in "${district}". This combination may not have sufficient historical training data.`,
          suggestion: 'Common working combinations: Onion/Wheat/Cotton in major districts like Rajkot, Surat, or Vadodara',
          hint: 'Try /crops and /districts endpoints to see all available options'
        });
      }
      
      return res.status(response.status).json({
        error: errorData.detail || errorData.message || 'Price prediction service failed',
      });
    }

    const data = await response.json();
    console.log(`✅ Predicted: ₹${data.predicted_harvest_price} for ${commodity} in ${district}`);

    res.json(data);
  } catch (err) {
    console.error('❌ Price prediction error:', err.message);
    if (err.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Request timed out. Try again.' });
    }
    res.status(500).json({ error: 'Failed to get price prediction', detail: err.message });
  }
});

// GET /api/price-prediction/health
router.get('/health', async (_req, res) => {
  try {
    const r = await fetch(`${API_BASE()}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ status: 'unreachable', error: err.message });
  }
});

export { router as pricePredictionRouter };
