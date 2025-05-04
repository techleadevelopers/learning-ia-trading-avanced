import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.linear_model import LinearRegression
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def predict_price(data, prediction_periods=24):
    """
    Simple price prediction model using linear regression
    
    Args:
        data (list): List of OHLCV data from Binance
        prediction_periods (int): Number of periods to predict
        
    Returns:
        dict: Dictionary with predictions and confidence levels
    """
    try:
        # Convert data to DataFrame and prepare features
        df = pd.DataFrame(data)
        
        # Extract only the close prices
        close_prices = df['close'].astype(float).values.reshape(-1, 1)
        
        # Scale the data
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_prices = scaler.fit_transform(close_prices)
        
        # Prepare the data for training
        X = []
        y = []
        
        # Use the last 30 data points to predict the next point
        lookback = 30
        
        for i in range(lookback, len(scaled_prices)):
            X.append(scaled_prices[i-lookback:i, 0])
            y.append(scaled_prices[i, 0])
            
        X = np.array(X)
        y = np.array(y)
        
        # Create and train the linear regression model
        model = LinearRegression()
        model.fit(X, y)
        
        # Make predictions
        last_sequence = scaled_prices[-lookback:]
        
        predictions = []
        confidence_levels = []
        
        # Generate predictions for the requested number of periods
        current_sequence = last_sequence.reshape(1, -1)[0]
        
        for _ in range(prediction_periods):
            # Predict the next price
            next_pred = model.predict(current_sequence.reshape(1, -1))[0]
            
            # Add the prediction to our list
            predictions.append(next_pred)
            
            # Simple confidence calculation - decreases with each future prediction
            # as uncertainty increases
            confidence = max(0.95 - (0.015 * len(predictions)), 0.5)
            confidence_levels.append(confidence)
            
            # Update the sequence with the new prediction
            current_sequence = np.append(current_sequence[1:], next_pred)
        
        # Convert predictions back to original scale
        scaled_predictions = np.array(predictions).reshape(-1, 1)
        predictions_original_scale = scaler.inverse_transform(
            np.concatenate((np.zeros((scaled_predictions.shape[0], 0)), scaled_predictions), axis=1)
        )[:, 0]
        
        # Create time points for the predictions (hours from the last data point)
        last_timestamp = int(df['timestamp'].iloc[-1])
        future_timestamps = [last_timestamp + (i+1) * 3600 * 1000 for i in range(prediction_periods)]
        
        # Create the results
        result = {
            'timestamps': future_timestamps,
            'predictions': predictions_original_scale.tolist(),
            'confidence': confidence_levels,
            'last_price': float(df['close'].iloc[-1])
        }
        
        return result
    
    except Exception as e:
        logger.error(f"Error in predict_price: {str(e)}")
        raise Exception(f"Prediction error: {str(e)}")
    
