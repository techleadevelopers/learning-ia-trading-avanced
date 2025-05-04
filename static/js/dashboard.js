// Dashboard.js - Main dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard module loaded');

  // References to elements
  const currentPriceElement = document.getElementById('current-price');
  const btcChangeElement = document.getElementById('btc-change');
  const portfolioValueElement = document.getElementById('portfolio-value');
  const totalProfitElement = document.getElementById('total-profit');
  const tradeCountElement = document.getElementById('trade-count');
  const latestSignalsElement = document.getElementById('latest-signals');
  
  // Update dashboard with latest data
  function updateDashboard() {
    // Update price information
    fetchBitcoinPrice()
      .then(updatePriceInfo)
      .catch(error => {
        console.error('Error updating price info:', error);
        showError(currentPriceElement, 'Failed to load price data');
      });
    
    // Update portfolio information (if logged in)
    if (isLoggedIn()) {
      fetchPortfolioData()
        .then(updatePortfolioInfo)
        .catch(error => {
          console.error('Error updating portfolio:', error);
          showError(portfolioValueElement, 'Failed to load portfolio data');
        });
    }
    
    // Update latest signals
    fetchLatestSignals()
      .then(updateSignalsDisplay)
      .catch(error => {
        console.error('Error updating signals:', error);
        showError(latestSignalsElement, 'Failed to load trading signals');
      });
  }
  
  // Check if user is logged in
  function isLoggedIn() {
    // This would typically check for authentication status
    // For this demo, assume the user is logged in if on the dashboard page
    return window.location.pathname.includes('dashboard');
  }
  
  // Fetch current Bitcoin price
  function fetchBitcoinPrice() {
    return fetch('/api/bitcoin/price?interval=1h&limit=25')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch Bitcoin price');
        }
        return response.json();
      });
  }
  
  // Fetch portfolio data
  function fetchPortfolioData() {
    // This would typically fetch the user's portfolio from the backend
    // For this demo, return simulated data
    return Promise.resolve({
      portfolioValue: 12500.75,
      totalProfit: 2500.75,
      profitPercent: 25.01,
      tradeCount: 12
    });
  }
  
  // Fetch latest trading signals
  function fetchLatestSignals() {
    return fetch('/api/signals')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch signals');
        }
        return response.json();
      })
      .catch(error => {
        console.error('Error fetching signals:', error);
        // Return placeholder signals for demonstration
        return [
          {
            id: 1,
            signal_type: 'BUY',
            price: 42500.25,
            confidence: 0.85,
            reason: 'RSI oversold, MACD bullish crossover',
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            signal_type: 'SELL',
            price: 43100.50,
            confidence: 0.72,
            reason: 'RSI overbought, price above upper Bollinger Band',
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ];
      });
  }
  
  // Update price information on the dashboard
  function updatePriceInfo(data) {
    if (!data || data.length === 0) return;
    
    // Get the latest candle
    const latestCandle = data[data.length - 1];
    const previousCandle = data[data.length - 25]; // 24h ago
    
    // Calculate price and change
    const currentPrice = parseFloat(latestCandle.close);
    const previousPrice = parseFloat(previousCandle.close);
    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = (priceChange / previousPrice) * 100;
    
    // Update UI
    if (currentPriceElement) {
      currentPriceElement.textContent = `$${currentPrice.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }
    
    if (btcChangeElement) {
      const isPositive = priceChange >= 0;
      btcChangeElement.textContent = `${isPositive ? '+' : ''}${priceChangePercent.toFixed(2)}%`;
      btcChangeElement.className = isPositive ? 'positive-value' : 'negative-value';
      
      // Update icon
      const icon = btcChangeElement.previousElementSibling;
      if (icon) {
        icon.className = isPositive ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
        icon.style.color = isPositive ? 'var(--success)' : 'var(--danger)';
      }
    }
    
    // Animate price change for visual feedback
    if (currentPriceElement) {
      currentPriceElement.classList.add('animate-pulse');
      setTimeout(() => {
        currentPriceElement.classList.remove('animate-pulse');
      }, 1000);
    }
  }
  
  // Update portfolio information
  function updatePortfolioInfo(data) {
    if (!data) return;
    
    // Update portfolio value
    if (portfolioValueElement) {
      portfolioValueElement.textContent = `$${data.portfolioValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }
    
    // Update profit/loss
    if (totalProfitElement) {
      const isPositive = data.totalProfit >= 0;
      totalProfitElement.textContent = `${isPositive ? '+' : ''}$${Math.abs(data.totalProfit).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} (${isPositive ? '+' : ''}${data.profitPercent.toFixed(2)}%)`;
      totalProfitElement.className = isPositive ? 'positive-value' : 'negative-value';
    }
    
    // Update trade count
    if (tradeCountElement) {
      tradeCountElement.textContent = data.tradeCount;
    }
  }
  
  // Update signals display
  function updateSignalsDisplay(signals) {
    if (!latestSignalsElement || !signals) return;
    
    // Clear existing signals
    latestSignalsElement.innerHTML = '';
    
    if (signals.length === 0) {
      latestSignalsElement.innerHTML = '<div class="text-center p-3">No signals generated yet</div>';
      return;
    }
    
    // Add each signal
    signals.forEach(signal => {
      const signalElement = document.createElement('div');
      signalElement.className = `signal signal-${signal.signal_type.toLowerCase()}`;
      
      // Format date
      const signalDate = new Date(signal.created_at);
      const formattedDate = signalDate.toLocaleString();
      
      // Format confidence as percentage
      const confidencePercent = (signal.confidence * 100).toFixed(0);
      
      signalElement.innerHTML = `
        <div>
          <h5>${signal.signal_type} @ $${parseFloat(signal.price).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</h5>
          <p class="mb-1">${signal.reason}</p>
          <small class="text-muted">${formattedDate}</small>
        </div>
        <div class="text-center">
          <div class="confidence-meter">
            <span class="badge ${confidencePercent > 70 ? 'badge-success' : 'badge-warning'}">
              ${confidencePercent}% Confidence
            </span>
          </div>
          <button class="btn btn-sm btn-outline-primary mt-2">
            Trade Now
          </button>
        </div>
      `;
      
      latestSignalsElement.appendChild(signalElement);
    });
  }
  
  // Show error message
  function showError(element, message) {
    if (!element) return;
    
    element.innerHTML = `<span class="text-danger"><i class="fas fa-exclamation-circle"></i> ${message}</span>`;
  }
  
  // Setup refresh button
  function setupRefreshButton() {
    const refreshBtn = document.getElementById('refresh-dashboard');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        // Add spinning animation to button
        const icon = refreshBtn.querySelector('i');
        if (icon) {
          icon.classList.add('fa-spin');
        }
        
        // Update dashboard
        updateDashboard();
        
        // Stop spinning after a delay
        setTimeout(() => {
          if (icon) {
            icon.classList.remove('fa-spin');
          }
        }, 1000);
      });
    }
  }
  
  // Setup interval selectors for charts
  function setupChartIntervals() {
    const intervalButtons = document.querySelectorAll('.interval-selector button');
    if (!intervalButtons.length) return;
    
    intervalButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Update active state
        intervalButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Get selected interval
        const interval = button.dataset.interval;
        
        // Update charts if ChartModule is available
        if (window.ChartModule) {
          window.ChartModule.updateCharts(interval, 100);
        }
      });
    });
  }
  
  // Initialize dashboard
  function initDashboard() {
    updateDashboard();
    setupRefreshButton();
    setupChartIntervals();
    
    // Set up automatic refresh every 60 seconds
    setInterval(updateDashboard, 60000);
  }
  
  // Initialize if on dashboard page
  if (document.getElementById('dashboard-container')) {
    initDashboard();
  }
  
  // Expose public API
  window.DashboardModule = {
    refresh: updateDashboard
  };
});
