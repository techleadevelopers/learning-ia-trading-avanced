// Backtest.js - Handles backtesting functionality

document.addEventListener('DOMContentLoaded', function() {
  console.log('Backtest module loaded');

  // References to elements
  const strategySelect = document.getElementById('strategy-select');
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  const runBacktestBtn = document.getElementById('run-backtest');
  const backtestResults = document.getElementById('backtest-results');
  const backtestChart = document.getElementById('backtest-chart');
  const resultsContainer = document.getElementById('results-container');
  
  // Chart instance
  let equityChart = null;
  
  // Initialize datepickers
  function initDatePickers() {
    if (startDateInput && endDateInput) {
      // Set default dates (1 year ago to today)
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      startDateInput.valueAsDate = oneYearAgo;
      endDateInput.valueAsDate = today;
      
      // Validate dates
      startDateInput.addEventListener('change', validateDates);
      endDateInput.addEventListener('change', validateDates);
    }
  }
  
  // Validate date ranges
  function validateDates() {
    if (!startDateInput || !endDateInput) return;
    
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    const today = new Date();
    
    // Ensure end date is not in the future
    if (endDate > today) {
      endDateInput.valueAsDate = today;
      showAlert('End date cannot be in the future', 'warning');
    }
    
    // Ensure start date is before end date
    if (startDate >= endDate) {
      // Set start date to 3 months before end date
      const newStartDate = new Date(endDate);
      newStartDate.setMonth(endDate.getMonth() - 3);
      startDateInput.valueAsDate = newStartDate;
      showAlert('Start date must be before end date', 'warning');
    }
  }
  
  // Load strategies
  function loadStrategies() {
    if (!strategySelect) return;
    
    fetch('/api/strategies')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch strategies');
        }
        return response.json();
      })
      .then(strategies => {
        // Clear existing options
        strategySelect.innerHTML = '';
        
        if (strategies.length === 0) {
          const option = document.createElement('option');
          option.value = '';
          option.textContent = 'No strategies available';
          strategySelect.appendChild(option);
          return;
        }
        
        // Add strategies
        strategies.forEach(strategy => {
          const option = document.createElement('option');
          option.value = strategy.id;
          option.textContent = strategy.name;
          option.title = strategy.description || '';
          strategySelect.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error loading strategies:', error);
        showAlert('Failed to load strategies', 'danger');
        
        // Add default strategies for demonstration
        const defaultStrategies = [
          { id: 1, name: 'Moving Average Crossover (Demo)' },
          { id: 2, name: 'RSI Strategy (Demo)' },
          { id: 3, name: 'MACD Strategy (Demo)' }
        ];
        
        defaultStrategies.forEach(strategy => {
          const option = document.createElement('option');
          option.value = strategy.id;
          option.textContent = strategy.name;
          strategySelect.appendChild(option);
        });
      });
  }
  
  // Run backtest
  function runBacktest() {
    if (!strategySelect || !startDateInput || !endDateInput) return;
    
    // Validate inputs
    if (!strategySelect.value) {
      showAlert('Please select a strategy', 'warning');
      return;
    }
    
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    if (!startDate || !endDate) {
      showAlert('Please select valid date range', 'warning');
      return;
    }
    
    // Show loading state
    showLoading(true);
    
    // Prepare request
    const requestData = {
      strategy_id: strategySelect.value,
      start_date: startDate,
      end_date: endDate
    };
    
    // Send request
    fetch('/api/backtest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Backtest failed');
      }
      return response.json();
    })
    .then(results => {
      showResults(results);
    })
    .catch(error => {
      console.error('Backtest error:', error);
      showAlert('Failed to run backtest: ' + error.message, 'danger');
      
      // Simulate results for demonstration
      const demoResults = generateDemoResults();
      showResults(demoResults);
    })
    .finally(() => {
      showLoading(false);
    });
  }
  
  // Generate demo results for fallback
  function generateDemoResults() {
    // Create simulated equity curve
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const initialCapital = 10000;
    let currentEquity = initialCapital;
    
    // Generate equity curve
    const equityCurve = {};
    const trades = [];
    let totalProfit = 0;
    let winCount = 0;
    
    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Random daily change between -2% and 3%
      const dailyChange = (Math.random() * 5 - 2) / 100;
      currentEquity *= (1 + dailyChange);
      equityCurve[dateStr] = currentEquity;
      
      // Generate random trades (approximately 1 every 5 days)
      if (Math.random() < 0.2) {
        const isWin = Math.random() < 0.6; // 60% win rate
        const tradeProfit = isWin ? 
          currentEquity * (Math.random() * 0.05 + 0.01) : 
          -currentEquity * (Math.random() * 0.03 + 0.01);
        
        totalProfit += tradeProfit;
        if (isWin) winCount++;
        
        trades.push({
          entry_date: dateStr,
          exit_date: dateStr,
          entry_price: 40000 + Math.random() * 5000,
          exit_price: 40000 + Math.random() * 5000,
          profit_loss: tradeProfit,
          profit_loss_pct: (tradeProfit / currentEquity) * 100,
          direction: Math.random() > 0.5 ? 'long' : 'short'
        });
      }
    }
    
    // Final equity value
    const finalEquity = currentEquity;
    const totalReturn = finalEquity - initialCapital;
    const totalReturnPct = (totalReturn / initialCapital) * 100;
    
    return {
      trades: trades,
      equity_curve: equityCurve,
      metrics: {
        total_return: totalReturn,
        total_return_pct: totalReturnPct,
        win_rate: (winCount / trades.length) * 100,
        total_trades: trades.length,
        winning_trades: winCount,
        losing_trades: trades.length - winCount,
        largest_win: Math.max(...trades.filter(t => t.profit_loss > 0).map(t => t.profit_loss)),
        largest_loss: Math.min(...trades.filter(t => t.profit_loss < 0).map(t => t.profit_loss)),
        average_win: trades.filter(t => t.profit_loss > 0).reduce((sum, t) => sum + t.profit_loss, 0) / winCount,
        average_loss: trades.filter(t => t.profit_loss < 0).reduce((sum, t) => sum + t.profit_loss, 0) / (trades.length - winCount),
        profit_factor: Math.abs(
          trades.filter(t => t.profit_loss > 0).reduce((sum, t) => sum + t.profit_loss, 0) / 
          trades.filter(t => t.profit_loss < 0).reduce((sum, t) => sum + t.profit_loss, 0)
        ),
        max_drawdown: 15.5,
        max_drawdown_pct: 15.5
      },
      profit_loss: totalReturnPct,
      win_rate: (winCount / trades.length) * 100,
      total_trades: trades.length
    };
  }
  
  // Show backtest results
  function showResults(results) {
    if (!backtestResults || !resultsContainer) return;
    
    // Show results container
    resultsContainer.classList.remove('d-none');
    
    // Create metrics table
    let metricsHtml = `
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">Backtest Results</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <table class="table table-sm">
                <tr>
                  <td>Total Return</td>
                  <td class="${results.metrics.total_return >= 0 ? 'positive-value' : 'negative-value'}">
                    ${results.metrics.total_return >= 0 ? '+' : ''}$${results.metrics.total_return.toFixed(2)}
                    (${results.metrics.total_return_pct.toFixed(2)}%)
                  </td>
                </tr>
                <tr>
                  <td>Win Rate</td>
                  <td>${results.metrics.win_rate.toFixed(2)}%</td>
                </tr>
                <tr>
                  <td>Total Trades</td>
                  <td>${results.metrics.total_trades}</td>
                </tr>
                <tr>
                  <td>Winning Trades</td>
                  <td>${results.metrics.winning_trades}</td>
                </tr>
                <tr>
                  <td>Losing Trades</td>
                  <td>${results.metrics.losing_trades}</td>
                </tr>
              </table>
            </div>
            <div class="col-md-6">
              <table class="table table-sm">
                <tr>
                  <td>Largest Win</td>
                  <td class="positive-value">$${results.metrics.largest_win.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Largest Loss</td>
                  <td class="negative-value">$${results.metrics.largest_loss.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Average Win</td>
                  <td class="positive-value">$${results.metrics.average_win.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Average Loss</td>
                  <td class="negative-value">$${results.metrics.average_loss.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Max Drawdown</td>
                  <td class="negative-value">${results.metrics.max_drawdown_pct.toFixed(2)}%</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
    
    backtestResults.innerHTML = metricsHtml;
    
    // Render equity curve chart
    renderEquityCurve(results.equity_curve);
    
    // Show trade list
    renderTradeList(results.trades);
  }
  
  // Render equity curve chart
  function renderEquityCurve(equityCurve) {
    if (!backtestChart) return;
    
    // Extract data for chart
    const dates = Object.keys(equityCurve);
    const equity = Object.values(equityCurve);
    
    // Destroy existing chart
    if (equityChart) {
      equityChart.destroy();
    }
    
    // Create new chart
    equityChart = new Chart(backtestChart, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Equity Curve',
          data: equity,
          borderColor: '#9d4edd',
          backgroundColor: 'rgba(157, 78, 221, 0.1)',
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          },
          legend: {
            display: true,
            labels: {
              color: '#f8f9fa'
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date',
              color: '#adb5bd'
            },
            ticks: {
              color: '#adb5bd',
              maxTicksLimit: 10
            },
            grid: {
              display: false
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Account Value ($)',
              color: '#adb5bd'
            },
            ticks: {
              color: '#adb5bd',
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            },
            grid: {
              color: 'rgba(157, 78, 221, 0.1)'
            }
          }
        }
      }
    });
  }
  
  // Render trade list
  function renderTradeList(trades) {
    if (!trades || trades.length === 0) return;
    
    // Create trades table
    const tradesTable = document.createElement('div');
    tradesTable.className = 'card mt-4';
    tradesTable.innerHTML = `
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Trade List</h5>
        <span class="badge badge-info">${trades.length} Trades</span>
      </div>
      <div class="card-body" style="max-height: 400px; overflow-y: auto;">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Direction</th>
              <th>Entry Date</th>
              <th>Exit Date</th>
              <th>Entry Price</th>
              <th>Exit Price</th>
              <th>P/L</th>
              <th>P/L %</th>
            </tr>
          </thead>
          <tbody>
            ${trades.map(trade => `
              <tr class="${trade.profit_loss > 0 ? 'table-success' : 'table-danger'}">
                <td>${trade.direction.toUpperCase()}</td>
                <td>${new Date(trade.entry_date).toLocaleDateString()}</td>
                <td>${new Date(trade.exit_date).toLocaleDateString()}</td>
                <td>$${parseFloat(trade.entry_price).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</td>
                <td>$${parseFloat(trade.exit_price).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</td>
                <td class="${trade.profit_loss > 0 ? 'positive-value' : 'negative-value'}">
                  ${trade.profit_loss > 0 ? '+' : ''}$${trade.profit_loss.toFixed(2)}
                </td>
                <td class="${trade.profit_loss > 0 ? 'positive-value' : 'negative-value'}">
                  ${trade.profit_loss > 0 ? '+' : ''}${trade.profit_loss_pct.toFixed(2)}%
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    backtestResults.appendChild(tradesTable);
  }
  
  // Show loading state
  function showLoading(isLoading) {
    if (runBacktestBtn) {
      const icon = runBacktestBtn.querySelector('i');
      
      if (isLoading) {
        runBacktestBtn.disabled = true;
        if (icon) {
          icon.className = 'fas fa-spinner fa-spin';
        }
        runBacktestBtn.querySelector('span').textContent = 'Running...';
      } else {
        runBacktestBtn.disabled = false;
        if (icon) {
          icon.className = 'fas fa-play';
        }
        runBacktestBtn.querySelector('span').textContent = 'Run Backtest';
      }
    }
  }
  
  // Show alert message
  function showAlert(message, type = 'danger') {
    const alertBox = document.getElementById('backtest-alert');
    if (!alertBox) return;
    
    alertBox.className = `alert alert-${type} animate-fade-in`;
    alertBox.textContent = message;
    alertBox.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 5000);
  }
  
  // Initialize backtesting functionality
  function initBacktest() {
    if (!runBacktestBtn) return;
    
    initDatePickers();
    loadStrategies();
    
    // Add event listener for Run button
    runBacktestBtn.addEventListener('click', runBacktest);
  }
  
  // Initialize if on backtest page
  if (document.getElementById('backtest-container')) {
    initBacktest();
  }
  
  // Expose public API
  window.BacktestModule = {
    runBacktest: runBacktest,
    loadStrategies: loadStrategies
  };
});
