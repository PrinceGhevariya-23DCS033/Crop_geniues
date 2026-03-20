"""
Agriculture News API — Flask server (port 8000)
Fetches Google News RSS for agriculture categories and returns structured JSON.

Install deps:
    pip install flask flask-cors feedparser beautifulsoup4

Run:
    python news_api.py
"""

import feedparser
import email.utils
from flask import Flask, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

RSS_FEEDS = [
    {
        "source": "Google Agriculture",
        "url": "https://news.google.com/rss/search?q=agriculture+India&hl=en-IN&gl=IN&ceid=IN:en",
        "category": "agriculture",
    },
    {
        "source": "Google Crops",
        "url": "https://news.google.com/rss/search?q=crop+farming+India&hl=en-IN&gl=IN&ceid=IN:en",
        "category": "crops",
    },
    {
        "source": "Google Mandi Price",
        "url": "https://news.google.com/rss/search?q=mandi+price+India&hl=en-IN&gl=IN&ceid=IN:en",
        "category": "price",
    },
    {
        "source": "Google Agri Policy",
        "url": "https://news.google.com/rss/search?q=agriculture+policy+scheme+India&hl=en-IN&gl=IN&ceid=IN:en",
        "category": "policy",
    },
    {
        "source": "Google Soil Health",
        "url": "https://news.google.com/rss/search?q=soil+health+card+India&hl=en-IN&gl=IN&ceid=IN:en",
        "category": "soil",
    },
    {
        "source": "Google Weather",
        "url": "https://news.google.com/rss/search?q=monsoon+rainfall+India+farmers&hl=en-IN&gl=IN&ceid=IN:en",
        "category": "weather",
    },
]


def clean_html(text):
    return BeautifulSoup(text, "html.parser").get_text(separator=" ").strip()


def parse_published(date_str):
    if not date_str:
        return ""
    try:
        dt = email.utils.parsedate_to_datetime(date_str)
        return dt.isoformat()
    except Exception:
        return date_str


@app.route("/")
def home():
    return jsonify({"message": "🌾 Agriculture News API Running", "endpoints": ["/agri-news"]})


@app.route("/agri-news")
def agri_news():
    articles = []
    seen = set()
    failed_sources = []

    for feed in RSS_FEEDS:
        try:
            parsed = feedparser.parse(feed["url"])
            
            # Check if feed was parsed successfully
            if not parsed.entries:
                failed_sources.append(feed["source"])
                print(f"⚠️  No entries found for {feed['source']}")
                continue
                
            for entry in parsed.entries:
                link = entry.get("link", "")
                if not link or link in seen:
                    continue
                seen.add(link)

                articles.append({
                    "source": feed["source"],
                    "category": feed["category"],
                    "title": entry.get("title", ""),
                    "link": link,
                    "published": entry.get("published", ""),
                    "published_iso": parse_published(entry.get("published", "")),
                    "summary": clean_html(entry.get("summary", ""))[:450],
                })
        except Exception as e:
            failed_sources.append(feed["source"])
            print(f"⚠️  Failed to fetch {feed['source']}: {e}")
            continue

    # Sort newest-first
    articles.sort(key=lambda x: x.get("published_iso") or "", reverse=True)
    
    if failed_sources:
        print(f"ℹ️  Failed sources: {', '.join(failed_sources)}")
    
    print(f"✅ Successfully fetched {len(articles)} articles from {len(RSS_FEEDS) - len(failed_sources)}/{len(RSS_FEEDS)} sources")

    return jsonify(articles)


if __name__ == "__main__":
    app.run(debug=True, port=8000)
