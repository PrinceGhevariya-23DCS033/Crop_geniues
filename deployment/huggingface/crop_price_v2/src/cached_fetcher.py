"""
Cache-Aware Data Fetcher
Gujarat Crop Price Forecasting System

Fast data lookup using monthly cached data.
Falls back to real-time API if cache is not available.

This dramatically improves prediction speed by avoiding API calls.
"""

import os
from typing import Dict, Optional
from datetime import datetime

from monthly_cache import MonthlyDataCache
from data_fetchers import MandiPriceFetcher, WeatherFetcher, NDVIFetcher
from config import normalize_district_name


class CachedDataFetcher:
    """
    Data fetcher that uses monthly cache for fast lookups.
    Falls back to real-time APIs if cache is unavailable.
    """
    
    def __init__(self, cache_dir: str = "monthly_cache", use_api_fallback: bool = True):
        """
        Initialize cached data fetcher.
        
        Args:
            cache_dir: Directory containing cached data
            use_api_fallback: If True, fall back to API when cache missing
        """
        self.cache = MonthlyDataCache(cache_dir=cache_dir)
        self.use_api_fallback = use_api_fallback
        
        # Initialize API fetchers (only if fallback enabled)
        if use_api_fallback:
            try:
                self.price_fetcher = MandiPriceFetcher()
            except:
                self.price_fetcher = None
                print("⚠️  Price API not available (cache-only mode)")
            
            self.weather_fetcher = WeatherFetcher()
            self.ndvi_fetcher = NDVIFetcher()
        else:
            self.price_fetcher = None
            self.weather_fetcher = None
            self.ndvi_fetcher = None
    
    
    def get_current_price(
        self,
        commodity: str,
        district: str,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> Optional[Dict]:
        """
        Get current price from cache or API.
        
        Args:
            commodity: Crop name
            district: District name
            year: Year (optional, for cache validation)
            month: Month (optional, for cache validation)
            
        Returns:
            Dict with monthly_mean_price, days_traded, data_source, etc.
        """
        # Try cache first
        cached_price = self.cache.get_price(commodity, district)
        
        if cached_price:
            # Always use cached data — it's the most recent available.
            # If month doesn't match, just log an info note; don't reject it.
            if year and month:
                cached_ym = f"{cached_price.get('year', '?')}-{cached_price.get('month', 0):02d}"
                requested_ym = f"{year}-{month:02d}"
                if cached_ym != requested_ym:
                    print(f"ℹ️  Using cached price from {cached_ym} for request {requested_ym} (most recent available)")
            return cached_price
        
        # Cache miss — fallback to API if enabled
        if self.use_api_fallback and self.price_fetcher:
            print(f"⚠️  Price not in cache, fetching from API: {commodity} - {district}")
            
            try:
                price_data = self.price_fetcher.get_current_price_with_fallback(
                    commodity=commodity,
                    district=district,
                    reference_date=datetime.now()
                )
                
                if price_data:
                    return price_data
            except Exception as e:
                print(f"⚠️  API fallback failed: {e}")
        
        return None
    
    
    def get_rainfall(
        self,
        district: str,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> Optional[Dict]:
        """
        Get rainfall from cache or API.
        
        Args:
            district: District name
            year: Year (optional)
            month: Month (optional)
            
        Returns:
            Dict with monthly_rain_sum, monthly_rain_mean
        """
        # Try cache first
        cached_rain = self.cache.get_rainfall(district)
        
        if cached_rain:
            # Always use cached data — it's the most recent available.
            if year and month:
                cached_ym = f"{cached_rain.get('year', '?')}-{cached_rain.get('month', 0):02d}"
                requested_ym = f"{year}-{month:02d}"
                if cached_ym != requested_ym:
                    print(f"ℹ️  Using cached rainfall from {cached_ym} for request {requested_ym} (most recent available)")
            return cached_rain
        
        # Cache miss — fallback to API if enabled
        if self.use_api_fallback and self.weather_fetcher and year and month:
            print(f"⚠️  Rainfall not in cache, fetching from API: {district} {year}-{month:02d}")
            
            try:
                rain_data = self.weather_fetcher.get_monthly_rainfall(
                    district=district,
                    year=year,
                    month=month
                )
                
                if rain_data:
                    return rain_data
            except Exception as e:
                print(f"⚠️  API fallback failed: {e}")
        
        # Return default values if not available
        return {
            "district": district,
            "monthly_rain_sum": 0.0,
            "monthly_rain_mean": 0.0,
            "data_source": "default",
            "warning": "No rainfall data available"
        }
    
    
    def get_ndvi(
        self,
        district: str,
        commodity: Optional[str] = None,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> Optional[Dict]:
        """
        Get NDVI from cache or API.
        
        Args:
            district: District name
            commodity: Crop name (for API fallback)
            year: Year (optional)
            month: Month (optional)
            
        Returns:
            Dict with monthly_ndvi_mean
        """
        # Try cache first
        cached_ndvi = self.cache.get_ndvi(district)
        
        if cached_ndvi:
            # Always use cached data — it's the most recent available.
            if year and month:
                cached_ym = f"{cached_ndvi.get('year', '?')}-{cached_ndvi.get('month', 0):02d}"
                requested_ym = f"{year}-{month:02d}"
                if cached_ym != requested_ym:
                    print(f"ℹ️  Using cached NDVI from {cached_ym} for request {requested_ym} (most recent available)")
            return cached_ndvi
        
        # Cache miss — fallback to API if enabled
        if self.use_api_fallback and self.ndvi_fetcher and year and month and commodity:
            print(f"⚠️  NDVI not in cache, fetching from CSV: {district} {year}-{month:02d}")
            
            try:
                ndvi_data = self.ndvi_fetcher.get_ndvi_from_csv(
                    commodity=commodity,
                    district=district,
                    year=year,
                    month=month
                )
                
                if ndvi_data:
                    return ndvi_data
            except Exception as e:
                print(f"⚠️  CSV fallback failed: {e}")
        
        # Return default value if not available
        return {
            "district": district,
            "monthly_ndvi_mean": 0.5,  # Neutral NDVI value
            "data_source": "default",
            "warning": "No NDVI data available"
        }
    
    
    def get_all_data(
        self,
        commodity: str,
        district: str,
        year: int,
        month: int
    ) -> Dict:
        """
        Get all required data (price, rainfall, NDVI) for prediction.
        
        Args:
            commodity: Crop name
            district: District name
            year: Year
            month: Month
            
        Returns:
            Dict with all data fields
        """
        price_data = self.get_current_price(commodity, district, year, month)
        rainfall_data = self.get_rainfall(district, year, month)
        ndvi_data = self.get_ndvi(district, commodity, year, month)
        
        # Combine into single dict
        result = {
            "commodity": commodity,
            "district": district,
            "year": year,
            "month": month,
        }
        
        # Add price data
        if price_data:
            result["current_price"] = price_data.get("monthly_mean_price", 0)
            result["days_traded"] = price_data.get("days_traded", 20)
            result["price_source"] = price_data.get("data_source", "unknown")
            result["price_data_year"] = price_data.get("year")
            result["price_data_month"] = price_data.get("month")
        else:
            result["current_price"] = None
            result["days_traded"] = 20
            result["price_source"] = "not_available"
            result["price_data_year"] = None
            result["price_data_month"] = None
        
        # Add rainfall data
        if rainfall_data:
            result["monthly_rain_sum"] = rainfall_data.get("monthly_rain_sum", 0)
            result["monthly_rain_mean"] = rainfall_data.get("monthly_rain_mean", 0)
            result["rainfall_source"] = rainfall_data.get("data_source", "cache")
        else:
            result["monthly_rain_sum"] = 0
            result["monthly_rain_mean"] = 0
            result["rainfall_source"] = "default"
        
        # Add NDVI data
        if ndvi_data:
            result["monthly_ndvi_mean"] = ndvi_data.get("monthly_ndvi_mean", 0.5)
            result["ndvi_source"] = ndvi_data.get("data_source", "cache")
        else:
            result["monthly_ndvi_mean"] = 0.5
            result["ndvi_source"] = "default"
        
        return result
    
    
    def get_cache_status(self) -> Dict:
        """Get cache status and metadata."""
        stats = self.cache.get_cache_stats()
        metadata = self.cache.get_cache_metadata()
        
        return {
            "cache_available": stats['total_price_entries'] > 0,
            "cache_current": stats['is_current'],
            "last_updated": stats['last_updated'],
            "update_period": f"{stats['update_year']}-{stats['update_month']:02d}" if stats['update_year'] else None,
            "entries": {
                "prices": stats['total_price_entries'],
                "rainfall": stats['total_rainfall_entries'],
                "ndvi": stats['total_ndvi_entries']
            },
            "coverage": {
                "commodities": stats['commodities_count'],
                "districts": stats['districts_count']
            },
            "api_fallback_enabled": self.use_api_fallback
        }
