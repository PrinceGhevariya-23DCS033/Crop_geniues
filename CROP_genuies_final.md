# CROP GENIUES FINAL REPORT (SRS STYLE)

## Document Control
- Project Name: Crop Geniues
- Document Type: Software Requirements Specification and Final Project Report
- Version: 1.0 Final
- Date: 2026-04-26
- Prepared For: Final Academic Submission

---

## Contents
- ABSTRACT
- CHAPTER 1: INTRODUCTION
  - 1.1 BACKGROUND OF THE PROJECT
  - 1.2 PROBLEM DEFINITION
  - 1.3 MOTIVATION FOR THE PROJECT
  - 1.4 OBJECTIVES AND SCOPE OF THE PROJECT
- CHAPTER 2: LITERATURE REVIEW
  - 2.1 RESEARCH FOUNDATION AND EXISTING WORK
  - 2.2 ANALYSIS OF EXISTING COMMERCIAL PLATFORMS
  - 2.3 HOW THE PROPOSED SYSTEM DIFFERS
- CHAPTER 3: SYSTEM ANALYSIS
  - 3.1 FUNCTIONAL REQUIREMENTS
  - 3.2 NON-FUNCTIONAL REQUIREMENTS
- CHAPTER 4: TECHNOLOGY STACK
  - 4.1 FRONTEND TECHNOLOGIES
  - 4.2 BACKEND TECHNOLOGIES
  - 4.3 AI AND EXTERNAL SERVICES
- CHAPTER 5: SYSTEM DESIGN
  - 5.1 SYSTEM ARCHITECTURE OVERVIEW
  - 5.2 MODEL AND FEATURE ENGINEERING DESIGN
    - 5.2.1 Crop Recommendation Model Design
    - 5.2.2 Plant Disease Model Design
    - 5.2.3 Crop Price Forecasting Feature Engineering
    - 5.2.4 Crop Yield Prediction Feature Engineering
  - 5.3 DATABASE DESIGN
  - 5.4 API DESIGN (BACKEND ROUTES)
  - 5.5 UI/UX DESIGN: THE PRISTINE LIGHT SYSTEM
  - 5.6 MODULES OVERVIEW
- CHAPTER 6: TESTING
  - 6.1 TESTING STRATEGY
  - 6.2 UNIT TESTING: MODEL AND FEATURE ENGINEERING VALIDATION
  - 6.3 INTEGRATION TESTING
  - 6.4 UI AND RESPONSIVENESS TESTING
- CHAPTER 7: RESULTS
  - 7.1 LANDING PAGE AND AUTHENTICATION MODULE
  - 7.2 CORE DASHBOARD MODULE
  - 7.3 ANALYTICS AND MODEL MODULES
  - 7.4 YIELD PREDICTION AND PLANNING MODULE
  - 7.5 UTILITIES MODULE
  - 7.6 PERFORMANCE BENCHMARKS
- CHAPTER 8: CHALLENGES FACED
  - 8.1 CORS AND DATA ACCESS CHALLENGES
  - 8.2 MOBILE RESPONSIVE TABLE DESIGN
  - 8.3 MODEL RESPONSE VALIDATION AND FALLBACK HANDLING
  - 8.4 CROP NAME TO MARKET CODE MAPPING IN CSV INGESTION
  - 8.5 FEATURE ENGINEERING AND DATA ALIGNMENT CHALLENGES
- CHAPTER 9: CONCLUSION AND FUTURE SCOPE
  - 9.1 SUMMARY OF ACHIEVEMENTS
  - 9.2 LIMITATIONS OF CURRENT VERSION
  - 9.3 FUTURE ROADMAP
- REFERENCES
- APPENDICES

---

## ABSTRACT
Crop Geniues is a multi-module smart agriculture platform designed to support crop planning and decision-making before and during cultivation. The system combines AI-powered crop recommendation, plant disease detection from leaf images, and mandi price forecasting for harvest windows. In addition, it provides farmer-support utilities including authentication, prediction history, notifications, agri-news integration, and dashboard-based workflow.

The project addresses practical farm-level questions:
- Which crop is suitable for current soil and location conditions?
- Is a leaf healthy or diseased, and what treatment/prevention is recommended?
- What harvest-window market price may be expected for a crop in a district?

The final implementation follows a modular architecture with React frontend, Express backend gateway, MongoDB persistence, and external model services (FastAPI/Gradio). The system is production-oriented with route-level validation, timeout control, fallback handling, and health monitoring across services.

---

## CHAPTER 1: INTRODUCTION

### 1.1 BACKGROUND OF THE PROJECT
Agriculture decisions are often made under uncertainty: weather variability, disease outbreaks, market volatility, and limited access to integrated advisory tools. Existing solutions usually solve one problem in isolation. Crop Geniues was created as an integrated AI platform where multiple farm intelligence services are available in one user flow.

### 1.2 PROBLEM DEFINITION
Farmers and agri users face four major gaps:
1. Fragmented advisory tools across separate apps and portals.
2. Delayed or non-personalized recommendations.
3. Limited interpretation of AI output into actionable guidance.
4. Weak traceability of user decisions and predictions over time.

### 1.3 MOTIVATION FOR THE PROJECT
The project motivation is to improve confidence in pre-sowing and in-season decisions by combining soil-based recommendation, disease diagnostics, and market forecasting into a single system that is accessible and practical.

### 1.4 OBJECTIVES AND SCOPE OF THE PROJECT
Primary objectives:
1. Provide crop recommendation using NPK, pH, and location.
2. Detect plant disease from image upload and return actionable recommendations.
3. Forecast crop harvest-window prices by crop and district.
4. Track user prediction history and notification states.
5. Offer a scalable architecture for future modules.

Scope:
- Included: Web application, backend APIs, model integration, data persistence, monitoring endpoints.
- Excluded in current release: Native mobile app, multilingual voice assistant, full offline mode.

---

## CHAPTER 2: LITERATURE REVIEW

### 2.1 RESEARCH FOUNDATION AND EXISTING WORK
The system is grounded on three families of ML-supported agri research:
1. Soil and agro-climatic crop recommendation using supervised classification.
2. Leaf disease image classification using deep learning CNN models.
3. Time-series and feature-engineered price forecasting using historical mandi data plus climate proxies.

### 2.2 ANALYSIS OF EXISTING COMMERCIAL PLATFORMS
Existing platforms typically provide either weather data, market price listing, or advisory messaging. Most do not provide integrated model-backed recommendations with user-level history persistence in one workflow.

### 2.3 HOW THE PROPOSED SYSTEM DIFFERS
Crop Geniues differs by:
1. Unified multi-module design.
2. Backend gateway that normalizes model APIs.
3. Action-ready responses (disease severity, pesticide suggestions, prevention steps).
4. Health checks and fallback behavior for better reliability.

---

## CHAPTER 3: SYSTEM ANALYSIS

### 3.1 FUNCTIONAL REQUIREMENTS
FR-1 User registration/login with JWT authentication.
FR-2 Crop recommendation prediction using place, N, P, K, and pH.
FR-3 Leaf disease prediction from uploaded image.
FR-4 Crop price forecasting with crop and district inputs.
FR-5 Fetch supported crops and districts for price module.
FR-6 Save and view prediction history.
FR-7 Manage notifications (list/read/delete).
FR-8 Read agri-news feed through backend route.
FR-9 Run health checks for backend and dependent model services.

### 3.2 NON-FUNCTIONAL REQUIREMENTS
NFR-1 Availability: service-level health endpoint with dependency status.
NFR-2 Performance: API timeouts and graceful error handling.
NFR-3 Security: JWT-protected user routes.
NFR-4 Maintainability: module-wise project structure.
NFR-5 Scalability: backend proxy pattern allows adding new ML services.
NFR-6 Usability: dashboard-driven UI with focused workflows.

---

## CHAPTER 4: TECHNOLOGY STACK

### 4.1 FRONTEND TECHNOLOGIES
- React 18
- Vite
- Tailwind CSS
- Framer Motion
- React Router

### 4.2 BACKEND TECHNOLOGIES
- Node.js (Express)
- MongoDB (Mongoose)
- JWT and bcrypt for auth/security
- Multer for image upload handling
- RSS parser for agri-news integration

### 4.3 AI AND EXTERNAL SERVICES
1. Crop Recommendation Service (FastAPI)
- Inputs: place, N, P, K, pH
- Feature pipeline enriches the request with weather and geolocation data.
- Output: recommended crop, confidence, and validation message.

2. Plant Disease Service (FastAPI + TensorFlow)
- Input: leaf image
- Output: class, plant, disease, confidence
- Backend forwards the raw prediction to the UI and stores the result in history.

3. Crop Price Forecasting Service (Gradio/FastAPI-oriented pipeline)
- Input: commodity, district, current temporal context
- Data: lag features, rolling averages, rainfall, NDVI, and district-level cache data
- Output: predicted harvest-window price and expected return percent.
- Reported performance in module docs: Test R2 approx 0.81 and MAPE approx 19 to 20 percent.

4. Crop Yield Prediction Service (FastAPI)
- Inputs: area, soil_quality, rainfall, temperature, fertilizer, irrigation type, crop, season, state, crop year
- Output: predicted yield in t/ha, confidence, tips, chart data, model name, and timestamp.
- Feature engineering combines soil and climate indicators for model input preparation.

---

## CHAPTER 5: SYSTEM DESIGN

### 5.1 SYSTEM ARCHITECTURE OVERVIEW
Architecture layers:
1. Presentation Layer
- React pages for recommendation, disease, price, history, news, and settings.

2. API Gateway Layer
- Express server exposes unified routes under /api/*.
- Handles auth, validation, normalization, timeout control, and error translation.

3. Intelligence Layer
- External model services (crop recommendation, leaf disease, crop price, crop yield).

4. Persistence Layer
- MongoDB stores users, history entries, notifications.

5. Data and Ops Layer
- Datasets, model artifacts, notebooks, deployment scripts.

Request flow:
1. User submits input from UI.
2. Frontend utility calls backend API.
3. Backend validates and forwards to model service.
4. Response is normalized and returned.
5. History can be persisted for authenticated users.

### 5.2 MODEL AND FEATURE ENGINEERING DESIGN
This project uses a set of predictive modules, each with its own feature engineering and validation path.

#### 5.2.1 Crop Recommendation Model Design
The crop recommendation service predicts the most suitable crop from soil and location inputs.

Input vector:
$$x = [N, P, K, pH, temperature, humidity, rainfall]$$

The backend enriches the request with geocoded location and short-term weather context. The model output is ranked by predicted probability, then filtered with ecological rules:
- FAO-style climate and soil feasibility checks
- ICAR-style regional feasibility checks

The final response returns:
- recommended crop
- confidence score
- validation message
- local weather context

#### 5.2.2 Plant Disease Model Design
The plant disease service classifies an uploaded leaf image.

Pipeline:
1. Read the image file.
2. Resize and normalize pixel values.
3. Run TensorFlow inference.
4. Decode the class label into plant and disease names.

The output includes:
- class label
- plant name
- disease name
- confidence

#### 5.2.3 Crop Price Forecasting Feature Engineering
The crop price module uses a feature-engineered tabular forecasting pipeline.

Core features include:
- current price and lag features
- month and year
- rainfall summary features
- NDVI vegetation index
- days traded
- rolling price averages
- district identifier
- crop identifier

The target is the modal harvest-window price. The module is trained with time-series aware validation and reports R2 and MAPE in the module documentation.

#### 5.2.4 Crop Yield Prediction Feature Engineering
The crop yield module predicts yield in t/ha from agronomic and climate inputs.

Input fields include:
- area
- soil quality
- annual rainfall
- mean temperature
- fertilizer
- irrigation type
- crop
- season
- state
- crop year

The feature engineering pipeline adds derived variables such as:
- fertilizer per area
- pesticide per area
- rainfall gap
- temperature range
- rainfall to temperature ratio
- climate stress index
- soil fertility score
- soil climate score

The model output is a yield estimate used for harvest planning and comparison across crop options.

### 5.3 DATABASE DESIGN
Collections:
1. User
- identity fields, password hash, profile settings, preferences.

2. History
- user id, module name, input summary, result summary, confidence, timestamp.

3. Notification
- user id, message/status metadata, read flag, timestamps.

Relationships:
- One user to many history entries.
- One user to many notifications.

### 5.4 API DESIGN (BACKEND ROUTES)
Auth routes:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- PUT /api/auth/profile
- PUT /api/auth/password

Prediction routes:
- POST /api/crop-recommendation/predict
- POST /api/leaf-disease/predict
- POST /api/yield-prediction/predict
- GET /api/price-prediction/crops
- GET /api/price-prediction/districts
- POST /api/price-prediction/predict

Data routes:
- GET /api/history
- POST /api/history
- DELETE /api/history/:id
- DELETE /api/history
- GET /api/history/stats
- GET /api/notifications
- PUT /api/notifications/:id/read
- PUT /api/notifications/read-all
- DELETE /api/notifications/:id
- GET /api/agri-news
- GET /api/health

### 5.5 UI/UX DESIGN: THE PRISTINE LIGHT SYSTEM
Design principles used:
1. Clean card-based module separation.
2. Data-entry forms with immediate validation feedback.
3. Animation for clarity, not distraction.
4. Result cards that emphasize confidence and action points.
5. Mobile-first responsiveness for key pages.

### 5.6 MODULES OVERVIEW
M1. Authentication and Profile Module
M2. Crop Recommendation Module
M3. Leaf Disease Detection Module
M4. Crop Price Forecasting Module
M5. Yield Prediction Module
M6. History Module
M7. Notification Module
M8. Agri-News Module
M9. Health Monitoring Module

---

## CHAPTER 6: TESTING

### 6.1 TESTING STRATEGY
Testing layers:
1. Endpoint-level API verification.
2. Module integration checks through frontend flows.
3. Negative testing for invalid inputs and service timeout behavior.
4. Manual UI responsiveness checks.

### 6.2 UNIT TESTING: MODEL AND FEATURE ENGINEERING VALIDATION
Validation points for the model and feature-engineering design:
1. Crop recommendation returns a valid crop, confidence, and validation message for realistic inputs.
2. Disease prediction correctly maps model class output to plant and disease names.
3. Price prediction uses the expected cached features and returns stable results for known crop-district pairs.
4. Yield prediction consumes the engineered agronomic fields and returns a numeric yield estimate.

### 6.3 INTEGRATION TESTING
Integrated workflows validated:
1. Login then run crop recommendation and save history.
2. Upload leaf image and receive enriched disease details.
3. Yield prediction from frontend form to backend inference response.
4. Price prediction with crop and district normalization.
5. News route without external Python server dependency.
6. Health endpoint reporting downstream service states.

### 6.4 UI AND RESPONSIVENESS TESTING
Validation checks:
1. Core pages accessible on desktop and mobile widths.
2. Form controls readable and operable on smaller screens.
3. Charts/cards maintain usability under constrained width.
4. Navigation and protected route behavior stable.

---

## CHAPTER 7: RESULTS

### 7.1 LANDING PAGE AND AUTHENTICATION MODULE
- Landing page presents module entry points.
- Register/login flow is functional.
- JWT-secured session supports protected module access.

Figure mapping:
- Fig 7.1 Crop Geniues Landing Page
- Fig 7.2 Authentication Screen

### 7.2 CORE DASHBOARD MODULE
- Dashboard aggregates quick state and module shortcuts.
- Sidebar navigation supports mobile view adaptation.

Figure mapping:
- Fig 7.3 User Dashboard
- Fig 7.4 Sidebar Navigation Panel (Mobile View)

### 7.3 ANALYTICS AND MODEL MODULES
- Crop Recommendation works with weather-enriched inference and scientific filtering.
- Leaf Disease returns class, plant, disease, and confidence.
- Yield Prediction provides estimated yield in t/ha for harvest planning.
- Price Forecasting returns predicted harvest-window value and expected return.

Figure mapping:
- Fig 7.5 Crop Recommendation Search and Prediction
- Fig 7.6 Price Forecasting Workflow and Output
- Fig 7.7 History Page

### 7.4 YIELD PREDICTION AND PLANNING MODULE
- Yield prediction supports crop planning by estimating harvest potential from agronomic inputs.
- The result helps compare crop options before cultivation.
- Current release exposes the yield output through the frontend dashboard and history tracking.

Figure mapping:
- Fig 7.8 Yield Prediction Page
- Fig 7.9 Weather Forecast Page

### 7.5 UTILITIES MODULE
Utility outcomes:
1. Prediction history management through the History page.
2. Notification read-state workflows through the top navigation panel.
3. Agri-news feed integration through the Agri News page.
4. Settings, profile, password, language, and notification preference management.

Figure mapping:
- Fig 7.10 Settings Page
- Fig 7.11 Agri News Page
- Fig 7.12 Weather Forecast Page
- Fig 7.13 History Page
- Fig 7.14 Notification Panel
- Fig 7.15 Landing Page

### 7.6 PERFORMANCE BENCHMARKS
Observed module-level status:
1. Crop Price Model
- Reported model metrics from module docs: Test R2 approx 0.81, MAPE approx 19 to 20 percent.
- Uses monthly cache data and feature-engineered lag and rolling variables.

2. Crop Recommendation
- Stable prediction contract with weather enrichment and ecological validation.

3. Leaf Disease
- End-to-end inference and enriched response pipeline implemented.

4. Yield Prediction
- Frontend and backend integration completed with yield prediction output and history persistence.

Operational benchmarks:
- Timeout protection added on proxy routes.
- Fallback lists and messages present for data/service gaps.
- Health checks provide quick observability.

---

## CHAPTER 8: CHALLENGES FACED

### 8.1 CORS AND DATA ACCESS CHALLENGES
- Challenge: Cross-origin communication between frontend and backend.
- Resolution: Express CORS middleware plus centralized API base strategy.

### 8.2 MOBILE RESPONSIVE TABLE DESIGN
- Challenge: Dense result tables/cards in mobile layout.
- Resolution: Card grouping and responsive chart containers.

### 8.3 MODEL RESPONSE VALIDATION AND FALLBACK HANDLING
- Challenge: Keeping prediction outputs consistent across multiple model services and preventing unclear responses when a service fails.
- Resolution: Structured backend response contracts, input validation, timeout handling, and explicit fallback messages.

### 8.4 CROP NAME TO MARKET CODE MAPPING IN CSV INGESTION
- Challenge: Commodity and district naming inconsistencies across sources.
- Resolution: Normalization maps and fallback strategy in price module routes.

### 8.5 FEATURE ENGINEERING AND DATA ALIGNMENT CHALLENGES
- Challenge: Merging heterogeneous inputs from soil, climate, market, and image workflows.
- Resolution: Use clear feature engineering rules, input validation, and module-specific fallback handling.

---

## CHAPTER 9: CONCLUSION AND FUTURE SCOPE

### 9.1 SUMMARY OF ACHIEVEMENTS
1. Built a complete full-stack agri platform with multiple AI modules.
2. Implemented secure auth and persistent user-level records.
3. Integrated crop recommendation, leaf disease, crop price, and yield prediction services with production-minded API gateway behavior.
4. Documented the real feature-engineering and model inference flow used in the project.

### 9.2 LIMITATIONS OF CURRENT VERSION
1. Some modules depend on external service availability.
2. Model outputs are currently exposed as single predictions and confidence values, not full uncertainty intervals.

### 9.3 FUTURE ROADMAP
1. Add model monitoring and automated retraining pipeline.
2. Add multilingual support and optional voice input.
3. Expand district and crop coverage beyond current data profile.
4. Improve fallback coverage and alerting for external model services.

---

## REFERENCES
1. Open-Meteo API documentation.
2. Agmarknet and related mandi data references.
3. TensorFlow and FastAPI official documentation.
4. XGBoost and time-series forecasting references for agricultural price prediction.
5. TensorFlow image classification references for plant disease detection.
6. MongoDB and Express documentation.

---

## APPENDICES

### Appendix A: Environment Variables
- PORT
- MONGODB_URI
- JWT_SECRET
- PLANT_DISEASE_API
- CROP_RECOMMENDATION_API
- CROP_PRICE_API
- VITE_API_BASE (frontend optional)

### Appendix B: Primary API Routes
- Authentication, prediction, history, notifications, news, and health endpoints as listed in Chapter 5.4.

### Appendix C: Project Progress Snapshot
Completed:
1. Multi-module frontend and backend gateway.
2. Auth, history, notifications, agri-news, and health modules.
3. Crop recommendation, leaf disease, crop price, and yield prediction frontend-backend integration.
4. Crop price feature engineering and fallback behavior.
5. Prediction history persistence for user workflows.

In Progress:
1. Additional automated tests and CI expansion.
2. Model explainability and broader dataset coverage.

Planned:
1. Broader geographic coverage.
2. Deeper model explainability and uncertainty communication.
3. Enhanced decision support across crop planning, disease diagnostics, and price forecasting.
