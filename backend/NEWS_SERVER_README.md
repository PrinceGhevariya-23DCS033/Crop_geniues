# Agriculture News API Server

## Overview
The news feature requires a Flask server running on port 8000 to fetch live agricultural news from Google News RSS feeds.

## Quick Start

### Option 1: Using the batch file (Windows)
```bash
# Simply double-click or run:
start_news_server.bat
```

### Option 2: Manual start
```bash
# Navigate to backend folder
cd backend

# Install dependencies (first time only)
pip install flask flask-cors feedparser beautifulsoup4

# Start the server
python news_api.py
```

The server will start on `http://localhost:8000`

## Fallback Behavior
If the Flask server is not running:
- The main backend (Node.js) will **NOT** throw an error
- Instead, it will return fallback news data with helpful messages
- Users will still see content in the Agri News section

## News Sources
The server fetches from 6 Google News RSS feeds:
1. General Agriculture News (India)
2. Crop Farming Updates
3. Mandi Price News
4. Agriculture Policy & Schemes
5. Soil Health Updates
6. Monsoon & Weather for Farmers

## Troubleshooting

### Port 8000 already in use
```bash
# Find and kill the process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Dependencies not installed
```bash
pip install flask flask-cors feedparser beautifulsoup4
```

### Python not found
- Make sure Python 3.7+ is installed
- Add Python to your PATH environment variable

## Integration
The main Node.js backend automatically proxies requests:
- Frontend → `GET /api/agri-news`
- Node.js backend → `http://localhost:8000/agri-news`
- Flask server → Fetches from Google News RSS

## Development
- Edit `news_api.py` to add more RSS feeds
- Modify `RSS_FEEDS` list to customize news sources
- The server uses CORS to allow cross-origin requests
