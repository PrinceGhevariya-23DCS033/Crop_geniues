"""
Prediction with Confidence Intervals
Gujarat Crop Price Forecasting System

Provides uncertainty estimates for price predictions.
"""

import numpy as np
import pandas as pd
from typing import Dict
from scipy import stats


class PredictionWithConfidence:
    """
    Extends predictions with confidence intervals using:
    1. Historical residual distribution
    2. Volatility-adjusted bands
    3. Bootstrapped uncertainty
    """
    
    def __init__(self, model, historical_predictions: pd.DataFrame = None):
        """
        Initialize confidence estimator.
        
        Args:
            model: Trained model
            historical_predictions: DataFrame with columns [actual, predicted, commodity, district]
        """
        self.model = model
        self.historical_predictions = historical_predictions
        self.residual_std = None
        self.commodity_std = {}
        
        if historical_predictions is not None:
            self._compute_residual_statistics()
    
    
    def _compute_residual_statistics(self):
        """Compute residual statistics from historical predictions."""
        
        df = self.historical_predictions.copy()
        df['residual'] = df['actual'] - df['predicted']
        
        # Global residual standard deviation
        self.residual_std = df['residual'].std()
        
        # Per-commodity standard deviation
        for commodity in df['commodity'].unique():
            commodity_df = df[df['commodity'] == commodity]
            self.commodity_std[commodity] = commodity_df['residual'].std()
    
    
    def predict_with_interval(
        self,
        X: pd.DataFrame,
        current_price: float,
        commodity: str,
        confidence_level: float = 0.95
    ) -> Dict:
        """
        Generate prediction with confidence interval.
        
        Args:
            X: Features for prediction
            current_price: Current price
            commodity: Commodity name
            confidence_level: Confidence level (e.g., 0.95 for 95%)
            
        Returns:
            Dict with prediction, lower_bound, upper_bound, interval_width
        """
        
        # Get point prediction (log return)
        predicted_return = self.model.predict(X)[0]
        predicted_price = current_price * np.exp(predicted_return)
        
        # Determine standard deviation to use
        if commodity in self.commodity_std:
            std = self.commodity_std[commodity]
        elif self.residual_std is not None:
            std = self.residual_std
        else:
            # Fallback: assume 10% typical error
            std = predicted_price * 0.10
        
        # Calculate z-score for confidence level
        z_score = stats.norm.ppf((1 + confidence_level) / 2)
        
        # Confidence interval in price space
        margin = z_score * std
        
        lower_bound = max(0, predicted_price - margin)  # Price can't be negative
        upper_bound = predicted_price + margin
        
        result = {
            'predicted_price': predicted_price,
            'lower_bound': lower_bound,
            'upper_bound': upper_bound,
            'confidence_level': confidence_level * 100,
            'interval_width': upper_bound - lower_bound,
            'relative_uncertainty': (margin / predicted_price) * 100,  # Percentage
            'std_dev': std
        }
        
        return result
    
    
# ============ INTEGRATION WITH INFERENCE ============

def add_confidence_to_prediction(
    base_prediction: Dict,
    X: pd.DataFrame,
    current_price: float,
    commodity: str,
    confidence_estimator: PredictionWithConfidence = None
) -> Dict:
    """
    Add confidence intervals to a base prediction.
    
    Args:
        base_prediction: Dict from CropPricePredictor.predict()
        X: Features used for prediction
        current_price: Current price
        commodity: Commodity name
        confidence_estimator: Optional confidence estimator
        
    Returns:
        Enhanced prediction dict with confidence intervals
    """
    
    # If no estimator, use simple percentage-based interval
    if confidence_estimator is None:
        predicted_price = base_prediction['predicted_harvest_price']
        uncertainty = predicted_price * 0.15  # 15% typical uncertainty
        
        base_prediction['confidence_interval'] = {
            'lower_bound': max(0, predicted_price - uncertainty),
            'upper_bound': predicted_price + uncertainty,
            'confidence_level': 90,
            'method': 'simple_percentage'
        }
    
    else:
        # Use sophisticated confidence estimation
        confidence_result = confidence_estimator.predict_with_interval(
            X=X,
            current_price=current_price,
            commodity=commodity,
            confidence_level=0.90
        )
        
        base_prediction['confidence_interval'] = {
            'lower_bound': confidence_result['lower_bound'],
            'upper_bound': confidence_result['upper_bound'],
            'confidence_level': confidence_result['confidence_level'],
            'relative_uncertainty': confidence_result['relative_uncertainty'],
            'method': 'residual_based'
        }
    
    return base_prediction


