import pandas as pd
import numpy as np
import json
import logging
from datetime import datetime, timedelta
from utils.technical_indicators import get_technical_indicators
from utils.binance_api import get_bitcoin_data

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def run_backtest(strategy, start_date_str, end_date_str, initial_capital=10000):
    """
    Run a backtest for a trading strategy
    
    Args:
        strategy: The TradingStrategy model instance
        start_date_str (str): Start date in format 'YYYY-MM-DD'
        end_date_str (str): End date in format 'YYYY-MM-DD'
        initial_capital (float): Initial capital in USD
        
    Returns:
        dict: Dictionary containing backtest results
    """
    try:
        # Parse dates
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
        
        # Calculate the duration in days
        days_diff = (end_date - start_date).days
        
        # Ensure we have enough historical data
        # Get data in 1-day intervals
        data = get_bitcoin_data('1d', min(1000, days_diff + 30))
        
        # Convert to DataFrame for easier manipulation
        df = pd.DataFrame(data)
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df.set_index('timestamp', inplace=True)
        
        # Filter data for the backtest period
        mask = (df.index >= start_date) & (df.index <= end_date)
        backtest_data = df.loc[mask].copy()
        
        if backtest_data.empty:
            raise ValueError("No data available for the specified date range")
        
        # Calculate technical indicators
        indicators = get_technical_indicators(backtest_data.reset_index().to_dict('records'))
        
        # Add indicators to the DataFrame
        for indicator_name, indicator_values in indicators.items():
            backtest_data[indicator_name] = indicator_values[-len(backtest_data):]
        
        # Parse strategy parameters
        try:
            params = json.loads(strategy.parameters)
        except:
            params = {}
            
        # Run the strategy
        trades, equity_curve = apply_strategy(backtest_data, params, initial_capital)
        
        # Calculate performance metrics
        metrics = calculate_performance_metrics(trades, equity_curve, initial_capital)
        
        return {
            'trades': [t.to_dict() for t in trades],
            'equity_curve': equity_curve.to_dict(),
            'metrics': metrics,
            'profit_loss': metrics['total_return_pct'],
            'win_rate': metrics['win_rate'],
            'total_trades': metrics['total_trades']
        }
        
    except Exception as e:
        logger.error(f"Error in run_backtest: {str(e)}")
        raise

def apply_strategy(data, params, initial_capital):
    """
    Apply a trading strategy to historical data
    
    Args:
        data (DataFrame): Historical price data with indicators
        params (dict): Strategy parameters
        initial_capital (float): Initial capital
        
    Returns:
        tuple: (trades, equity_curve)
    """
    # Initialize variables
    in_position = False
    entry_price = 0
    trades = []
    equity = initial_capital
    equity_curve = pd.Series(index=data.index)
    
    # Default strategy parameters
    strategy_type = params.get('strategy_type', 'ma_crossover')
    risk_per_trade = params.get('risk_per_trade', 0.02)  # 2% risk per trade
    
    # Create a Trade class to store trade information
    class Trade:
        def __init__(self, entry_date, entry_price, position_size, direction):
            self.entry_date = entry_date
            self.entry_price = entry_price
            self.position_size = position_size
            self.direction = direction  # 'long' or 'short'
            self.exit_date = None
            self.exit_price = None
            self.profit_loss = None
            self.profit_loss_pct = None
            
        def close(self, exit_date, exit_price):
            self.exit_date = exit_date
            self.exit_price = exit_price
            
            if self.direction == 'long':
                self.profit_loss = (exit_price - self.entry_price) * self.position_size
                self.profit_loss_pct = (exit_price / self.entry_price - 1) * 100
            else:  # short
                self.profit_loss = (self.entry_price - exit_price) * self.position_size
                self.profit_loss_pct = (self.entry_price / exit_price - 1) * 100
                
        def to_dict(self):
            return {
                'entry_date': self.entry_date,
                'entry_price': self.entry_price,
                'position_size': self.position_size,
                'direction': self.direction,
                'exit_date': self.exit_date,
                'exit_price': self.exit_price,
                'profit_loss': self.profit_loss,
                'profit_loss_pct': self.profit_loss_pct
            }
    
    # Apply the strategy based on strategy_type
    for date, row in data.iterrows():
        # Calculate equity for equity curve
        equity_curve[date] = equity
        
        # Apply the strategy based on strategy_type
        if strategy_type == 'ma_crossover':
            # Moving Average Crossover Strategy
            fast_ma = 'sma_20'
            slow_ma = 'sma_50'
            
            # Skip dates where we don't have both MAs
            if row[fast_ma] == 0 or row[slow_ma] == 0:
                continue
                
            # Check for buy signal: fast MA crosses above slow MA
            if not in_position and row[fast_ma] > row[slow_ma]:
                # Calculate position size based on risk
                price = float(row['close'])
                position_size = (equity * risk_per_trade) / price
                
                # Enter long position
                entry_price = price
                trade = Trade(date, entry_price, position_size, 'long')
                in_position = True
                
            # Check for sell signal: fast MA crosses below slow MA
            elif in_position and row[fast_ma] < row[slow_ma]:
                # Exit position
                exit_price = float(row['close'])
                trade.close(date, exit_price)
                trades.append(trade)
                
                # Update equity
                equity += trade.profit_loss
                in_position = False
                
        elif strategy_type == 'rsi':
            # RSI Strategy
            rsi_overbought = params.get('rsi_overbought', 70)
            rsi_oversold = params.get('rsi_oversold', 30)
            
            # Skip dates where RSI is not available
            if 'rsi' not in row:
                continue
                
            # Buy signal: RSI crosses below oversold threshold
            if not in_position and row['rsi'] < rsi_oversold:
                # Calculate position size based on risk
                price = float(row['close'])
                position_size = (equity * risk_per_trade) / price
                
                # Enter long position
                entry_price = price
                trade = Trade(date, entry_price, position_size, 'long')
                in_position = True
                
            # Sell signal: RSI crosses above overbought threshold
            elif in_position and row['rsi'] > rsi_overbought:
                # Exit position
                exit_price = float(row['close'])
                trade.close(date, exit_price)
                trades.append(trade)
                
                # Update equity
                equity += trade.profit_loss
                in_position = False
                
        elif strategy_type == 'macd':
            # MACD Strategy
            
            # Skip dates where MACD is not available
            if 'macd' not in row or 'macd_signal' not in row:
                continue
                
            # Buy signal: MACD crosses above signal line
            if not in_position and row['macd'] > row['macd_signal'] and row['macd'] > 0:
                # Calculate position size based on risk
                price = float(row['close'])
                position_size = (equity * risk_per_trade) / price
                
                # Enter long position
                entry_price = price
                trade = Trade(date, entry_price, position_size, 'long')
                in_position = True
                
            # Sell signal: MACD crosses below signal line
            elif in_position and row['macd'] < row['macd_signal'] and row['macd'] < 0:
                # Exit position
                exit_price = float(row['close'])
                trade.close(date, exit_price)
                trades.append(trade)
                
                # Update equity
                equity += trade.profit_loss
                in_position = False
    
    # Close any open position at the end of the backtest period
    if in_position:
        last_date = data.index[-1]
        last_price = float(data.iloc[-1]['close'])
        trade.close(last_date, last_price)
        trades.append(trade)
        equity += trade.profit_loss
        
    # Update the last equity value
    if not data.empty:
        equity_curve[data.index[-1]] = equity
        
    return trades, equity_curve

def calculate_performance_metrics(trades, equity_curve, initial_capital):
    """
    Calculate performance metrics for a backtest
    
    Args:
        trades (list): List of Trade objects
        equity_curve (Series): Series of equity values
        initial_capital (float): Initial capital
        
    Returns:
        dict: Dictionary of performance metrics
    """
    if not trades:
        return {
            'total_return': 0,
            'total_return_pct': 0,
            'win_rate': 0,
            'total_trades': 0,
            'winning_trades': 0,
            'losing_trades': 0,
            'largest_win': 0,
            'largest_loss': 0,
            'average_win': 0,
            'average_loss': 0,
            'profit_factor': 0,
            'max_drawdown': 0,
            'max_drawdown_pct': 0
        }
    
    # Calculate basic metrics
    total_return = equity_curve.iloc[-1] - initial_capital
    total_return_pct = (total_return / initial_capital) * 100
    
    # Count winning and losing trades
    winning_trades = [t for t in trades if t.profit_loss > 0]
    losing_trades = [t for t in trades if t.profit_loss <= 0]
    
    win_rate = len(winning_trades) / len(trades) if trades else 0
    
    # Calculate profit metrics
    total_profit = sum(t.profit_loss for t in winning_trades)
    total_loss = sum(t.profit_loss for t in losing_trades)
    
    largest_win = max([t.profit_loss for t in winning_trades]) if winning_trades else 0
    largest_loss = min([t.profit_loss for t in losing_trades]) if losing_trades else 0
    
    average_win = total_profit / len(winning_trades) if winning_trades else 0
    average_loss = total_loss / len(losing_trades) if losing_trades else 0
    
    profit_factor = abs(total_profit / total_loss) if total_loss != 0 else 0
    
    # Calculate maximum drawdown
    running_max = equity_curve.cummax()
    drawdown = (equity_curve - running_max) / running_max * 100
    max_drawdown_pct = drawdown.min()
    max_drawdown = equity_curve.max() - equity_curve.min()
    
    return {
        'total_return': total_return,
        'total_return_pct': total_return_pct,
        'win_rate': win_rate * 100,  # as percentage
        'total_trades': len(trades),
        'winning_trades': len(winning_trades),
        'losing_trades': len(losing_trades),
        'largest_win': largest_win,
        'largest_loss': largest_loss,
        'average_win': average_win,
        'average_loss': average_loss,
        'profit_factor': profit_factor,
        'max_drawdown': max_drawdown,
        'max_drawdown_pct': max_drawdown_pct
    }
