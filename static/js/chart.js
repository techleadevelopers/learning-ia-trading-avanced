// Chart.js - Handles all chart rendering for the platform

document.addEventListener('DOMContentLoaded', function() {
  console.log('Chart.js module loaded');

  // Elements and chart instances
  let priceChartElement = document.getElementById('price-chart');
  let indicatorChartElement = document.getElementById('indicator-chart');
  let priceChart, indicatorChart;

  // Configuration options
  const chartOptions = {
    animation: {
      duration: 800,
      easing: 'easeOutQuart'
    },
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: {
        radius: 0,
        hoverRadius: 5,
        hitRadius: 5,
      },
      line: {
        tension: 0.4
      }
    },
    tooltips: {
      mode: 'index',
      intersect: false,
      backgroundColor: '#16213e',
      titleFontColor: '#9d4edd',
      bodyFontColor: '#f8f9fa',
      borderColor: '#7b2cbf',
      borderWidth: 1
    },
    hover: {
      mode: 'nearest',
      intersect: false
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
          color: 'rgba(157, 78, 221, 0.1)'
        },
        ticks: {
          color: '#adb5bd'
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(157, 78, 221, 0.1)'
        },
        ticks: {
          color: '#adb5bd'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#f8f9fa'
        }
      },
      annotation: {
        annotations: []
      }
    }
  };

  // Main price chart initialization
  function initPriceChart() {
    if (!priceChartElement) return;

    // Get initial data
    fetchBitcoinData('1h', 100)
      .then(data => {
        renderPriceChart(data);
        renderIndicatorChart(data);
      })
      .catch(error => {
        console.error('Error initializing chart:', error);
        showChartError(priceChartElement, 'Failed to load chart data');
      });
  }

  // Render the main price chart
  function renderPriceChart(data) {
    if (!priceChartElement) return;

    // Prepare the data
    const dates = data.map(candle => new Date(parseInt(candle.timestamp)).toLocaleTimeString());
    const prices = data.map(candle => parseFloat(candle.close));
    const volumes = data.map(candle => parseFloat(candle.volume));
    
    // Get technical indicators if available
    fetchTechnicalIndicators('1h', 100)
      .then(indicators => {
        // Slice indicators to match our data length
        const length = Math.min(data.length, indicators.sma_20.length);
        const sma20 = indicators.sma_20.slice(-length);
        const sma50 = indicators.sma_50.slice(-length);
        const bollingerUpper = indicators.bollinger_upper.slice(-length);
        const bollingerLower = indicators.bollinger_lower.slice(-length);
        
        // Create the chart
        if (priceChart) {
          priceChart.destroy();
        }
        
        priceChart = new Chart(priceChartElement, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [
              {
                label: 'BTC Price',
                data: prices,
                borderColor: '#9d4edd',
                backgroundColor: 'rgba(157, 78, 221, 0.1)',
                fill: false,
                borderWidth: 2,
                pointBorderColor: '#9d4edd',
                pointBackgroundColor: '#9d4edd'
              },
              {
                label: 'SMA 20',
                data: sma20,
                borderColor: '#4caf50',
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                pointRadius: 0,
                borderDash: [5, 5]
              },
              {
                label: 'SMA 50',
                data: sma50,
                borderColor: '#f44336',
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                pointRadius: 0,
                borderDash: [5, 5]
              },
              {
                label: 'Bollinger Upper',
                data: bollingerUpper,
                borderColor: 'rgba(33, 150, 243, 0.5)',
                backgroundColor: 'transparent',
                borderWidth: 1,
                pointRadius: 0
              },
              {
                label: 'Bollinger Lower',
                data: bollingerLower,
                borderColor: 'rgba(33, 150, 243, 0.5)',
                backgroundColor: 'rgba(33, 150, 243, 0.05)',
                borderWidth: 1,
                pointRadius: 0,
                fill: {
                  target: 3,
                  above: 'rgba(33, 150, 243, 0.05)'
                }
              }
            ]
          },
          options: {
            ...chartOptions,
            interaction: {
              mode: 'nearest',
              axis: 'x',
              intersect: false
            }
          }
        });
        
        // Get predictions
        fetchPricePrediction('1h', 24)
          .then(prediction => {
            addPredictionToChart(prediction);
          })
          .catch(error => {
            console.error('Error fetching prediction:', error);
          });
      })
      .catch(error => {
        console.error('Error fetching indicators:', error);
        
        // Fallback to just price data if indicators fail
        if (priceChart) {
          priceChart.destroy();
        }
        
        priceChart = new Chart(priceChartElement, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [{
              label: 'BTC Price',
              data: prices,
              borderColor: '#9d4edd',
              backgroundColor: 'rgba(157, 78, 221, 0.1)',
              fill: true,
              borderWidth: 2
            }]
          },
          options: chartOptions
        });
      });
  }

  // Render the secondary indicator chart (RSI, MACD, etc)
  function renderIndicatorChart(data) {
    if (!indicatorChartElement) return;
    
    fetchTechnicalIndicators('1h', 100)
      .then(indicators => {
        // Process indicator data
        const dates = data.map(candle => new Date(parseInt(candle.timestamp)).toLocaleTimeString());
        const length = Math.min(data.length, indicators.rsi.length);
        const rsiData = indicators.rsi.slice(-length);
        const macdData = indicators.macd.slice(-length);
        const macdSignal = indicators.macd_signal.slice(-length);
        
        if (indicatorChart) {
          indicatorChart.destroy();
        }
        
        indicatorChart = new Chart(indicatorChartElement, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [
              {
                label: 'RSI',
                data: rsiData,
                borderColor: '#ff9800',
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                yAxisID: 'y'
              },
              {
                label: 'MACD',
                data: macdData,
                borderColor: '#2196f3',
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                yAxisID: 'y1'
              },
              {
                label: 'Signal',
                data: macdSignal,
                borderColor: '#f44336',
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                borderDash: [5, 5],
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            ...chartOptions,
            scales: {
              x: {
                display: true,
                grid: {
                  display: false
                },
                ticks: {
                  color: '#adb5bd'
                }
              },
              y: {
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'RSI',
                  color: '#ff9800'
                },
                suggestedMin: 0,
                suggestedMax: 100,
                grid: {
                  color: 'rgba(157, 78, 221, 0.1)'
                },
                ticks: {
                  color: '#adb5bd'
                }
              },
              y1: {
                display: true,
                position: 'right',
                title: {
                  display: true,
                  text: 'MACD',
                  color: '#2196f3'
                },
                grid: {
                  drawOnChartArea: false,
                  color: 'rgba(157, 78, 221, 0.1)'
                },
                ticks: {
                  color: '#adb5bd'
                }
              }
            }
          }
        });
      })
      .catch(error => {
        console.error('Error rendering indicator chart:', error);
        showChartError(indicatorChartElement, 'Failed to load indicator data');
      });
  }

  // Add prediction data to the main chart
  function addPredictionToChart(prediction) {
    if (!priceChart || !prediction || !prediction.predictions) return;
    
    // Convert timestamps to readable format
    const predictionLabels = prediction.timestamps.map(ts => 
      new Date(parseInt(ts)).toLocaleTimeString()
    );
    
    // Create prediction dataset
    const predictionDataset = {
      label: 'Prediction',
      data: prediction.predictions,
      borderColor: '#ff9800',
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 2,
      pointBackgroundColor: '#ff9800',
      pointBorderColor: '#ff9800'
    };
    
    // Add prediction dataset to chart
    priceChart.data.labels = [...priceChart.data.labels, ...predictionLabels];
    priceChart.data.datasets.push(predictionDataset);
    
    // Update chart
    priceChart.update();
  }

  // Utility function to display error messages in chart areas
  function showChartError(chartElement, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chart-error';
    errorDiv.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <p>${message}</p>
    `;
    
    // Replace chart canvas with error message
    chartElement.parentNode.replaceChild(errorDiv, chartElement);
  }

  // Fetch Bitcoin price data from API
  function fetchBitcoinData(interval = '1h', limit = 100) {
    return fetch(`/api/bitcoin/price?interval=${interval}&limit=${limit}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch Bitcoin data');
        }
        return response.json();
      });
  }

  // Fetch technical indicators from API
  function fetchTechnicalIndicators(interval = '1h', limit = 100) {
    return fetch(`/api/indicators?interval=${interval}&limit=${limit}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch indicators');
        }
        return response.json();
      });
  }

  // Fetch price predictions from API
  function fetchPricePrediction(interval = '1h', periods = 24) {
    return fetch(`/api/predict?interval=${interval}&periods=${periods}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch price prediction');
        }
        return response.json();
      });
  }

  // Handle chart interval selection
  function setupIntervalSelectors() {
    const intervalButtons = document.querySelectorAll('.interval-selector button');
    if (!intervalButtons.length) return;
    
    intervalButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Update active state
        intervalButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Get the selected interval
        const interval = button.dataset.interval;
        
        // Fetch data for the new interval
        fetchBitcoinData(interval, 100)
          .then(data => {
            renderPriceChart(data);
            renderIndicatorChart(data);
          })
          .catch(error => {
            console.error('Error updating chart interval:', error);
          });
      });
    });
  }

  // Initialize charts if elements exist
  if (priceChartElement || indicatorChartElement) {
    initPriceChart();
    setupIntervalSelectors();
  }

  // Expose public API
  window.ChartModule = {
    updateCharts: function(interval = '1h', limit = 100) {
      fetchBitcoinData(interval, limit)
        .then(data => {
          renderPriceChart(data);
          renderIndicatorChart(data);
        })
        .catch(error => {
          console.error('Error updating charts:', error);
        });
    },
    renderPriceChart: renderPriceChart,
    renderIndicatorChart: renderIndicatorChart
  };
});
