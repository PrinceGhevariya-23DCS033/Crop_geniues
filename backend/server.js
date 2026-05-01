/**
 * Crop Genius Backend Server
 * 
 * Full-stack backend with MongoDB Atlas:
 *  1. Auth (Register/Login/Profile)       → /api/auth
 *  2. Crop Recommendation (HuggingFace)   → /api/crop-recommendation
 *  3. Crop Yield Prediction (FastAPI)     → /api/yield-prediction
 *  4. Plant Disease Detection (HuggingFace) → /api/leaf-disease
 *  5. Crop Price Prediction (HuggingFace) → /api/price-prediction
 *  6. Prediction History (MongoDB)        → /api/history
 *  7. Notifications (MongoDB)             → /api/notifications
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { cropRecommendationRouter } from './routes/cropRecommendation.js';
import { yieldPredictionRouter } from './routes/yieldPrediction.js';
import { leafDiseaseRouter } from './routes/leafDisease.js';
import { pricePredictionRouter } from './routes/pricePrediction.js';
import { authRouter } from './routes/auth.js';
import { historyRouter } from './routes/history.js';
import { notificationRouter } from './routes/notifications.js';
import { agriNewsRouter } from './routes/agriNews.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Connect to MongoDB ─────────────────────────────────────────────────────
connectDB();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/crop-recommendation', cropRecommendationRouter);
app.use('/api/yield-prediction', yieldPredictionRouter);
app.use('/api/leaf-disease', leafDiseaseRouter);
app.use('/api/price-prediction', pricePredictionRouter);
app.use('/api/history', historyRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/agri-news', agriNewsRouter);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const apis = {
    plant_disease: process.env.PLANT_DISEASE_API,
    crop_recommendation: process.env.CROP_RECOMMENDATION_API,
    crop_yield: process.env.CROP_YIELD_API,
    crop_price: process.env.CROP_PRICE_API,
  };

  const checks = {};
  for (const [name, url] of Object.entries(apis)) {
    try {
      const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(8000) });
      checks[name] = r.ok ? 'healthy' : 'unhealthy';
    } catch {
      checks[name] = 'unreachable';
    }
  }

  res.json({
    status: 'ok',
    server: 'Crop Genius Backend',
    timestamp: new Date().toISOString(),
    services: checks,
  });
});

// ─── Root ───────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    service: 'Crop Genius Backend API',
    version: '2.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'PUT /api/auth/password',
      },
      cropRecommendation: 'POST /api/crop-recommendation/predict',
      yieldPrediction: 'POST /api/yield-prediction/predict',
      leafDisease: 'POST /api/leaf-disease/predict',
      pricePrediction: {
        predict: 'POST /api/price-prediction/predict',
        crops: 'GET /api/price-prediction/crops',
        districts: 'GET /api/price-prediction/districts',
      },
      history: {
        list: 'GET /api/history',
        add: 'POST /api/history',
        stats: 'GET /api/history/stats',
        delete: 'DELETE /api/history/:id',
        clearAll: 'DELETE /api/history',
      },
      notifications: {
        list: 'GET /api/notifications',
        markRead: 'PUT /api/notifications/:id/read',
        markAllRead: 'PUT /api/notifications/read-all',
      },
      health: 'GET /api/health',
    },
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

// ─── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌾 Crop Genius Backend running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   API docs:     http://localhost:${PORT}\n`);
});
