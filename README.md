# Crop Geniues

AI-powered smart farming platform that combines:
- Crop recommendation
- Leaf disease detection
- Crop price prediction
- Weather and agri-news support
- User auth, history, and notifications

This repository is a unified full-stack workspace with frontend, backend, model assets, datasets, notebooks, and deployment resources.

## Table of Contents
- Overview
- Features
- Tech Stack
- Repository Structure
- Architecture Flow
- Prerequisites
- Quick Start (Local Development)
- Environment Variables
- API Endpoints
- Data and Model Layout
- Deployment Notes
- Troubleshooting
- How to Extend

## Overview
Crop Geniues helps farmers and agri users make better decisions by combining multiple AI-enabled agriculture modules into one application.

The frontend communicates with a central Express backend. The backend handles authentication and user data, and also proxies requests to ML services for predictions.

## Features
- Authentication with JWT
- Crop recommendation from soil values and place
- Leaf disease detection from uploaded image
- Crop price prediction by commodity and district
- Prediction history tracking per user
- Notifications system
- Agriculture news feed
- Health endpoint for service checks

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Framer Motion
- React Router

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT auth
- Multer (image upload)

### ML Service Integrations
- Crop recommendation service
- Plant disease service
- Crop price service

## Repository Structure

```text
Crop_geniues/
  frontend/                 # React + Vite client
  backend/                  # Express API gateway + auth/history/notifications
    all_plant/              # Plant disease service code (module-local)
    crop_recommendation/    # Crop recommendation service code (module-local)
    crop_price_v2/          # Crop price service code (module-local)
  model/                    # Model artifacts grouped by module
  datasets/                 # Raw and processed datasets
  notebooks/                # Experiment notebooks by module
  deployment/               # GitHub and Hugging Face deployment assets
  PROJECT_WORKFLOW_GUIDE.md # Detailed internal project workflow
```

## Architecture Flow
1. User interacts with the frontend UI.
2. Frontend calls API helpers in frontend/src/utils/api.js.
3. Dev proxy forwards /api requests to backend (localhost:5000).
4. Backend routes validate input and either:
   - read/write MongoDB (auth, history, notifications), or
   - proxy to ML service endpoints.
5. Backend returns normalized JSON.
6. Frontend renders results.

## Prerequisites
- Node.js 18+
- npm 9+
- MongoDB instance (local or Atlas)

## Quick Start (Local Development)

### 1) Clone and move into project
```bash
git clone <your-repo-url>
cd Crop_geniues
```

### 2) Setup backend
```bash
cd backend
npm install
```

Create backend/.env (see Environment Variables section), then run:
```bash
npm run dev
```

Backend will run on:
- http://localhost:5000

### 3) Setup frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend will run on:
- http://localhost:5173

### 4) Production builds
Frontend:
```bash
cd frontend
npm run build
npm run preview
```

Backend:
```bash
cd backend
npm start
```

## Environment Variables

Create backend/.env:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

PLANT_DISEASE_API=https://your-plant-disease-service
CROP_RECOMMENDATION_API=https://your-crop-recommendation-service
CROP_PRICE_API=https://your-crop-price-service
```

Optional frontend variable (frontend/.env):

```env
VITE_API_BASE=/api
```

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- PUT /api/auth/profile
- PUT /api/auth/password

### ML Predictions
- POST /api/crop-recommendation/predict
- POST /api/leaf-disease/predict
- GET /api/price-prediction/crops
- GET /api/price-prediction/districts
- POST /api/price-prediction/predict

### User Data
- GET /api/history
- POST /api/history
- DELETE /api/history/:id
- DELETE /api/history
- GET /api/history/stats

- GET /api/notifications
- PUT /api/notifications/:id/read
- PUT /api/notifications/read-all
- DELETE /api/notifications/:id

### Utility
- GET /api/agri-news
- GET /api/health

## Data and Model Layout
- model/: trained model artifacts by module
- datasets/: raw, crop-specific, and processed data
- notebooks/: module-wise experiments and analysis

Keep large model files and datasets out of version control if not needed for runtime.

## Deployment Notes
- deployment/github/: CI and workflow assets
- deployment/huggingface/: deployment resources per module

Recommended deployment order:
1. Deploy ML services
2. Set backend environment variables to deployed ML URLs
3. Deploy backend
4. Deploy frontend with correct API base/proxy

## Troubleshooting

### Frontend cannot call backend
- Confirm backend is running on port 5000
- Confirm frontend Vite proxy is active
- Check frontend/.env and backend CORS settings

### 401 Unauthorized on protected endpoints
- Verify login flow stores JWT token
- Ensure Authorization header includes Bearer token
- Confirm JWT_SECRET is set and stable

### Leaf disease request fails
- Verify PLANT_DISEASE_API URL
- Ensure image is sent with field name file
- Check backend logs for proxy timeout or model cold start

### Mongo connection errors
- Validate MONGODB_URI
- Check IP/network whitelist for Atlas
- Ensure database user has proper permissions

## How to Extend
When adding a new module:
1. Add service logic under backend/<module_name>/
2. Add Express route under backend/routes/
3. Mount route in backend/server.js
4. Add frontend API helper in frontend/src/utils/api.js
5. Add page and route in frontend/src/
6. Add model assets under model/<module_name>/
7. Add data under datasets/<module_name>/
8. Add notebook folder under notebooks/<module_name>/
9. Add deployment assets under deployment/huggingface/<module_name>/

## Notes
- PROJECT_WORKFLOW_GUIDE.md remains the detailed internal workflow reference.
- This README is the primary getting-started and maintenance guide.
