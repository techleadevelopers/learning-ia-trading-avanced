import numpy as np
import pandas as pd
import logging
from typing import Dict, List, Optional


class TechnicalIndicators:
    """
    A class for calculating technical indicators from financial data.
    """

    def __init__(self, data: List[Dict]):
        """
        Initializes the TechnicalIndicators object with OHLCV data.

        Args:
            data: List of dictionaries with OHLCV data from Binance.
        """
        self.df = self._preprocess_data(data)
        self.indicators = {}

    def _preprocess_data(self, data: List[Dict]) -> pd.DataFrame:
        """
        Converts raw data to a Pandas DataFrame and ensures correct data types.

        Args:
            data: List of dictionaries with OHLCV data.

        Returns:
            pd.DataFrame: DataFrame with preprocessed data.

        Raises:
            TypeError: If input data is not a list of dictionaries.
            ValueError: If the input data list is empty or any dictionary lacks essential OHLCV keys.
        """
        if not isinstance(data, list):
            raise TypeError("Input data must be a list of dictionaries.")
        if not data:
            raise ValueError("Input data list cannot be empty.")
        #check for the correct keys
        essential_keys = ['close', 'high', 'low', 'open', 'volume']
        for row in data:
            if not all(key in row for key in essential_keys):
                raise ValueError(f"Each dictionary in data must contain the following keys: {essential_keys}")

        df = pd.DataFrame(data)
        for col in ['close', 'high', 'low', 'open', 'volume']:
            df[col] = df[col].astype(float)
        return df

    def calculate_all(self) -> Dict[str, List]:
        """
        Calculates all available technical indicators.

        Returns:
            Dict[str, List]: A dictionary containing all calculated indicators.  Each key is the indicator name, and the value is a list of the indicator's values.  Returns an empty dict if no indicators are calculated.
        """
        self.indicators = {}  # Reset the dictionary
        self._calculate_simple_moving_averages()
        self._calculate_exponential_moving_averages()
        self._calculate_macd()
        self._calculate_rsi()
        self._calculate_bollinger_bands()
        self._calculate_atr()
        self._convert_to_lists()
        return self.indicators

    def _convert_to_lists(self):
        """
        Convert numpy arrays to lists for JSON serialization.
        """
        for key in self.indicators:
            if isinstance(self.indicators[key], np.ndarray):
                self.indicators[key] = self.indicators[key].tolist()

    def _calculate_simple_moving_averages(self):
        """Calculates Simple Moving Averages (SMA)."""
        self.indicators['sma_20'] = self._calculate_sma(self.df['close'], 20)
        self.indicators['sma_50'] = self._calculate_sma(self.df['close'], 50)
        self.indicators['sma_200'] = self._calculate_sma(self.df['close'], 200)

    def _calculate_exponential_moving_averages(self):
        """Calculates Exponential Moving Averages (EMA)."""
        self.indicators['ema_12'] = self._calculate_ema(self.df['close'], 12)
        self.indicators['ema_26'] = self._calculate_ema(self.df['close'], 26)

    def _calculate_macd(self):
        """Calculates Moving Average Convergence Divergence (MACD)."""
        macd_result = self._calculate_macd_values(self.df['close'])
        self.indicators['macd'] = macd_result['macd']
        self.indicators['macd_signal'] = macd_result['signal']
        self.indicators['macd_histogram'] = macd_result['histogram']

    def _calculate_rsi(self):
        """Calculates Relative Strength Index (RSI)."""
        self.indicators['rsi'] = self._calculate_rsi_values(self.df['close'])

    def _calculate_bollinger_bands(self):
        """Calculates Bollinger Bands."""
        bollinger_bands = self._calculate_bollinger_bands_values(self.df['close'])
        self.indicators['bollinger_upper'] = bollinger_bands['upper']
        self.indicators['bollinger_middle'] = bollinger_bands['middle']
        self.indicators['bollinger_lower'] = bollinger_bands['lower']

    def _calculate_atr(self):
        """Calculates Average True Range (ATR)."""
        self.indicators['atr'] = self._calculate_atr_values(self.df)

    @staticmethod
    def _calculate_sma(series: pd.Series, window: int) -> np.ndarray:
        """
        Calculate Simple Moving Average.

        Args:
            series:  pd.Series of values.
            window: int Number of periods for the moving average.

        Returns:
            np.ndarray: Simple Moving Average values.
        """
        return series.rolling(window=window).mean().fillna(0).values

    @staticmethod
    def _calculate_ema(series: pd.Series, window: int) -> np.ndarray:
        """
        Calculate Exponential Moving Average.

        Args:
            series:  pd.Series of values.
            window: int Number of periods for the moving average.

        Returns:
            np.ndarray: Exponential Moving Average values.
        """
        return series.ewm(span=window, adjust=False).mean().fillna(0).values

    @staticmethod
    def _calculate_macd_values(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, np.ndarray]:
        """
        Calculate MACD, Signal Line, and Histogram.

        Args:
            series:  pd.Series of values.
            fast: int Number of periods for the fast EMA.
            slow: int Number of periods for the slow EMA.
            signal: int Number of periods for the signal line EMA.

        Returns:
            Dict[str, np.ndarray]: A dictionary containing MACD, Signal Line, and Histogram values.
        """
        ema_fast = TechnicalIndicators._calculate_ema(series, fast)
        ema_slow = TechnicalIndicators._calculate_ema(series, slow)
        macd_line = ema_fast - ema_slow
        signal_line = pd.Series(macd_line).ewm(span=signal, adjust=False).mean().values
        histogram = macd_line - signal_line
        return {
            'macd': macd_line,
            'signal': signal_line,
            'histogram': histogram
        }

    @staticmethod
    def _calculate_rsi_values(series: pd.Series, window: int = 14) -> np.ndarray:
        """
        Calculate Relative Strength Index.

        Args:
            series:  pd.Series of values.
            window: int Number of periods for the RSI.

        Returns:
            np.ndarray: RSI values.
        """
        delta = series.diff().dropna()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        avg_gain = gain.rolling(window=window).mean().fillna(0)
        avg_loss = loss.rolling(window=window).mean().fillna(0)
        rs = avg_gain / avg_loss.replace(0, 0.000001)  # Avoid division by zero
        rsi = 100 - (100 / (1 + rs))
        return rsi.fillna(50).values

    @staticmethod
    def _calculate_bollinger_bands_values(series: pd.Series, window: int = 20, num_std: int = 2) -> Dict[str, np.ndarray]:
        """
        Calculate Bollinger Bands.

        Args:
            series:  pd.Series of values.
            window: int Number of periods for the bands.
            num_std: int Number of standard deviations for the upper and lower bands.

        Returns:
            Dict[str, np.ndarray]: A dictionary containing the upper, middle, and lower band values.
        """
        middle_band = series.rolling(window=window).mean().fillna(0).values
        std_dev = series.rolling(window=window).std().fillna(0).values
        upper_band = middle_band + (std_dev * num_std)
        lower_band = middle_band - (std_dev * num_std)
        return {
            'upper': upper_band,
            'middle': middle_band,
            'lower': lower_band
        }

    @staticmethod
    def _calculate_atr_values(df: pd.DataFrame, window: int = 14) -> np.ndarray:
        """
        Calculate Average True Range.

        Args:
            df:  pd.DataFrame with 'high', 'low', and 'close' columns.
            window: int Number of periods for the ATR.

        Returns:
            np.ndarray: ATR values.
        """
        high = df['high']
        low = df['low']
        close = df['close']
        tr1 = high - low
        tr2 = abs(high - close.shift())
        tr3 = abs(low - close.shift())
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(window=window).mean().fillna(0).values
        return atr
    
def get_technical_indicators(data: List[Dict]) -> Dict[str, List]:
    """
    Calculates technical indicators from price data using the TechnicalIndicators class.  This
    function acts as a wrapper around the class to maintain the original functional interface.

    Args:
        data: List of dictionaries with OHLCV data from Binance.

    Returns:
        dict: Dictionary containing calculated indicators.
    """
    try:
        indicator_calculator = TechnicalIndicators(data)
        return indicator_calculator.calculate_all()
    except Exception as e:
        logging.error(f"Error calculating technical indicators: {str(e)}")
        raise
