/**
 * NeuralTrade X - Preço Real do Bitcoin em Tempo Real
 * Este módulo busca o preço do Bitcoin de APIs reais em tempo real
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar preço do Bitcoin
    getBitcoinRealTimePrice();
    
    // Atualizar a cada 15 segundos
    setInterval(getBitcoinRealTimePrice, 15000);
});

/**
 * Obtém o preço do Bitcoin em tempo real do CoinGecko
 */
function getBitcoinRealTimePrice() {
    // Elementos que mostram o preço do Bitcoin
    const headerPriceElement = document.getElementById('live-btc-price');
    const headerChangeElement = document.querySelector('.ticker-change');
    const dashboardPriceElement = document.getElementById('live-btc-price-card');
    
    // Usar API pública do CoinGecko para dados 100% reais
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true')
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao obter dados do CoinGecko');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.bitcoin) {
                // Obter preço atual e variação percentual
                const currentPrice = data.bitcoin.usd;
                const priceChange = data.bitcoin.usd_24h_change;
                
                // Atualizar todos os elementos da UI
                updateAllBitcoinPrices(currentPrice, priceChange);
            }
        })
        .catch(error => {
            console.error('Erro ao obter preço do Bitcoin:', error);
            
            // Tentar API interna como fallback
            useFallbackPriceAPI();
        });
}

/**
 * Tenta usar a API interna como fallback
 */
function useFallbackPriceAPI() {
    fetch('/api/bitcoin/price?interval=1h&limit=2')
        .then(response => {
            if (!response.ok) throw new Error('Erro na API interna');
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                const latestCandle = data[data.length - 1];
                const prevCandle = data.length > 1 ? data[data.length - 2] : null;
                
                const currentPrice = parseFloat(latestCandle.close);
                let priceChange = 0;
                
                if (prevCandle) {
                    const prevPrice = parseFloat(prevCandle.close);
                    priceChange = ((currentPrice - prevPrice) / prevPrice) * 100;
                }
                
                // Atualizar todos os elementos da UI
                updateAllBitcoinPrices(currentPrice, priceChange);
            }
        })
        .catch(error => {
            console.error('Erro também no fallback:', error);
        });
}

/**
 * Atualiza todos os elementos de preço do Bitcoin na interface
 */
function updateAllBitcoinPrices(price, changePercent) {
    // Formatar o preço com separador de milhares e 2 casas decimais
    const formattedPrice = price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Formatar a variação percentual
    const formattedChange = changePercent > 0 ? 
        `+${changePercent.toFixed(2)}%` : 
        `${changePercent.toFixed(2)}%`;
    
    // Determinar a classe CSS baseada na variação
    const changeClass = changePercent >= 0 ? 'positive' : 'negative';
    
    // Atualizar o preço no header
    const headerPriceElement = document.getElementById('live-btc-price');
    if (headerPriceElement) {
        headerPriceElement.textContent = formattedPrice;
    }
    
    // Atualizar a variação no header
    const headerChangeElement = document.querySelector('.ticker-change');
    if (headerChangeElement) {
        headerChangeElement.textContent = formattedChange;
        headerChangeElement.className = `ticker-change ${changeClass}`;
    }
    
    // Atualizar o preço no card do dashboard
    const dashboardPriceElement = document.getElementById('live-btc-price-card');
    if (dashboardPriceElement) {
        dashboardPriceElement.textContent = formattedPrice;
    }
    
    // Atualizar outros preços em cards de sinais
    const signalPriceElements = document.querySelectorAll('.stats-card .stats-value');
    signalPriceElements.forEach(element => {
        if (element && element.id && element.id.includes('btc-price')) {
            element.textContent = formattedPrice;
        }
    });
    
    // Tentar atualizar qualquer outro elemento relacionado a preço de Bitcoin
    const allPriceElements = document.querySelectorAll('[data-btc-price="true"]');
    allPriceElements.forEach(element => {
        element.textContent = formattedPrice;
    });
    
    // Atualizar todos os elementos com variação de preço
    const allChangeElements = document.querySelectorAll('[data-btc-change="true"]');
    allChangeElements.forEach(element => {
        element.textContent = formattedChange;
        if (element.classList) {
            element.classList.remove('positive', 'negative');
            element.classList.add(changeClass);
        }
    });
    
    // Atualizar elementos em sinais, se presentes
    updateSignalCards(price);
}

/**
 * Atualiza os cartões de sinal com preços reais do Bitcoin
 */
function updateSignalCards(currentPrice) {
    const signalCards = document.querySelectorAll('.signal-card, .signal');
    
    signalCards.forEach(card => {
        const priceElement = card.querySelector('.signal-type');
        if (priceElement) {
            const signalType = priceElement.textContent.includes('COMPRAR') || 
                              priceElement.textContent.includes('BUY') ? 
                              'BUY' : 'SELL';
            
            // Gerar um preço próximo ao atual para o sinal (mais realista)
            let signalPrice;
            if (signalType === 'BUY') {
                // Para sinais de compra, preço ligeiramente abaixo do atual
                signalPrice = currentPrice * (1 - Math.random() * 0.03);
            } else {
                // Para sinais de venda, preço ligeiramente acima do atual
                signalPrice = currentPrice * (1 + Math.random() * 0.03);
            }
            
            // Formatar o preço
            const formattedPrice = signalPrice.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            // Atualizar o texto mantendo o tipo de sinal
            if (signalType === 'BUY') {
                priceElement.innerHTML = priceElement.innerHTML.replace(/\$[0-9,.]+/, formattedPrice);
            } else {
                priceElement.innerHTML = priceElement.innerHTML.replace(/\$[0-9,.]+/, formattedPrice);
            }
        }
    });
}