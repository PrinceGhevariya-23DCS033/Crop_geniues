/**
 * Crop Genius — API Service
 * 
 * Central module for all backend API calls.
 * Points to the Express backend which proxies to HuggingFace ML APIs.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// ─── Auth Token Helper ──────────────────────────────────────────────────────
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Generic Fetch Helper ───────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const message = data.error || data.detail || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CROP RECOMMENDATION API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get AI crop recommendation based on soil & location data.
 * The HuggingFace API auto-fetches temperature, humidity, rainfall from the location.
 *
 * @param {{ place: string, N: number, P: number, K: number, ph: number }} params
 * @returns {Promise<{ location, temperature, humidity, rainfall, recommended_crop, confidence }>}
 */
export async function predictCrop({ place, N, P, K, ph }) {
  return apiFetch('/crop-recommendation/predict', {
    method: 'POST',
    body: JSON.stringify({ place, N, P, K, ph }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. LEAF DISEASE DETECTION API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect plant disease from a leaf image.
 *
 * @param {File} imageFile - Image file (JPG/PNG)
 * @returns {Promise<{ name, plant, fullClass, confidence, severity, badge, description, pesticide, cure, prevention }>}
 */
export async function detectDisease(imageFile) {
  const formData = new FormData();
  formData.append('file', imageFile);

  return apiFetch('/leaf-disease/predict', {
    method: 'POST',
    body: formData,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. CROP PRICE PREDICTION API  
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get list of available crops for price prediction.
 * @returns {Promise<string[]>}
 */
export async function getPriceCrops() {
  return apiFetch('/price-prediction/crops');
}

/**
 * Get list of available districts for price prediction.
 * @returns {Promise<string[]>}
 */
export async function getPriceDistricts() {
  return apiFetch('/price-prediction/districts');
}

/**
 * Predict harvest-window crop price.
 *
 * @param {{ commodity: string, district: string }} params
 * @returns {Promise<{
 *   commodity, district, current_month, current_price,
 *   growth_horizon_months, harvest_window_start,
 *   predicted_harvest_price, expected_return_percent,
 *   absolute_change, model_type, prediction_timestamp
 * }>}
 */
export async function predictPrice({ commodity, district }) {
  return apiFetch('/price-prediction/predict', {
    method: 'POST',
    body: JSON.stringify({ commodity, district }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check backend + all HuggingFace service health.
 * @returns {Promise<{ status, server, timestamp, services }>}
 */
export async function checkHealth() {
  return apiFetch('/health');
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. HISTORY API (MongoDB-backed)
// ═══════════════════════════════════════════════════════════════════════════

/** Get user's prediction history */
export async function getHistory({ module, search, limit } = {}) {
  const params = new URLSearchParams();
  if (module && module !== 'All') params.append('module', module);
  if (search) params.append('search', search);
  if (limit) params.append('limit', limit);
  const qs = params.toString();
  return apiFetch(`/history${qs ? '?' + qs : ''}`);
}

/** Add a history entry */
export async function addHistoryEntry(entry) {
  return apiFetch('/history', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

/** Delete a single history entry */
export async function deleteHistoryEntry(id) {
  return apiFetch(`/history/${id}`, { method: 'DELETE' });
}

/** Clear all history */
export async function clearHistory() {
  return apiFetch('/history', { method: 'DELETE' });
}

/** Get dashboard stats from history */
export async function getHistoryStats() {
  return apiFetch('/history/stats');
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. NOTIFICATIONS API (MongoDB-backed)
// ═══════════════════════════════════════════════════════════════════════════

/** Get user's notifications */
export async function getNotifications() {
  return apiFetch('/notifications');
}

/** Mark a notification as read */
export async function markNotificationRead(id) {
  return apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
}

/** Mark all notifications as read */
export async function markAllNotificationsRead() {
  return apiFetch('/notifications/read-all', { method: 'PUT' });
}

/** Delete a notification */
export async function deleteNotification(id) {
  return apiFetch(`/notifications/${id}`, { method: 'DELETE' });
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. AGRICULTURE NEWS API (Flask proxy)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch agriculture news articles from Google RSS feeds.
 * Returns array of { source, category, title, link, published, published_iso, summary }
 */
export async function getAgriNews() {
  return apiFetch('/agri-news');
}
