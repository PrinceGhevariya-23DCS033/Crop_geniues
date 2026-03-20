/**
 * Leaf Disease Detection Route
 * 
 * Proxies to HuggingFace: POST /predict (multipart file upload)
 * Input:  image file (multipart/form-data)
 * Output: { prediction: { class, plant, disease, confidence } }
 */

import { Router } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const API_BASE = () => process.env.PLANT_DISEASE_API;

// Disease information database for cure/prevention details
const DISEASE_INFO = {
  'Apple___Apple_scab': {
    severity: 'moderate', badge: 'warning',
    description: 'Fungal disease caused by Venturia inaequalis. Causes dark, scabby lesions on leaves and fruit.',
    pesticide: 'Captan 50% WP @ 2g/L or Mancozeb 75% WP @ 2.5g/L',
    cure: ['Apply fungicide sprays at first sign of infection', 'Remove and destroy fallen infected leaves', 'Prune to improve air circulation'],
    prevention: ['Plant resistant apple varieties', 'Apply dormant-season copper sprays', 'Maintain proper tree spacing', 'Clean up fallen leaves in autumn'],
  },
  'Apple___Black_rot': {
    severity: 'high', badge: 'danger',
    description: 'Fungal disease causing black, rotting lesions on fruit, leaves, and bark (caused by Botryosphaeria obtusa).',
    pesticide: 'Thiophanate-methyl 70% WP @ 1g/L or Captan 50% WP @ 2g/L',
    cure: ['Remove all mummified fruit from tree and ground', 'Prune dead wood and cankers', 'Apply fungicide at petal fall'],
    prevention: ['Remove dead wood promptly', 'Maintain tree vigor with proper fertilization', 'Avoid wounding trees during cultivation'],
  },
  'Apple___Cedar_apple_rust': {
    severity: 'moderate', badge: 'warning',
    description: 'Fungal disease causing bright orange-yellow spots on apple leaves. Requires both apple and cedar/juniper hosts.',
    pesticide: 'Myclobutanil 10% WP @ 0.5g/L or Mancozeb 75% WP @ 2.5g/L',
    cure: ['Apply fungicide in spring during spore release', 'Remove nearby cedar/juniper trees if possible', 'Remove heavily infected leaves'],
    prevention: ['Plant rust-resistant apple varieties', 'Remove cedar galls before spring', 'Maintain good tree nutrition'],
  },
  'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': {
    severity: 'moderate', badge: 'warning',
    description: 'Fungal disease causing rectangular gray-tan lesions parallel to leaf veins in corn.',
    pesticide: 'Azoxystrobin 23% SC @ 1ml/L or Propiconazole 25% EC @ 1ml/L',
    cure: ['Apply foliar fungicide at first symptoms', 'Reduce plant stress through irrigation', 'Scout fields regularly for early detection'],
    prevention: ['Rotate crops (avoid corn-on-corn)', 'Use resistant hybrids', 'Tillage to bury crop residue', 'Maintain proper plant populations'],
  },
  'Corn_(maize)___Common_rust_': {
    severity: 'moderate', badge: 'warning',
    description: 'Fungal disease producing small, circular to elongated reddish-brown pustules on both leaf surfaces.',
    pesticide: 'Mancozeb 75% WP @ 2.5g/L or Propiconazole 25% EC @ 1ml/L',
    cure: ['Apply foliar fungicide if infection is severe', 'Monitor disease progress regularly', 'Ensure proper plant nutrition'],
    prevention: ['Plant resistant corn hybrids', 'Avoid late planting', 'Maintain balanced soil fertility'],
  },
  'Corn_(maize)___Northern_Leaf_Blight': {
    severity: 'high', badge: 'danger',
    description: 'Fungal disease causing long, elliptical gray-green or tan lesions on corn leaves.',
    pesticide: 'Azoxystrobin 23% SC @ 1ml/L or Trifloxystrobin + Tebuconazole @ 0.6g/L',
    cure: ['Apply fungicide at first sign of lesions', 'Remove severely infected plant material', 'Improve field drainage'],
    prevention: ['Use resistant hybrids', 'Practice crop rotation', 'Tillage to decompose infected residue', 'Avoid overhead irrigation'],
  },
  'Grape___Black_rot': {
    severity: 'high', badge: 'danger',
    description: 'Fungal disease causing brown circular leaf spots and black, shriveled (mummified) berries.',
    pesticide: 'Mancozeb 75% WP @ 2g/L or Myclobutanil 10% WP @ 0.5g/L',
    cure: ['Remove and destroy all mummified berries', 'Apply fungicide before and after bloom', 'Prune to improve air circulation'],
    prevention: ['Remove mummies from vines and ground', 'Open canopy for better air flow', 'Apply fungicide sprays starting at bud break'],
  },
  'Grape___Esca_(Black_Measles)': {
    severity: 'high', badge: 'danger',
    description: 'Complex fungal disease causing interveinal striping on leaves and dark spots on berries.',
    pesticide: 'No fully effective chemical control. Wound protectants like Trichoderma-based products may help.',
    cure: ['Remove and destroy severely affected vines', 'Apply wound sealant after pruning', 'Retrain trunks from suckers'],
    prevention: ['Minimize large pruning wounds', 'Delay pruning to reduce wood moisture', 'Apply Trichoderma to pruning wounds'],
  },
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {
    severity: 'moderate', badge: 'warning',
    description: 'Fungal disease causing angular, dark brown spots on grape leaves, often with yellow halos.',
    pesticide: 'Mancozeb 75% WP @ 2.5g/L or Copper Oxychloride 50% WP @ 3g/L',
    cure: ['Apply fungicide at first appearance', 'Remove infected leaves', 'Improve canopy management'],
    prevention: ['Good canopy management', 'Proper vineyard sanitation', 'Avoid overhead irrigation'],
  },
  'Orange___Haunglongbing_(Citrus_greening)': {
    severity: 'high', badge: 'danger',
    description: 'Bacterial disease spread by Asian citrus psyllid. Causes blotchy mottled yellowing, misshapen fruit, and tree decline.',
    pesticide: 'Imidacloprid 17.8% SL to control psyllid vector. No cure for the disease itself.',
    cure: ['Control psyllid populations aggressively', 'Remove and destroy infected trees', 'Boost tree nutrition with foliar sprays'],
    prevention: ['Use certified disease-free nursery stock', 'Monitor and control psyllid populations', 'Plant in psyllid-free zones', 'Regular scouting for symptoms'],
  },
  'Peach___Bacterial_spot': {
    severity: 'moderate', badge: 'warning',
    description: 'Bacterial disease causing small, dark, water-soaked spots on leaves, fruit, and twigs.',
    pesticide: 'Copper hydroxide 53.8% DF @ 2g/L or Oxytetracycline @ 200ppm',
    cure: ['Apply copper sprays during dormant season', 'Remove severely infected branches', 'Avoid overhead irrigation'],
    prevention: ['Plant resistant varieties', 'Avoid high-nitrogen fertilization', 'Maintain proper tree spacing for air flow'],
  },
  'Pepper,_bell___Bacterial_spot': {
    severity: 'moderate', badge: 'warning',
    description: 'Bacterial disease causing small, water-soaked lesions on leaves and raised, scab-like spots on fruit.',
    pesticide: 'Copper Oxychloride 50% WP @ 3g/L with Mancozeb 75% WP @ 2.5g/L',
    cure: ['Remove infected plants immediately', 'Apply copper-based bactericide', 'Avoid working in wet fields'],
    prevention: ['Use certified disease-free seed', 'Practice crop rotation (3+ years)', 'Avoid overhead irrigation', 'Disinfect tools between plants'],
  },
  'Potato___Early_blight': {
    severity: 'moderate', badge: 'warning',
    description: 'Fungal disease causing dark brown, concentric-ring "target" spots on older leaves first.',
    pesticide: 'Mancozeb 75% WP @ 2.5g/L or Chlorothalonil 75% WP @ 2g/L',
    cure: ['Apply fungicide at first signs', 'Remove lower infected leaves', 'Maintain adequate plant nutrition'],
    prevention: ['Use certified seed potatoes', 'Practice 3-year crop rotation', 'Adequate spacing for air flow', 'Mulch to prevent soil splash'],
  },
  'Potato___Late_blight': {
    severity: 'high', badge: 'danger',
    description: 'Devastating oomycete disease causing water-soaked lesions, white mold under leaves, and rapid plant death.',
    pesticide: 'Metalaxyl + Mancozeb (Ridomil Gold) @ 2.5g/L or Cymoxanil + Mancozeb @ 3g/L',
    cure: ['Apply systemic fungicide immediately', 'Destroy severely infected plants', 'Harvest tubers in dry conditions'],
    prevention: ['Use certified disease-free seed', 'Plant resistant varieties', 'Avoid overhead irrigation', 'Destroy volunteer potato plants'],
  },
  'Squash___Powdery_mildew': {
    severity: 'moderate', badge: 'warning',
    description: 'Fungal disease causing white, powdery coating on leaf surfaces, reducing photosynthesis.',
    pesticide: 'Sulphur 80% WP @ 3g/L or Myclobutanil 10% WP @ 0.4g/L',
    cure: ['Apply fungicide at first appearance of white spots', 'Remove severely infected leaves', 'Improve air circulation'],
    prevention: ['Plant resistant varieties', 'Avoid excessive nitrogen', 'Maintain proper plant spacing', 'Water at base, not on leaves'],
  },
  'Strawberry___Leaf_scorch': {
    severity: 'moderate', badge: 'warning',
    description: 'Fungal disease causing small, dark purple spots that enlarge and develop light brown centers.',
    pesticide: 'Captan 50% WP @ 2g/L or Myclobutanil 10% WP @ 0.4g/L',
    cure: ['Apply fungicide during early spring', 'Remove infected leaves', 'Thin plants for better air flow'],
    prevention: ['Use resistant varieties', 'Renovate beds after harvest', 'Avoid overhead irrigation', 'Remove old leaves in spring'],
  },
  'Tomato___Bacterial_spot': {
    severity: 'moderate', badge: 'warning',
    description: 'Bacterial disease causing small, dark, greasy spots on leaves, stems, and fruit.',
    pesticide: 'Copper Oxychloride 50% WP @ 3g/L + Streptomycin Sulphate @ 200ppm',
    cure: ['Apply copper-based bactericide', 'Remove severely infected plants', 'Avoid working in wet fields'],
    prevention: ['Use disease-free seed', 'Practice crop rotation', 'Avoid overhead irrigation', 'Disinfect equipment'],
  },
  'Tomato___Early_blight': {
    severity: 'moderate', badge: 'warning',
    description: 'Fungal disease (Alternaria solani) causing dark brown target-like spots starting on lower leaves.',
    pesticide: 'Mancozeb 75% WP @ 2.5g/L or Chlorothalonil 75% WP @ 2g/L',
    cure: ['Apply fungicide at first symptom', 'Remove infected lower leaves', 'Stake plants to improve air flow'],
    prevention: ['Mulch around plants', 'Practice crop rotation', 'Avoid overhead watering', 'Ensure good air circulation'],
  },
  'Tomato___Late_blight': {
    severity: 'high', badge: 'danger',
    description: 'Devastating oomycete disease causing water-soaked lesions on leaves and rapid browning/death.',
    pesticide: 'Metalaxyl + Mancozeb (Ridomil Gold) @ 2.5g/L or Cymoxanil + Mancozeb @ 3g/L',
    cure: ['Apply systemic fungicide immediately', 'Remove and destroy infected plants', 'Do not compost infected material'],
    prevention: ['Plant resistant varieties', 'Avoid overhead irrigation', 'Ensure good air flow', 'Remove volunteer plants'],
  },
  'Tomato___Leaf_Mold': {
    severity: 'moderate', badge: 'warning',
    description: 'Fungal disease causing yellow spots on upper leaf surface and olive-green mold underneath.',
    pesticide: 'Mancozeb 75% WP @ 2.5g/L or Copper Oxychloride 50% WP @ 3g/L',
    cure: ['Improve greenhouse ventilation', 'Remove severely infected leaves', 'Apply fungicide at first signs'],
    prevention: ['Maintain low humidity (<85%)', 'Space plants for air circulation', 'Avoid wetting leaves', 'Use resistant varieties'],
  },
  'Tomato___Septoria_leaf_spot': {
    severity: 'moderate', badge: 'warning',
    description: 'Fungal disease causing small circular spots with dark margins and tan centers on lower leaves.',
    pesticide: 'Chlorothalonil 75% WP @ 2g/L or Mancozeb 75% WP @ 2.5g/L',
    cure: ['Apply fungicide at first appearance', 'Remove infected lower leaves', 'Avoid overhead watering'],
    prevention: ['Mulch around plants', 'Crop rotation (at least 3 years)', 'Stake/cage plants for air flow', 'Water at plant base'],
  },
  'Tomato___Spider_mites Two-spotted_spider_mite': {
    severity: 'moderate', badge: 'warning',
    description: 'Tiny arachnids that suck cell contents, causing stippling, yellowing, and fine webbing on leaves.',
    pesticide: 'Abamectin 1.8% EC @ 0.5ml/L or Spiromesifen 22.9% SC @ 0.5ml/L',
    cure: ['Apply miticide to undersides of leaves', 'Use strong water spray to knock mites off', 'Release predatory mites (Phytoseiulus)'],
    prevention: ['Avoid dusty conditions near fields', 'Maintain adequate plant moisture', 'Encourage natural predators', 'Avoid broad-spectrum insecticides'],
  },
  'Tomato___Target_Spot': {
    severity: 'moderate', badge: 'warning',
    description: 'Fungal disease (Corynespora cassiicola) causing circular brown lesions with concentric rings on leaves.',
    pesticide: 'Chlorothalonil 75% WP @ 2g/L or Azoxystrobin 23% SC @ 1ml/L',
    cure: ['Apply fungicide at first sighting', 'Remove heavily infected leaves', 'Improve air circulation'],
    prevention: ['Practice crop rotation', 'Avoid overhead irrigation', 'Proper plant spacing', 'Remove crop debris after harvest'],
  },
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
    severity: 'high', badge: 'danger',
    description: 'Viral disease transmitted by whiteflies. Causes leaf curling, yellowing, and stunted growth.',
    pesticide: 'Imidacloprid 17.8% SL @ 0.3ml/L to control whitefly vector. No cure for the virus.',
    cure: ['Remove and destroy infected plants immediately', 'Control whitefly populations aggressively', 'Use reflective mulch to repel whiteflies'],
    prevention: ['Use resistant varieties', 'Install insect-proof netting', 'Use yellow sticky traps for whiteflies', 'Remove alternate host weeds'],
  },
  'Tomato___Tomato_mosaic_virus': {
    severity: 'high', badge: 'danger',
    description: 'Viral disease causing mosaic pattern of light and dark green on leaves, stunted growth, and distorted fruit.',
    pesticide: 'No chemical cure. Control by sanitation and resistant varieties.',
    cure: ['Remove and destroy infected plants', 'Disinfect hands and tools with milk solution', 'Do not save seed from infected plants'],
    prevention: ['Use resistant varieties', 'Disinfect tools with 10% bleach solution', 'Wash hands before handling plants', 'Control aphid vectors'],
  },
};

// Healthy plant entries
const HEALTHY_CLASSES = [
  'Apple___healthy', 'Blueberry___healthy', 'Cherry_(including_sour)___healthy',
  'Corn_(maize)___healthy', 'Grape___healthy', 'Peach___healthy',
  'Pepper,_bell___healthy', 'Potato___healthy', 'Raspberry___healthy',
  'Soybean___healthy', 'Strawberry___healthy', 'Tomato___healthy',
];

function getDiseaseDetails(className) {
  // Check if healthy
  if (className.toLowerCase().includes('healthy')) {
    const plant = className.split('___')[0].replace(/_/g, ' ');
    return {
      severity: 'none',
      badge: 'success',
      description: `The ${plant} plant appears completely healthy with no signs of disease, pest damage, or nutrient deficiency.`,
      pesticide: 'No treatment required. Continue regular monitoring.',
      cure: ['Continue regular monitoring', 'Maintain current crop management practices'],
      prevention: ['Regular scouting every 7-10 days', 'Maintain optimal soil moisture', 'Timely weed management', 'Balanced fertilization'],
    };
  }

  // Look up in disease database
  if (DISEASE_INFO[className]) {
    return DISEASE_INFO[className];
  }

  // Default for unknown diseases
  const parts = className.split('___');
  const plant = parts[0]?.replace(/_/g, ' ') || 'Unknown';
  const disease = parts[1]?.replace(/_/g, ' ') || 'Unknown disease';
  return {
    severity: 'moderate',
    badge: 'warning',
    description: `${disease} detected on ${plant}. Consult a local agricultural expert for specific treatment recommendations.`,
    pesticide: 'Consult local agricultural extension office for recommended treatment.',
    cure: ['Consult local agricultural expert', 'Remove severely infected plant parts', 'Improve field sanitation'],
    prevention: ['Use disease-resistant varieties', 'Practice crop rotation', 'Maintain field hygiene', 'Regular scouting'],
  };
}

// POST /api/leaf-disease/predict
router.post('/predict', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided. Upload an image with field name "file".' });
    }

    console.log(`📥 Leaf disease request: ${req.file.originalname} (${(req.file.size / 1024).toFixed(0)} KB)`);

    // Build FormData for HuggingFace API
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    const formData = new FormData();
    formData.append('file', blob, req.file.originalname);

    const response = await fetch(`${API_BASE()}/predict`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ HF API error:', response.status, errorData);
      return res.status(response.status).json({
        error: errorData.detail || 'Plant disease detection service failed',
      });
    }

    const data = await response.json();
    const prediction = data.prediction;

    // Enrich with disease details
    const details = getDiseaseDetails(prediction.class);

    const result = {
      name: prediction.disease === 'Unknown' ? prediction.class : prediction.disease.replace(/_/g, ' '),
      plant: prediction.plant.replace(/_/g, ' '),
      fullClass: prediction.class,
      confidence: Math.round(prediction.confidence * 100 * 10) / 10, // percentage with 1 decimal
      ...details,
    };

    console.log(`✅ Detected: ${result.name} on ${result.plant} (${result.confidence}%)`);

    res.json(result);
  } catch (err) {
    console.error('❌ Leaf disease error:', err.message);
    if (err.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Request timed out. The model may be loading. Try again in 30 seconds.' });
    }
    res.status(500).json({ error: 'Failed to analyze leaf image', detail: err.message });
  }
});

// GET /api/leaf-disease/health
router.get('/health', async (_req, res) => {
  try {
    const r = await fetch(`${API_BASE()}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ status: 'unreachable', error: err.message });
  }
});

export { router as leafDiseaseRouter };
