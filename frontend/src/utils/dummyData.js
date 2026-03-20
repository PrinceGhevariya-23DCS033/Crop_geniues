// ─── Yield Trend Chart Data ──────────────────────────────────────────────────
export const yieldTrendData = [
  { month: 'Sep', rice: 4.2, wheat: 3.1, maize: 5.8 },
  { month: 'Oct', rice: 4.8, wheat: 3.4, maize: 6.1 },
  { month: 'Nov', rice: 4.5, wheat: 3.8, maize: 5.9 },
  { month: 'Dec', rice: 5.1, wheat: 4.2, maize: 6.5 },
  { month: 'Jan', rice: 4.9, wheat: 4.5, maize: 6.2 },
  { month: 'Feb', rice: 5.4, wheat: 4.8, maize: 6.8 },
]

// ─── Price Trend Chart Data ───────────────────────────────────────────────────
export const priceTrendData = [
  { month: 'Sep', rice: 1980, wheat: 2100, tomato: 3200, onion: 1800 },
  { month: 'Oct', rice: 2050, wheat: 2150, tomato: 2800, onion: 1950 },
  { month: 'Nov', rice: 2120, wheat: 2200, tomato: 4200, onion: 2100 },
  { month: 'Dec', rice: 2180, wheat: 2350, tomato: 3800, onion: 2400 },
  { month: 'Jan', rice: 2240, wheat: 2280, tomato: 3100, onion: 2200 },
  { month: 'Feb', rice: 2340, wheat: 2310, tomato: 2900, onion: 2050 },
]

// ─── Rainfall Distribution Data ──────────────────────────────────────────────
export const rainfallData = [
  { name: 'Jan', rainfall: 12 },
  { name: 'Feb', rainfall: 18 },
  { name: 'Mar', rainfall: 25 },
  { name: 'Apr', rainfall: 42 },
  { name: 'May', rainfall: 95 },
  { name: 'Jun', rainfall: 180 },
  { name: 'Jul', rainfall: 210 },
  { name: 'Aug', rainfall: 195 },
  { name: 'Sep', rainfall: 140 },
  { name: 'Oct', rainfall: 75 },
  { name: 'Nov', rainfall: 30 },
  { name: 'Dec', rainfall: 15 },
]

// ─── Crop Distribution (Pie) ──────────────────────────────────────────────────
export const cropDistributionData = [
  { name: 'Rice',    value: 35, color: '#10b981' },
  { name: 'Wheat',   value: 28, color: '#059669' },
  { name: 'Maize',   value: 18, color: '#34d399' },
  { name: 'Sugarcane', value: 12, color: '#6ee7b7' },
  { name: 'Others',  value: 7,  color: '#a7f3d0' },
]

// ─── Dashboard Stat Cards ─────────────────────────────────────────────────────
export const dashboardStats = [
  {
    id: 1,
    title: 'Recommended Crop',
    value: 'Rice',
    subtitle: 'Confidence: 94.2%',
    icon: 'Sprout',
    color: 'emerald',
    trend: '+2.1%',
    trendUp: true,
  },
  {
    id: 2,
    title: 'Predicted Yield',
    value: '5.4 t/ha',
    subtitle: 'Kharif 2026',
    icon: 'TrendingUp',
    color: 'green',
    trend: '+12.5%',
    trendUp: true,
  },
  {
    id: 3,
    title: 'Disease Status',
    value: 'Healthy',
    subtitle: 'Last scan: Today',
    icon: 'Shield',
    color: 'teal',
    trend: 'No risk',
    trendUp: true,
  },
  {
    id: 4,
    title: 'Market Trend',
    value: '₹2,340/q',
    subtitle: 'Rice — Feb 2026',
    icon: 'BarChart3',
    color: 'sky',
    trend: '+8.3%',
    trendUp: true,
  },
]

// ─── Districts ────────────────────────────────────────────────────────────────
export const districts = [
  'Pune', 'Nashik', 'Nagpur', 'Aurangabad', 'Solapur',
  'Kolhapur', 'Satara', 'Sangli', 'Ahmednagar', 'Jalgaon',
  'Amravati', 'Yavatmal', 'Nanded', 'Latur', 'Osmanabad',
  'Parbhani', 'Hingoli', 'Washim', 'Buldhana', 'Akola',
  'Chandrapur', 'Gadchiroli', 'Gondia', 'Bhandara', 'Wardha',
  'Ratnagiri', 'Sindhudurg', 'Raigad', 'Thane', 'Mumbai',
]

// ─── Crops List ───────────────────────────────────────────────────────────────
export const cropsList = [
  'Rice', 'Wheat', 'Maize', 'Chickpea', 'Kidney Beans',
  'Pigeon Peas', 'Moth Beans', 'Mung Bean', 'Black Gram', 'Lentil',
  'Pomegranate', 'Banana', 'Mango', 'Grapes', 'Watermelon',
  'Muskmelon', 'Apple', 'Orange', 'Papaya', 'Coconut',
  'Cotton', 'Jute', 'Coffee', 'Sugarcane', 'Tobacco',
  'Tomato', 'Onion', 'Potato', 'Brinjal', 'Capsicum',
]

// ─── Soil Types ───────────────────────────────────────────────────────────────
export const soilTypes = [
  'Alluvial Soil', 'Black Soil (Regur)', 'Red & Yellow Soil',
  'Laterite Soil', 'Arid Soil', 'Saline/Alkaline Soil',
  'Peaty/Marshy Soil', 'Forest/Mountain Soil', 'Sandy Loam',
  'Clay Loam', 'Silty Clay', 'Loam',
]

// ─── Seasons ─────────────────────────────────────────────────────────────────
export const seasons = ['Kharif', 'Rabi', 'Zaid', 'Whole Year']

// ─── Irrigation Types ─────────────────────────────────────────────────────────
export const irrigationTypes = [
  'Drip Irrigation', 'Sprinkler Irrigation', 'Flood Irrigation',
  'Furrow Irrigation', 'Rain-fed', 'Canal Irrigation',
]

// ─── Market Types ─────────────────────────────────────────────────────────────
export const marketTypes = ['APMC Mandi', 'Direct Market', 'Online Platform', 'Export Market', 'Cold Storage']

// ─── Months ──────────────────────────────────────────────────────────────────
export const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ─── Disease DB ──────────────────────────────────────────────────────────────
export const diseaseDatabase = {
  'Leaf Rust': {
    confidence: 91.3,
    severity: 'moderate',
    description: 'Fungal disease causing orange-brown pustules on leaf surfaces.',
    pesticide: 'Propiconazole 25% EC @ 1ml/L or Tebuconazole 25.9% EC @ 0.7ml/L',
    cure: ['Apply systemic fungicide immediately', 'Remove severely infected plant parts', 'Ensure proper field drainage'],
    prevention: ['Use resistant varieties', 'Crop rotation every 2 seasons', 'Balanced fertilizer application', 'Monitor field weekly'],
    badge: 'warning',
  },
  'Bacterial Blight': {
    confidence: 88.7,
    severity: 'high',
    description: 'Bacterial infection causing water-soaked lesions that turn yellow-brown.',
    pesticide: 'Copper Oxychloride 50% WP @ 3g/L or Streptomycin Sulphate @ 200ppm',
    cure: ['Remove and destroy infected plants', 'Apply copper-based bactericide', 'Avoid overhead irrigation'],
    prevention: ['Use certified disease-free seeds', 'Seed treatment with Pseudomonas fluorescens', 'Field sanitation after harvest'],
    badge: 'danger',
  },
  'Healthy': {
    confidence: 97.8,
    severity: 'none',
    description: 'Plant appears completely healthy with no signs of disease or deficiency.',
    pesticide: 'No treatment required',
    cure: ['Continue regular monitoring', 'Maintain current crop management practices'],
    prevention: ['Regular scouting every 7-10 days', 'Maintain optimal soil moisture', 'Timely weed management'],
    badge: 'success',
  },
  'Powdery Mildew': {
    confidence: 85.4,
    severity: 'low',
    description: 'Fungal disease appearing as white powdery coating on leaf surfaces.',
    pesticide: 'Sulphur 80% WP @ 3g/L or Hexaconazole 5% EC @ 2ml/L',
    cure: ['Apply fungicide at first sign of infection', 'Improve air circulation around plants', 'Reduce leaf wetness'],
    prevention: ['Avoid excess nitrogen fertilization', 'Space plants adequately', 'Use resistant varieties'],
    badge: 'warning',
  },
}

// ─── Price Predictions (dummy) ────────────────────────────────────────────────
export const getPricePrediction = (crop, district, month) => {
  const basePrices = {
    'Rice': 2340, 'Wheat': 2150, 'Maize': 1850, 'Tomato': 2900,
    'Onion': 1650, 'Potato': 1200, 'Cotton': 6800, 'Sugarcane': 340,
  }
  const base = basePrices[crop] ?? 2000
  const variance = (Math.random() * 0.2 - 0.1) * base
  const forecast = [1, 2, 3].map(m => ({
    month: months[(months.indexOf(month) + m) % 12],
    price: Math.round(base + variance + m * (base * 0.03)),
  }))
  return {
    price: Math.round(base + variance),
    suggestion: variance > 0 ? 'SELL' : 'HOLD',
    forecast,
    confidence: (80 + Math.random() * 12).toFixed(1),
  }
}

// ─── Crop Recommendation (dummy) ─────────────────────────────────────────────
export const getCropRecommendation = (inputs) => {
  const crops = [
    { name: 'Rice', season: 'Kharif', yield: '4.5–5.5 t/ha', fertilizer: 'Urea 120kg/ha + DAP 80kg/ha', confidence: 94.2 },
    { name: 'Wheat', season: 'Rabi', yield: '3.5–4.8 t/ha', fertilizer: 'Urea 100kg/ha + MOP 40kg/ha', confidence: 89.7 },
    { name: 'Maize', season: 'Kharif', yield: '5.5–7.0 t/ha', fertilizer: 'Urea 160kg/ha + SSP 200kg/ha', confidence: 86.3 },
    { name: 'Chickpea', season: 'Rabi', yield: '1.5–2.5 t/ha', fertilizer: 'DAP 50kg/ha + Rhizobium inoculant', confidence: 82.1 },
    { name: 'Sugarcane', season: 'Whole Year', yield: '70–90 t/ha', fertilizer: 'Urea 250kg/ha + Potash 80kg/ha', confidence: 78.9 },
  ]
  return crops[Math.floor(Math.random() * crops.length)]
}

// ─── Yield Prediction (dummy) ────────────────────────────────────────────────
export const getYieldPrediction = (inputs) => {
  const base = parseFloat(inputs.area ?? 1) * (3.5 + Math.random() * 2.5)
  return {
    yield: base.toFixed(2),
    unit: 't/ha',
    confidence: (78 + Math.random() * 14).toFixed(1),
    tips: [
      `Increase organic matter: Add ${Math.round(2 + Math.random() * 3)} tons/ha of compost`,
      `Optimal irrigation: 450–550mm water over crop season`,
      `Micro-nutrient application: ZnSO₄ @ 25kg/ha at sowing`,
      `Weed management: Pre-emergence herbicide at 3 DAS`,
      `Disease monitoring: Scout fields weekly during vegetative stage`,
    ],
    chartData: Array.from({ length: 6 }, (_, i) => ({
      week: `Wk ${i + 1}`,
      estimated: +(base * (0.6 + i * 0.08)).toFixed(2),
      optimal: +(base * (0.65 + i * 0.07)).toFixed(2),
    })),
  }
}
