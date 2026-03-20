# 🚀 Quick Start - Single Server Setup

The news feature is now integrated directly into the main Node.js server!
**No need to run a separate Flask server anymore.**

## Installation

```bash
# Navigate to backend folder
cd backend

# Install the new RSS parser dependency
npm install

# Start the server
npm start
```

That's it! The news API now runs on the same server as the rest of the backend.

## What Changed?

✅ News fetching is now done directly in Node.js using `rss-parser`
✅ No need to run `python news_api.py` separately
✅ Only one server to start: `npm start`
✅ Faster startup and simpler deployment

## Testing

Once the server is running, test the news endpoint:
```bash
# Get agricultural news
curl http://localhost:5000/api/agri-news
```

## Fallback Behavior

If RSS feeds are temporarily unavailable:
- The API returns fallback news data automatically
- No errors are thrown
- Users still see helpful content

## Old Flask Server

The `news_api.py` Flask server is no longer needed and can be:
- Kept as a backup/alternative
- Deleted if you prefer
- Ignored completely

The main backend is now fully self-contained! 🎉
