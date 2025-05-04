// Signals.js - Trading signals functionality

document.addEventListener('DOMContentLoaded', function() {
  console.log('Signals module loaded');

  // Elements
  const signalsContainer = document.getElementById('signals-container');
  const generateSignalBtn = document.getElementById('generate-signal');
  const signalsList = document.getElementById('signals-list');
  const signalFilters = document.querySelectorAll('.signal-filter');
  
  // Load signals from the server
  function loadSignals() {
    if (!signalsList) return;
    
    // Show loading state
    signalsList.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">Loading signals...</p></div>';
    
    fetch('/api/signals')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch signals');
        }
        return response.json();
      })
      .then(signals => {
        displaySignals(signals);
      })
      .catch(error => {
        console.error('Error loading signals:', error);
        signalsList.innerHTML = `
          <div class="text-center py-4">
            <i class="fas fa-exclamation-circle text-danger fa-2x"></i>
            <p class="mt-2">Failed to load signals: ${error.message}</p>
            <button class="btn btn-outline-primary mt-2" onclick="SignalsModule.reload()">
              <i class="fas fa-sync-alt"></i> Retry
            </button>
          </div>
        `;
        
        // Show demo signals for preview purposes
        const demoSignals = generateDemoSignals();
        displaySignals(demoSignals);
      });
  }
  
  // Generate demo signals for preview
  function generateDemoSignals() {
    const now = new Date();
    const signals = [];
    
    // Generate some demo signals
    signals.push({
      id: 1,
      signal_type: 'BUY',
      price: 42800.50,
      confidence: 0.85,
      reason: 'RSI oversold (28.5), MACD bullish crossover',
      created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    });
    
    signals.push({
      id: 2,
      signal_type: 'SELL',
      price: 43250.75,
      confidence: 0.78,
      reason: 'Price reached resistance level, RSI overbought (72.3)',
      created_at: new Date(now - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
    });
    
    signals.push({
      id: 3,
      signal_type: 'BUY',
      price: 41500.25,
      confidence: 0.92,
      reason: 'Bullish engulfing pattern, volume spike, price above 200 SMA',
      created_at: new Date(now - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    });
    
    signals.push({
      id: 4,
      signal_type: 'HOLD',
      price: 42150.00,
      confidence: 0.65,
      reason: 'Consolidation pattern, low volatility, wait for breakout',
      created_at: new Date(now - 36 * 60 * 60 * 1000).toISOString() // 1.5 days ago
    });
    
    return signals;
  }
  
  // Display signals in the UI
  function displaySignals(signals) {
    if (!signalsList) return;
    
    if (!signals || signals.length === 0) {
      signalsList.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-info-circle fa-2x"></i>
          <p class="mt-2">No trading signals available yet</p>
          <button class="btn btn-primary mt-2" id="first-signal-btn">
            <i class="fas fa-bolt"></i> Generate First Signal
          </button>
        </div>
      `;
      
      // Add event listener to the button
      const firstSignalBtn = document.getElementById('first-signal-btn');
      if (firstSignalBtn) {
        firstSignalBtn.addEventListener('click', generateSignal);
      }
      
      return;
    }
    
    // Clear container
    signalsList.innerHTML = '';
    
    // Create signals elements
    signals.forEach(signal => {
      const signalElement = createSignalElement(signal);
      signalsList.appendChild(signalElement);
    });
  }
  
  // Create a signal element
  function createSignalElement(signal) {
    const signalElement = document.createElement('div');
    signalElement.className = `signal signal-${signal.signal_type.toLowerCase()} animate-fade-in`;
    signalElement.dataset.id = signal.id;
    signalElement.dataset.type = signal.signal_type;
    
    // Format date
    const signalDate = new Date(signal.created_at);
    const timeAgo = formatTimeAgo(signalDate);
    
    // Confidence badge class
    const confidencePercent = Math.round(signal.confidence * 100);
    let confidenceBadgeClass = 'badge-warning';
    if (confidencePercent >= 80) {
      confidenceBadgeClass = 'badge-success';
    } else if (confidencePercent < 60) {
      confidenceBadgeClass = 'badge-danger';
    }
    
    signalElement.innerHTML = `
      <div class="signal-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
          ${signal.signal_type === 'BUY' ? 
            '<i class="fas fa-arrow-up text-success mr-2"></i>' : 
            signal.signal_type === 'SELL' ? 
              '<i class="fas fa-arrow-down text-danger mr-2"></i>' : 
              '<i class="fas fa-minus text-warning mr-2"></i>'
          }
          ${signal.signal_type} @ $${parseFloat(signal.price).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </h5>
        <span class="badge ${confidenceBadgeClass}">
          ${confidencePercent}% Confidence
        </span>
      </div>
      <div class="signal-body mt-2">
        <p class="mb-1"><strong>Reason:</strong> ${signal.reason}</p>
        <div class="d-flex justify-content-between align-items-center mt-2">
          <small class="text-muted">
            <i class="far fa-clock"></i> ${timeAgo} (${signalDate.toLocaleString()})
          </small>
          <div class="btn-group">
            <button class="btn btn-sm btn-outline-primary signal-action" data-action="paper-trade">
              <i class="fas fa-file-invoice-dollar"></i> Paper Trade
            </button>
            <button class="btn btn-sm btn-outline-success signal-action" data-action="live-trade">
              <i class="fas fa-chart-line"></i> Live Trade
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners for buttons
    const actionButtons = signalElement.querySelectorAll('.signal-action');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const action = button.dataset.action;
        handleSignalAction(signal, action);
      });
    });
    
    return signalElement;
  }
  
  // Format time ago
  function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
      return `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
      return `${diffMin} minutes ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hours ago`;
    } else {
      return `${diffDay} days ago`;
    }
  }
  
  // Handle signal actions (paper trade or live trade)
  function handleSignalAction(signal, action) {
    if (action === 'paper-trade') {
      // Navigate to paper trading page with signal pre-filled
      window.location.href = `/paper_trading?signal_id=${signal.id}`;
    } else if (action === 'live-trade') {
      // Show confirmation modal for live trading
      showConfirmationModal(signal);
    }
  }
  
  // Show confirmation modal for live trading
  function showConfirmationModal(signal) {
    // Create modal element
    const modalElement = document.createElement('div');
    modalElement.className = 'modal fade';
    modalElement.id = 'confirmationModal';
    modalElement.setAttribute('tabindex', '-1');
    modalElement.setAttribute('aria-hidden', 'true');
    
    modalElement.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Live Trade</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to execute a live ${signal.signal_type} order at market price?</p>
            <div class="alert alert-warning">
              <i class="fas fa-exclamation-triangle"></i> 
              Live trading is not available in this demo. Please use paper trading instead.
            </div>
            <p class="mb-0"><strong>Signal details:</strong></p>
            <ul>
              <li>${signal.signal_type} at $${parseFloat(signal.price).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}</li>
              <li>Confidence: ${Math.round(signal.confidence * 100)}%</li>
              <li>Reason: ${signal.reason}</li>
            </ul>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="goToPaperTrade">
              <i class="fas fa-file-invoice-dollar"></i> Use Paper Trading
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(modalElement);
    
    // Initialize Bootstrap modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Add event listener for paper trade button
    const paperTradeBtn = document.getElementById('goToPaperTrade');
    if (paperTradeBtn) {
      paperTradeBtn.addEventListener('click', () => {
        window.location.href = `/paper_trading?signal_id=${signal.id}`;
        modal.hide();
      });
    }
    
    // Remove modal from DOM when hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
      document.body.removeChild(modalElement);
    });
  }
  
  // Generate new trading signal
  function generateSignal() {
    if (!generateSignalBtn) return;
    
    // Show loading state
    generateSignalBtn.disabled = true;
    generateSignalBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    
    // Call API to generate signal
    fetch('/api/signals/generate', {
      method: 'POST'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to generate signal');
      }
      return response.json();
    })
    .then(signal => {
      // Reset button state
      generateSignalBtn.disabled = false;
      generateSignalBtn.innerHTML = '<i class="fas fa-bolt"></i> Generate Signal';
      
      // Show success message
      showAlert('New signal generated successfully', 'success');
      
      // Reload signals list
      loadSignals();
    })
    .catch(error => {
      console.error('Error generating signal:', error);
      
      // Reset button state
      generateSignalBtn.disabled = false;
      generateSignalBtn.innerHTML = '<i class="fas fa-bolt"></i> Generate Signal';
      
      // Show error message
      showAlert('Failed to generate signal: ' + error.message, 'danger');
      
      // For demo purposes, show a new simulated signal
      const demoSignal = {
        id: Math.floor(Math.random() * 1000) + 10,
        signal_type: Math.random() > 0.5 ? 'BUY' : 'SELL',
        price: 42000 + Math.random() * 2000,
        confidence: 0.7 + Math.random() * 0.2,
        reason: 'AI detected a potential market movement based on pattern recognition and volume analysis',
        created_at: new Date().toISOString()
      };
      
      // Add the new signal to the top of the list
      if (signalsList) {
        const signalElement = createSignalElement(demoSignal);
        signalsList.insertBefore(signalElement, signalsList.firstChild);
        
        // Highlight the new signal
        setTimeout(() => {
          signalElement.classList.add('highlight-signal');
        }, 100);
        
        setTimeout(() => {
          signalElement.classList.remove('highlight-signal');
        }, 2000);
      }
    });
  }
  
  // Show alert message
  function showAlert(message, type = 'danger') {
    const alertsContainer = document.getElementById('signals-alerts');
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
  
  // Setup signal filtering
  function setupFilters() {
    if (!signalFilters.length) return;
    
    signalFilters.forEach(filter => {
      filter.addEventListener('click', () => {
        // Update active state
        signalFilters.forEach(f => f.classList.remove('active'));
        filter.classList.add('active');
        
        // Get filter value
        const filterValue = filter.dataset.filter;
        
        // Filter signals
        const signals = signalsList.querySelectorAll('.signal');
        signals.forEach(signal => {
          if (filterValue === 'all' || signal.dataset.type.toLowerCase() === filterValue.toLowerCase()) {
            signal.style.display = 'block';
          } else {
            signal.style.display = 'none';
          }
        });
      });
    });
  }
  
  // Initialize signals functionality
  function initSignals() {
    // Load signals
    loadSignals();
    
    // Setup filters
    setupFilters();
    
    // Setup generate signal button
    if (generateSignalBtn) {
      generateSignalBtn.addEventListener('click', generateSignal);
    }
  }
  
  // Initialize if on signals page
  if (document.getElementById('signals-container')) {
    initSignals();
  }
  
  // Expose public API
  window.SignalsModule = {
    reload: loadSignals,
    generate: generateSignal
  };
});
