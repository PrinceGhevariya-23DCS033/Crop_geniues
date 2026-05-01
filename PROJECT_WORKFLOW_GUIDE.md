# Crop Geniues - Project Workflow Guide

This document explains how the full project works, which file does what, and how frontend, backend, models, datasets, and deployment folders connect.

## 1) High-level architecture

Crop Geniues is organized as a unified workspace with these main parts:

- `frontend/`: React + Vite UI (user-facing web app)
- `backend/`: Express API gateway + auth/history/notifications + proxies to ML services
- `model/`: model artifacts grouped by module
- `datasets/`: training/reference data grouped by module
- `notebooks/`: model-wise notebook folders
- `deployment/`: GitHub workflows and Hugging Face deployment assets

### Runtime flow (request path)

1. User interacts with frontend page.
2. Frontend calls API helper in `frontend/src/utils/api.js`.
3. Vite proxy forwards `/api/*` to Express backend (`http://localhost:5000`).
4. Express route validates input, normalizes fields, and either:
   - uses MongoDB (auth/history/notifications), or
   - proxies to ML service endpoints (crop recommendation, leaf disease, crop price).
5. Backend returns normalized JSON response to frontend.
6. Frontend updates page state and shows result.

## 2) Folder-by-folder responsibility map

## `frontend/`

### Core bootstrapping files

- `frontend/src/main.jsx`: React mount point
- `frontend/src/App.jsx`: route map and global providers
- `frontend/vite.config.js`: alias setup and backend proxy (`/api` -> `http://localhost:5000`)
- `frontend/package.json`: scripts and dependencies

### Context/state files

- `frontend/src/context/AuthContext.jsx`
  - Session restore from token
  - Register/login/logout
  - Profile/password update calls
- `frontend/src/context/AppContext.jsx`
  - Loads history and notifications for authenticated users
  - Adds history entries, notification read state management
- `frontend/src/context/ThemeContext.jsx`
  - Theme handling for UI

### API layer

- `frontend/src/utils/api.js`
  - Centralized fetch wrapper
  - Adds auth token headers
  - Exposes all backend calls:
    - crop recommendation
    - leaf disease detection
    - price prediction
    - history
    - notifications
    - agri news
    - health

### Pages and user flow

- `frontend/src/pages/AuthPage.jsx`: login/register forms
- `frontend/src/pages/Dashboard.jsx`: dashboard overview
- `frontend/src/pages/CropRecommendation.jsx`: NPK + pH + place input and result
- `frontend/src/pages/LeafDisease.jsx`: image upload + disease details
- `frontend/src/pages/PricePrediction.jsx`: crop/district + harvest window prediction
- `frontend/src/pages/History.jsx`: user prediction history
- `frontend/src/pages/AgriNews.jsx`: agriculture news feed
- `frontend/src/pages/WeatherForecast.jsx`: weather page
- `frontend/src/pages/Settings.jsx`: profile/preferences

## `backend/`

### Server and config

- `backend/server.js`
  - Express app initialization
  - CORS and JSON middleware
  - MongoDB connection startup
  - Route mounting
  - Health endpoint and root endpoint
- `backend/config/db.js`
  - Mongoose connection using `MONGODB_URI`

### Middleware

- `backend/middleware/auth.js`
  - JWT verification (`protect`)
  - Optional token parsing (`optionalAuth`)
  - Token generation helper (`generateToken`)

### Mongo models

- `backend/models/User.js`
  - Account schema, password hashing, language/preferences fields
- `backend/models/History.js`
  - Prediction history per user
- `backend/models/Notification.js`
  - Notification records per user

### Route modules

- `backend/routes/auth.js`
  - Register/login/me/profile/password endpoints
  - Token-based session flow
- `backend/routes/cropRecommendation.js`
  - Proxies to `CROP_RECOMMENDATION_API`
  - Validates `place, N, P, K, ph`
  - Normalizes geocode place string
- `backend/routes/leafDisease.js`
  - Upload endpoint using `multer`
  - Proxies image to `PLANT_DISEASE_API`
  - Enriches response with disease severity/cure/prevention metadata
- `backend/routes/pricePrediction.js`
  - Proxies to `CROP_PRICE_API`
  - Supports crops list, districts list, and prediction
  - Includes normalization and fallback lists
- `backend/routes/history.js`
  - Auth-protected history CRUD + stats
- `backend/routes/notifications.js`
  - Auth-protected notifications list/read/deletei dont to tell to give th estrcuture i want the givepresentation of the project and pogress foucs on model which feture to pridct what is priidct and what model solve and it si pogress
- `backend/routes/agriNews.js`
  - RSS aggregation with fallback articles

### Included service code (module-local copies)

These folders are module services packaged inside the unified project:

- `backend/crop_recommendation/`
  - FastAPI app (`app.py`) for crop recommendation model logic
- `backend/all_plant/`
  - FastAPI app (`main.py`) for plant disease classification
- `backend/crop_price_v2/`
  - Gradio app (`app.py`) for crop price prediction and cache-based inference
  - update scripts and `src/` pipeline utilities

Note: In current full-stack runtime, Express acts as the main backend entrypoint. The ML services are consumed through configured API endpoints and deployment targets.

## `model/`

Model artifacts are grouped by feature domain:

- `model/crop_recommendation/`
- `model/all_plant/`
- `model/crop_price_v2/`
- `model/legacy_models/`

Use this folder to keep reusable trained model artifacts centralized and separated by module.

## `datasets/`

Dataset assets are grouped for maintainability:

- `datasets/raw_csv/`: raw/top-level csv files
- `datasets/crops/`: commodity-wise crop data files
- `datasets/final_merged_data/`: merged/processed outputs
- `datasets/crop_price_v2/`: price module specific data assets

## `notebooks/`

Model-wise notebook organization:

- `notebooks/crop_recommendation/`
- `notebooks/all_plant/`
- `notebooks/crop_price_v2/`
- `notebooks/legacy_models/`

This keeps experimentation and analysis separated from production code.

## `deployment/`

Deployment-related assets are organized by platform:

- `deployment/github/`
  - workflow assets and CI files (including monthly cache update workflows)
- `deployment/huggingface/`
  - module-wise deployment folders:
    - `all_plant/`
    - `crop_price_v2/`
    - `crop_recommendation/`
    - `legacy_models/`

## 3) API contracts used by frontend

Frontend calls these backend endpoints through `frontend/src/utils/api.js`:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `PUT /api/auth/password`

- `POST /api/crop-recommendation/predict`
- `POST /api/leaf-disease/predict`
- `GET /api/price-prediction/crops`
- `GET /api/price-prediction/districts`
- `POST /api/price-prediction/predict`

- `GET /api/history`
- `POST /api/history`
- `DELETE /api/history/:id`
- `DELETE /api/history`
- `GET /api/history/stats`

- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/:id`

- `GET /api/agri-news`
- `GET /api/health`

## 4) Required environment variables

Backend (`backend/.env`) should define:

- `PORT` (default 5000)
- `MONGODB_URI`
- `JWT_SECRET`
- `PLANT_DISEASE_API`
- `CROP_RECOMMENDATION_API`
- `CROP_PRICE_API`

Frontend optional variable:

- `VITE_API_BASE` (defaults to `http://localhost:5000/api` in dev and `/api` in production)

## 5) Local run instructions

## Start backend

From `backend/`:

- `npm install`
- `npm run dev`

or production mode:

- `npm start`

## Start frontend

From `frontend/`:

- `npm install`
- `npm run dev`

Build frontend:

- `npm run build`
- `npm run preview`

## Health checks

- Backend health: `GET http://localhost:5000/api/health`
- Frontend dev server: usually `http://localhost:5173`

## 6) Auth and data persistence flow

1. User registers/logs in from `AuthPage`.
2. Backend returns JWT token + user profile.
3. Token is stored in browser local storage.
4. `AuthContext` sends `Authorization: Bearer <token>` for protected calls.
5. Protected routes (`history`, `notifications`, profile updates) use `protect` middleware.
6. MongoDB stores users, history entries, and notifications.

## 7) Recent stability notes

- Frontend auth input focus issue was fixed by stabilizing input component identity in `frontend/src/pages/AuthPage.jsx`.
- Frontend dependency setup was corrected so Vite is available and `npm run dev` works.
- Deployment workflow files were adjusted to fit the unified `Crop_geniues` structure.

## 8) How to extend safely

When adding a new module (example: weather ML):

1. Add module service code under `backend/<module_name>/`.
2. Add Express proxy route under `backend/routes/<module>.js`.
3. Mount route in `backend/server.js`.
4. Add API wrapper in `frontend/src/utils/api.js`.
5. Add page/component and route in `frontend/src/App.jsx`.
6. Add model artifacts under `model/<module_name>/`.
7. Add datasets under `datasets/<module_name>/`.
8. Add notebook folder under `notebooks/<module_name>/`.
9. Add deployment assets under `deployment/huggingface/<module_name>/` and workflow updates if needed.

This keeps the project consistent, self-contained, and easy to maintain.
