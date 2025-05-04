// trading.js - Handles paper trading functionality

document.addEventListener('DOMContentLoaded', function() {
  console.log('Trading module loaded');
  
  // Elements
  const paperTradeForm = document.getElementById('paper-trade-form');
  const tradeTypeSelect = document.getElementById('trade-type');
  const quantityInput = document.getElementById('trade-quantity');
  const currentPriceElement = document.getElementById('current-price');
  const totalValueElement = document.getElementById('total-value');
  const submitTradeBtn = document.getElementById('submit-trade');
  const activeTrades = document.getElementById('active-trades');
  const tradeHistory = document.getElementById('trade-history');
  const portfolioValue = document.getElementById('portfolio-value');
  const profitLoss = document.getElementById('profit-loss');
  
  // Current BTC price
  let currentPrice = 0;
  
  // Initialize paper trading page
  function initPaperTrading() {
    // Get current Bitcoin price
    updateCurrentPrice();
    
    // Setup form listeners
    setupFormListeners();
    
    // Load active trades
    loadTrades();
    
    // Setup refresh button
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Add spinning animation
        this.querySelector('i').classList.add('fa-spin');
        
        // Update price and trades
        updateCurrentPrice();
        loadTrades();
        
        // Remove spinning after delay
        setTimeout(() => {
          this.querySelector('i').classList.remove('fa-spin');
        }, 1000);
      });
    }
    
    // Check for signal_id in URL params (for pre-filled trades)
    const urlParams = new URLSearchParams(window.location.search);
    const signalId = urlParams.get('signal_id');
    
    if (signalId) {
      prefillTradeFromSignal(signalId);
    }
    
    // Set up auto-refresh
    setInterval(updateCurrentPrice, 30000); // Update price every 30 seconds
  }
  
  // Update current Bitcoin price
  function updateCurrentPrice() {
    fetch('/api/bitcoin/price?interval=1m&limit=1')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch current price');
        }
        return response.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          currentPrice = parseFloat(data[0].close);
          
          // Update UI
          if (currentPriceElement) {
            currentPriceElement.textContent = formatCurrency(currentPrice);
            
            // Animate price update
            currentPriceElement.classList.add('animate-pulse');
            setTimeout(() => {
              currentPriceElement.classList.remove('animate-pulse');
            }, 1000);
          }
          
          // Update total value if quantity is entered
          updateTotalValue();
        }
      })
      .catch(error => {
        console.error('Error fetching current price:', error);
        showAlert('Failed to fetch current Bitcoin price', 'danger');
        
        // Use fallback price for demo
        currentPrice = 42500.00;
        if (currentPriceElement) {
          currentPriceElement.textContent = formatCurrency(currentPrice);
        }
      });
  }
  
  // Set up form listeners
  function setupFormListeners() {
    if (!paperTradeForm) return;
    
    // Update total value when quantity changes
    if (quantityInput) {
      quantityInput.addEventListener('input', updateTotalValue);
    }
    
    // Form submission
    paperTradeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitPaperTrade();
    });
  }
  
  // Update total value based on quantity and current price
  function updateTotalValue() {
    if (!quantityInput || !totalValueElement) return;
    
    const quantity = parseFloat(quantityInput.value) || 0;
    const total = quantity * currentPrice;
    
    totalValueElement.textContent = formatCurrency(total);
  }
  
  // Format currency value
  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }
  
  // Submit paper trade
  function submitPaperTrade() {
    if (!paperTradeForm || !submitTradeBtn) return;
    
    // Validate form
    const tradeType = tradeTypeSelect.value;
    const quantity = parseFloat(quantityInput.value);
    
    if (!tradeType) {
      showAlert('Please select a trade type', 'warning');
      return;
    }
    
    if (!quantity || quantity <= 0) {
      showAlert('Please enter a valid quantity', 'warning');
      return;
    }
    
    // Show loading state
    submitTradeBtn.disabled = true;
    submitTradeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Prepare data
    const tradeData = {
      trade_type: tradeType,
      quantity: quantity,
      price: currentPrice
    };
    
    // Submit trade to server
    fetch('/api/paper_trades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tradeData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to submit trade');
      }
      return response.json();
    })
    .then(result => {
      // Reset form
      paperTradeForm.reset();
      
      // Show success message
      showAlert(`${tradeType.toUpperCase()} order executed successfully!`, 'success');
      
      // Reload trades
      loadTrades();
    })
    .catch(error => {
      console.error('Error submitting trade:', error);
      showAlert('Failed to submit trade: ' + error.message, 'danger');
      
      // For demo, simulate successful trade
      simulateTradeSuccess(tradeData);
    })
    .finally(() => {
      // Reset button state
      submitTradeBtn.disabled = false;
      submitTradeBtn.innerHTML = 'Execute Trade';
    });
  }
  
  // Simulate trade success for demo
  function simulateTradeSuccess(tradeData) {
    // Reset form
    if (paperTradeForm) {
      paperTradeForm.reset();
    }
    
    // Show success message
    showAlert(`${tradeData.trade_type.toUpperCase()} order executed successfully!`, 'success');
    
    // Create simulated trade
    const newTrade = {
      id: Math.floor(Math.random() * 10000),
      trade_type: tradeData.trade_type,
      price: tradeData.price,
      quantity: tradeData.quantity,
      value: tradeData.price * tradeData.quantity,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      profit_loss: null,
      profit_loss_percent: null
    };
    
    // Add to active trades
    if (activeTrades) {
      const tradeElement = createTradeElement(newTrade, true);
      
      // If empty message exists, remove it
      const emptyMessage = activeTrades.querySelector('.empty-message');
      if (emptyMessage) {
        activeTrades.removeChild(emptyMessage);
      }
      
      // Add to top of list
      if (activeTrades.firstChild) {
        activeTrades.insertBefore(tradeElement, activeTrades.firstChild);
      } else {
        activeTrades.appendChild(tradeElement);
      }
      
      // Highlight the new trade
      setTimeout(() => {
        tradeElement.classList.add('highlight-trade');
      }, 100);
      
      setTimeout(() => {
        tradeElement.classList.remove('highlight-trade');
      }, 2000);
    }
    
    // Update portfolio summary
    updatePortfolioSummary();
  }
  
  // Load active and historical trades
  function loadTrades() {
    // In a real implementation, this would fetch trades from the server
    // For demo purposes, we'll generate some sample trades
    fetch('/api/paper_trades')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        return response.json();
      })
      .then(trades => {
        displayTrades(trades);
      })
      .catch(error => {
        console.error('Error loading trades:', error);
        
        // For demo, display simulated trades
        const sampleTrades = generateSampleTrades();
        displayTrades(sampleTrades);
      });
  }
  
  // Generate sample trades for demo
  function generateSampleTrades() {
    const now = new Date();
    
    // Active trades
    const activeTrades = [
      {
        id: 1001,
        trade_type: 'BUY',
        price: currentPrice * 0.98, // Slightly below current price
        quantity: 0.05,
        value: currentPrice * 0.98 * 0.05,
        status: 'OPEN',
        created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        profit_loss: (currentPrice - currentPrice * 0.98) * 0.05,
        profit_loss_percent: (currentPrice / (currentPrice * 0.98) - 1) * 100
      },
      {
        id: 1002,
        trade_type: 'SELL',
        price: currentPrice * 1.02, // Slightly above current price
        quantity: 0.03,
        value: currentPrice * 1.02 * 0.03,
        status: 'OPEN',
        created_at: new Date(now - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        profit_loss: (currentPrice * 1.02 - currentPrice) * 0.03,
        profit_loss_percent: (currentPrice * 1.02 / currentPrice - 1) * 100
      }
    ];
    
    // Historical trades
    const closedTrades = [
      {
        id: 1003,
        trade_type: 'BUY',
        price: currentPrice * 0.9,
        quantity: 0.1,
        value: currentPrice * 0.9 * 0.1,
        status: 'CLOSED',
        created_at: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        closed_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        close_price: currentPrice * 0.95,
        profit_loss: (currentPrice * 0.95 - currentPrice * 0.9) * 0.1,
        profit_loss_percent: (currentPrice * 0.95 / (currentPrice * 0.9) - 1) * 100
      },
      {
        id: 1004,
        trade_type: 'SELL',
        price: currentPrice * 1.1,
        quantity: 0.08,
        value: currentPrice * 1.1 * 0.08,
        status: 'CLOSED',
        created_at: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
        closed_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        close_price: currentPrice * 1.05,
        profit_loss: (currentPrice * 1.1 - currentPrice * 1.05) * 0.08,
        profit_loss_percent: (currentPrice * 1.1 / (currentPrice * 1.05) - 1) * 100
      }
    ];
    
    return {
      active: activeTrades,
      history: closedTrades
    };
  }
  
  // Display trades in the UI
  function displayTrades(trades) {
    if (!activeTrades || !tradeHistory) return;
    
    // Clear containers
    activeTrades.innerHTML = '';
    tradeHistory.innerHTML = '';
    
    // Display active trades
    if (trades.active && trades.active.length > 0) {
      trades.active.forEach(trade => {
        const tradeElement = createTradeElement(trade, true);
        activeTrades.appendChild(tradeElement);
      });
    } else {
      activeTrades.innerHTML = '<div class="text-center py-4 empty-message">No active trades</div>';
    }
    
    // Display trade history
    if (trades.history && trades.history.length > 0) {
      trades.history.forEach(trade => {
        const tradeElement = createTradeElement(trade, false);
        tradeHistory.appendChild(tradeElement);
      });
    } else {
      tradeHistory.innerHTML = '<div class="text-center py-4 empty-message">No trade history</div>';
    }
    
    // Update portfolio summary
    updatePortfolioSummary(trades);
  }
  
  // Create trade element
  function createTradeElement(trade, isActive) {
    const tradeElement = document.createElement('div');
    tradeElement.className = `card mb-3 ${isActive ? 'active-trade' : 'closed-trade'}`;
    tradeElement.dataset.id = trade.id;
    
    // Format dates
    const createdDate = new Date(trade.created_at);
    const closedDate = trade.closed_at ? new Date(trade.closed_at) : null;
    
    // Calculate profit/loss if active trade
    if (isActive && trade.status === 'OPEN') {
      if (trade.trade_type === 'BUY') {
        trade.profit_loss = (currentPrice - trade.price) * trade.quantity;
        trade.profit_loss_percent = (currentPrice / trade.price - 1) * 100;
      } else {
        trade.profit_loss = (trade.price - currentPrice) * trade.quantity;
        trade.profit_loss_percent = (trade.price / currentPrice - 1) * 100;
      }
    }
    
    // Create element content
    tradeElement.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">
            <span class="badge ${trade.trade_type === 'BUY' ? 'badge-success' : 'badge-danger'}">
              ${trade.trade_type}
            </span>
            ${trade.quantity} BTC @ ${formatCurrency(trade.price)}
          </h5>
          <div class="trade-status">
            ${isActive ? 
              `<span class="badge badge-info">OPEN</span>` :
              `<span class="badge badge-secondary">CLOSED</span>`
            }
          </div>
        </div>
        
        <div class="trade-details mt-3">
          <div class="row">
            <div class="col-md-6">
              <p class="mb-1"><small>Trade Value: ${formatCurrency(trade.price * trade.quantity)}</small></p>
              <p class="mb-1"><small>Date: ${createdDate.toLocaleString()}</small></p>
              ${!isActive ? `<p class="mb-1"><small>Closed: ${closedDate.toLocaleString()}</small></p>` : ''}
            </div>
            <div class="col-md-6 text-right">
              <div class="profit-loss">
                <p class="mb-1 ${trade.profit_loss >= 0 ? 'positive-value' : 'negative-value'}">
                  P/L: ${trade.profit_loss >= 0 ? '+' : ''}${formatCurrency(trade.profit_loss)}
                </p>
                <p class="mb-0 ${trade.profit_loss >= 0 ? 'positive-value' : 'negative-value'}">
                  ${trade.profit_loss_percent >= 0 ? '+' : ''}${trade.profit_loss_percent.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>
        
        ${isActive ? `
          <div class="trade-actions mt-3 text-right">
            <button class="btn btn-sm btn-outline-danger close-trade-btn" data-id="${trade.id}">
              Close Position
            </button>
          </div>
        ` : ''}
      </div>
    `;
    
    // Add event listener for close trade button
    if (isActive) {
      const closeBtn = tradeElement.querySelector('.close-trade-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => closeTrade(trade.id));
      }
    }
    
    return tradeElement;
  }
  
  // Close a trade
  function closeTrade(tradeId) {
    // Show confirmation
    if (!confirm('Are you sure you want to close this position at the current market price?')) {
      return;
    }
    
    // Find the trade element
    const tradeElement = activeTrades.querySelector(`[data-id="${tradeId}"]`);
    if (!tradeElement) return;
    
    // Show loading
    const closeBtn = tradeElement.querySelector('.close-trade-btn');
    if (closeBtn) {
      closeBtn.disabled = true;
      closeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Closing...';
    }
    
    // Send close request to server
    fetch(`/api/paper_trades/${tradeId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ close_price: currentPrice })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to close trade');
      }
      return response.json();
    })
    .then(result => {
      // Show success message
      showAlert('Trade closed successfully!', 'success');
      
      // Reload trades
      loadTrades();
    })
    .catch(error => {
      console.error('Error closing trade:', error);
      showAlert('Failed to close trade: ' + error.message, 'danger');
      
      // For demo, simulate successful close
      simulateTradeClose(tradeId, tradeElement);
    });
  }
  
  // Simulate trade close for demo
  function simulateTradeClose(tradeId, tradeElement) {
    // Show success message
    showAlert('Trade closed successfully!', 'success');
    
    // Remove from active trades
    if (tradeElement && activeTrades) {
      activeTrades.removeChild(tradeElement);
      
      // If no more active trades, show empty message
      if (activeTrades.children.length === 0) {
        activeTrades.innerHTML = '<div class="text-center py-4 empty-message">No active trades</div>';
      }
    }
    
    // Refresh trades to update history
    loadTrades();
  }
  
  // Update portfolio summary
  function updatePortfolioSummary(trades) {
    if (!portfolioValue || !profitLoss) return;
    
    // If no trades provided, use current trades in DOM
    if (!trades) {
      trades = {
        active: [],
        history: []
      };
      
      // Extract active trades from DOM
      if (activeTrades) {
        const activeElements = activeTrades.querySelectorAll('.card');
        activeElements.forEach(element => {
          const id = element.dataset.id;
          if (id) {
            const profitElement = element.querySelector('.profit-loss p:first-child');
            const profit = profitElement ? 
              parseFloat(profitElement.textContent.replace('P/L: ', '').replace(/[^0-9.-]+/g, '')) : 
              0;
            
            trades.active.push({ id, profit_loss: profit });
          }
        });
      }
      
      // Extract history trades from DOM
      if (tradeHistory) {
        const historyElements = tradeHistory.querySelectorAll('.card');
        historyElements.forEach(element => {
          const id = element.dataset.id;
          if (id) {
            const profitElement = element.querySelector('.profit-loss p:first-child');
            const profit = profitElement ? 
              parseFloat(profitElement.textContent.replace('P/L: ', '').replace(/[^0-9.-]+/g, '')) : 
              0;
            
            trades.history.push({ id, profit_loss: profit });
          }
        });
      }
    }
    
    // Calculate total portfolio value and profit/loss
    let totalValue = 10000; // Starting capital
    let totalProfit = 0;
    
    // Add profit/loss from active trades
    if (trades.active && trades.active.length > 0) {
      trades.active.forEach(trade => {
        if (trade.profit_loss) {
          totalProfit += trade.profit_loss;
        }
      });
    }
    
    // Add profit/loss from closed trades
    if (trades.history && trades.history.length > 0) {
      trades.history.forEach(trade => {
        if (trade.profit_loss) {
          totalProfit += trade.profit_loss;
        }
      });
    }
    
    // Calculate total portfolio value
    totalValue += totalProfit;
    
    // Update UI
    portfolioValue.textContent = formatCurrency(totalValue);
    
    const profitPercent = (totalProfit / (totalValue - totalProfit)) * 100;
    profitLoss.textContent = `${totalProfit >= 0 ? '+' : ''}${formatCurrency(totalProfit)} (${totalProfit >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%)`;
    profitLoss.className = totalProfit >= 0 ? 'positive-value' : 'negative-value';
  }
  
  // Prefill trade form from signal
  function prefillTradeFromSignal(signalId) {
    fetch(`/api/signals/${signalId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch signal');
        }
        return response.json();
      })
      .then(signal => {
        // Fill form with signal data
        if (tradeTypeSelect) {
          tradeTypeSelect.value = signal.signal_type;
        }
        
        // Set default quantity (0.01 BTC)
        if (quantityInput) {
          quantityInput.value = '0.01';
          updateTotalValue();
        }
        
        // Show info message
        showAlert(`Trade prefilled from ${signal.signal_type} signal`, 'info');
      })
      .catch(error => {
        console.error('Error prefilling trade:', error);
        
        // For demo, prefill with default values
        if (tradeTypeSelect) {
          // Extract signal type from URL if present (like "buy" or "sell")
          const signalType = window.location.search.toLowerCase().includes('buy') ? 'BUY' : 'SELL';
          tradeTypeSelect.value = signalType;
        }
        
        if (quantityInput) {
          quantityInput.value = '0.01';
          updateTotalValue();
        }
        
        showAlert('Trade form prefilled with default values', 'info');
      });
  }
  
  // Show alert message
  function showAlert(message, type = 'danger') {
    const alertsContainer = document.getElementById('trading-alerts');
    if (!alertsContainer) return;
    
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show animate-fade-in`;
    alertElement.innerHTML = `
      ${message}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    `;
    
    // Add to container
    alertsContainer.appendChild(alertElement);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      alertElement.classList.remove('show');
      setTimeout(() => {
        alertsContainer.removeChild(alertElement);
      }, 300);
    }, 5000);
  }
  
  // Initialize if on paper trading page
  if (document.getElementById('paper-trading-container')) {
    initPaperTrading();
  }
  
  // Expose public API
  window.TradingModule = {
    updatePrice: updateCurrentPrice,
    loadTrades: loadTrades,
    closeTrade: closeTrade
  };
});
