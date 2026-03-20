MONTHLY CACHE - READY FOR HUGGING FACE DEPLOYMENT
=================================================

Generated: 2026-02-24
Cache Period: February 2026

CONTENTS:
---------
✓ 777 Price cache files (prices/*.json)
✓ 33 Rainfall data files (rainfall/*.json)  
✓ 33 NDVI data files (ndvi/*.json)
Total: 843 JSON files

DATA COVERAGE:
--------------
Best Coverage Crops (most districts):
- Onion: 44 districts
- Green Chilli/Peas: 34 districts
- Groundnut: 27 districts
- Cotton: 27 districts
- Tomato: 27 districts
- Cabbage: 26 districts
- Wheat: 25 districts
- Maize: 25 districts

DEPLOYMENT INSTRUCTIONS:
------------------------
Upload this entire "monthly_cache" folder to your Hugging Face Space.

The folder structure should be:
your-hf-space/
├── app.py
├── Dockerfile
├── requirements.txt
├── src/
├── production_model/
├── processed/
└── monthly_cache/
    ├── prices/
    ├── rainfall/
    └── ndvi/

UPDATING THE CACHE:
-------------------
To update the cache monthly (recommended: 20-25th of each month):

1. Local update:
   python quick_cache_csv_only.py

2. Automated update (via GitHub Actions):
   - Push updated monthly_cache/ to your GitHub repo
   - GitHub Actions will sync to HF Space automatically

NOTES:
------
- Cache generated from historical CSV data (no API calls)
- Rainfall and NDVI use seasonal defaults
- Some crop-district combinations may not have data
- Cache is valid for current month predictions
- For best results, update monthly when new data is available

