import express from 'express'
import Parser from 'rss-parser'

const router = express.Router()
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'CropGenius-NewsBot/1.0',
  },
})

// RSS Feed sources
const RSS_FEEDS = [
  {
    source: 'Google Agriculture',
    url: 'https://news.google.com/rss/search?q=agriculture+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'agriculture',
  },
  {
    source: 'Google Crops',
    url: 'https://news.google.com/rss/search?q=crop+farming+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'crops',
  },
  {
    source: 'Google Mandi Price',
    url: 'https://news.google.com/rss/search?q=mandi+price+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'price',
  },
  {
    source: 'Google Agri Policy',
    url: 'https://news.google.com/rss/search?q=agriculture+policy+scheme+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'policy',
  },
  {
    source: 'Google Soil Health',
    url: 'https://news.google.com/rss/search?q=soil+health+card+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'soil',
  },
  {
    source: 'Google Weather',
    url: 'https://news.google.com/rss/search?q=monsoon+rainfall+India+farmers&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'weather',
  },
]

// Fallback news data
const FALLBACK_NEWS = [
  {
    source: 'System',
    category: 'agriculture',
    title: 'Agriculture News - Real-time Updates',
    link: 'https://agricoop.gov.in',
    published: new Date().toISOString(),
    published_iso: new Date().toISOString(),
    summary: 'Visit the Department of Agriculture & Farmers Welfare for the latest updates on agriculture, crop production, and government schemes.',
  },
  {
    source: 'System',
    category: 'policy',
    title: 'PM-KISAN Direct Benefit Transfer Scheme',
    link: 'https://pmkisan.gov.in',
    published: new Date().toISOString(),
    published_iso: new Date().toISOString(),
    summary: 'Under PM-KISAN, income support of ₹6,000 per year is provided to all farmer families in India. Check eligibility and benefits on the official portal.',
  },
  {
    source: 'System',
    category: 'price',
    title: 'Agmarknet - Daily Mandi Prices',
    link: 'https://agmarknet.gov.in',
    published: new Date().toISOString(),
    published_iso: new Date().toISOString(),
    summary: 'Access real-time commodity prices from mandis across India. Track daily price movements for agricultural produce.',
  },
]

// Helper to clean HTML and strip tags
function cleanSummary(text) {
  if (!text) return ''
  // Remove HTML tags and decode entities
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
    .substring(0, 450)
}

/**
 * GET /api/agri-news
 * Fetches RSS feeds directly from Google News
 */
router.get('/', async (_req, res) => {
  const articles = []
  const seen = new Set()
  const failed_sources = []

  // Fetch all RSS feeds in parallel
  const feedPromises = RSS_FEEDS.map(async (feed) => {
    try {
      const feedData = await parser.parseURL(feed.url)
      
      if (!feedData.items || feedData.items.length === 0) {
        failed_sources.push(feed.source)
        console.warn(`⚠️  No entries found for ${feed.source}`)
        return []
      }

      const feedArticles = []
      for (const item of feedData.items) {
        const link = item.link || item.guid
        if (!link || seen.has(link)) continue
        
        seen.add(link)
        feedArticles.push({
          source: feed.source,
          category: feed.category,
          title: item.title || '',
          link: link,
          published: item.pubDate || item.isoDate || '',
          published_iso: item.isoDate || new Date(item.pubDate || Date.now()).toISOString(),
          summary: cleanSummary(item.contentSnippet || item.content || item.summary || ''),
        })
      }
      
      return feedArticles
    } catch (err) {
      failed_sources.push(feed.source)
      console.warn(`⚠️  Failed to fetch ${feed.source}:`, err.message)
      return []
    }
  })

  try {
    // Wait for all feeds to complete
    const results = await Promise.allSettled(feedPromises)
    
    // Flatten all successful results
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        articles.push(...result.value)
      }
    })

    // Sort by date (newest first)
    articles.sort((a, b) => {
      const dateA = new Date(a.published_iso || 0)
      const dateB = new Date(b.published_iso || 0)
      return dateB - dateA
    })

    if (articles.length === 0) {
      console.warn('⚠️  No articles fetched from any source, returning fallback news')
      return res.json(FALLBACK_NEWS)
    }

    if (failed_sources.length > 0) {
      console.log(`ℹ️  Failed sources: ${failed_sources.join(', ')}`)
    }

    console.log(`✅ Fetched ${articles.length} articles from ${RSS_FEEDS.length - failed_sources.length}/${RSS_FEEDS.length} sources`)
    res.json(articles)
    
  } catch (err) {
    console.error('❌ Error fetching news:', err.message)
    res.json(FALLBACK_NEWS)
  }
})

export { router as agriNewsRouter }
