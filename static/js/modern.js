/**
 * NeuralTrade X - Modern Dashboard JavaScript
 * Este arquivo contém funcionalidades avançadas para a interface moderna do NeuralTrade X
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Modern UI module loaded');
    
    // Inicializar componentes da UI
    initSidebar();
    initDropdowns();
    initTooltips();
    initParticles();
    updateLivePrices();
    initAnimations();
    
    // Iniciar funções de atualização periódica
    setInterval(updateLivePrices, 30000); // Atualizar preços a cada 30 segundos
});

/**
 * Inicializa a funcionalidade da barra lateral
 */
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
    const sidebarCollapseMobile = document.getElementById('sidebarCollapseMobile');
    const mainContent = document.querySelector('.main-content');
    
    // Se os elementos não existirem, retornar (página de login)
    if (!sidebar || !mainContent) return;
    
    // Toggle do sidebar no desktop
    if (sidebarCollapseBtn) {
        sidebarCollapseBtn.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            
            // Trocar o ícone
            const icon = this.querySelector('i');
            if (icon) {
                if (sidebar.classList.contains('collapsed')) {
                    icon.classList.replace('fa-chevron-left', 'fa-chevron-right');
                } else {
                    icon.classList.replace('fa-chevron-right', 'fa-chevron-left');
                }
            }
        });
    }
    
    // Toggle do sidebar no mobile
    if (sidebarCollapseMobile) {
        sidebarCollapseMobile.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            
            // Adicionar overlay para fechar o sidebar ao clicar fora
            if (sidebar.classList.contains('active')) {
                const overlay = document.createElement('div');
                overlay.classList.add('sidebar-overlay');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.background = 'rgba(0, 0, 0, 0.5)';
                overlay.style.zIndex = '990';
                document.body.appendChild(overlay);
                
                overlay.addEventListener('click', function() {
                    sidebar.classList.remove('active');
                    this.remove();
                });
            } else {
                const overlay = document.querySelector('.sidebar-overlay');
                if (overlay) overlay.remove();
            }
        });
    }
    
    // Ajustar sidebar em telas pequenas
    const handleResize = () => {
        if (window.innerWidth < 992) {
            sidebar.classList.remove('collapsed');
            sidebar.classList.remove('active');
            const overlay = document.querySelector('.sidebar-overlay');
            if (overlay) overlay.remove();
        }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
}

/**
 * Inicializa os dropdowns personalizados
 */
function initDropdowns() {
    // Bootstrap já lida com a maior parte dos dropdowns
    // Aqui adicionamos funcionalidades extras se necessário
    
    // Fechar dropdown ao clicar em qualquer lugar
    document.addEventListener('click', function(event) {
        const dropdown = document.querySelector('.dropdown-menu.show');
        const toggle = document.querySelector('.dropdown-toggle[aria-expanded="true"]');
        
        if (dropdown && toggle && !dropdown.contains(event.target) && !toggle.contains(event.target)) {
            // Fechar manualmente se necessário (Bootstrap já faz isso na maioria dos casos)
        }
    });
    
    // Adicionar efeitos de hover aos itens do dropdown
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s';
        });
    });
}

/**
 * Inicializa tooltips para elementos com data-tooltip
 */
function initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.setAttribute('title', tooltip.getAttribute('data-tooltip'));
        // Usar o Bootstrap tooltip ou implementar manualmente
    });
}

/**
 * Inicializa animações de background com particles.js
 */
function initParticles() {
    const particlesContainer = document.getElementById('particles-js');
    if (!particlesContainer) return;
    
    // Configuração para particles.js
    try {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": "#9d4edd"
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    },
                    "polygon": {
                        "nb_sides": 5
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": true,
                    "anim": {
                        "enable": true,
                        "speed": 1,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 3,
                    "random": true,
                    "anim": {
                        "enable": false,
                        "speed": 40,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#7b2cbf",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 2,
                    "direction": "none",
                    "random": false,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": false,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "grab"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 140,
                        "line_linked": {
                            "opacity": 1
                        }
                    },
                    "bubble": {
                        "distance": 400,
                        "size": 40,
                        "duration": 2,
                        "opacity": 8,
                        "speed": 3
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4
                    },
                    "push": {
                        "particles_nb": 4
                    },
                    "remove": {
                        "particles_nb": 2
                    }
                }
            },
            "retina_detect": true
        });
    } catch (error) {
        console.warn('Particles.js não foi carregado corretamente', error);
    }
}

/**
 * Atualiza as informações de preço em tempo real
 */
function updateLivePrices() {
    const livePriceElement = document.getElementById('live-btc-price');
    const priceChangeElement = document.querySelector('.ticker-change');
    
    if (!livePriceElement) return;
    
    // Tenta obter dados da API, caso contrário usa dados simulados para demonstração
    fetchBitcoinPrice()
        .then(data => {
            if (data && data.price) {
                updatePriceDisplay(livePriceElement, priceChangeElement, data.price, data.change);
            } else {
                // Fallback para dados simulados (apenas para demonstração de UI)
                simulatePriceUpdate(livePriceElement, priceChangeElement);
            }
        })
        .catch(() => {
            // Fallback para dados simulados (apenas para demonstração de UI)
            simulatePriceUpdate(livePriceElement, priceChangeElement);
        });
}

/**
 * Tenta buscar o preço atual do Bitcoin da API
 */
function fetchBitcoinPrice() {
    return fetch('/api/bitcoin/price?interval=1h&limit=25')
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao buscar preço');
            }
            return response.json();
        })
        .then(data => {
            // Processar dados da API
            if (Array.isArray(data) && data.length > 0) {
                const lastPrice = parseFloat(data[data.length - 1].close);
                const prevPrice = parseFloat(data[data.length - 2].close);
                const change = (lastPrice - prevPrice) / prevPrice * 100;
                
                return {
                    price: lastPrice,
                    change: change
                };
            }
            throw new Error('Formato de dados inválido');
        })
        .catch(error => {
            console.error('Erro ao buscar preço do Bitcoin:', error);
            return null;
        });
}

/**
 * Simula atualizações de preço (apenas para demonstração quando API não está disponível)
 */
function simulatePriceUpdate(priceElement, changeElement) {
    const currentPrice = parseFloat(priceElement.textContent.replace(/[$,]/g, ''));
    const basePrice = currentPrice || 42987.65;
    
    // Gera uma pequena variação aleatória
    const change = (Math.random() * 2 - 1) * 0.5; // Entre -0.5% e +0.5%
    const newPrice = basePrice * (1 + change / 100);
    
    updatePriceDisplay(priceElement, changeElement, newPrice, change);
}

/**
 * Atualiza a exibição do preço na interface
 */
function updatePriceDisplay(priceElement, changeElement, price, change) {
    // Formata o preço com separador de milhares
    const formattedPrice = price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Atualiza o elemento de preço com animação
    priceElement.textContent = formattedPrice;
    priceElement.classList.add('flash');
    setTimeout(() => priceElement.classList.remove('flash'), 1000);
    
    // Atualiza a mudança percentual
    if (changeElement) {
        const changePrefix = change >= 0 ? '+' : '';
        changeElement.textContent = `${changePrefix}${change.toFixed(2)}%`;
        
        if (change >= 0) {
            changeElement.classList.remove('negative');
            changeElement.classList.add('positive');
        } else {
            changeElement.classList.remove('positive');
            changeElement.classList.add('negative');
        }
    }
}

/**
 * Inicializa animações para elementos da interface
 */
function initAnimations() {
    // Adicionar classes de animação aos elementos com seqüência
    const animatedElements = document.querySelectorAll('[data-animation]');
    
    animatedElements.forEach((element, index) => {
        const animation = element.getAttribute('data-animation');
        const delay = element.getAttribute('data-delay') || index * 0.1;
        
        element.style.animationDelay = `${delay}s`;
        element.classList.add(animation);
    });
    
    // Adicionar efeitos de hover a cards
    const cards = document.querySelectorAll('.widget-card, .stats-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 12px 25px rgba(0, 0, 0, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
}

/**
 * Inicializa componentes do TradingView se disponíveis
 */
function initTradingViewWidget() {
    const tradingViewContainer = document.getElementById('tradingview-widget');
    if (!tradingViewContainer) return;
    
    try {
        new TradingView.widget({
            "width": '100%',
            "height": '100%',
            "symbol": "BINANCE:BTCUSDT",
            "interval": "1H", // Intervalo padrão de 1 hora
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1", // Estilo de velas
            "locale": "pt",
            "toolbar_bg": "#16213e",
            "enable_publishing": false,
            "hide_side_toolbar": false,
            "allow_symbol_change": true,
            "studies": [
                "BB@tv-basicstudies",
                "MAExp@tv-basicstudies",
                "RSI@tv-basicstudies"
            ],
            "show_popup_button": true,
            "popup_width": "1000",
            "popup_height": "650",
            "container_id": "tradingview-widget",
            "save_image": true,
            "withdateranges": true,
            "hide_volume": false,
            "details": true,
            "hotlist": true,
            "calendar": true,
        });
        
        // Obter dados reais do Bitcoin para atualizar os sinais e cards
        const updateRealPrices = async () => {
            try {
                // Obter o preço atual do Bitcoin de uma API alternativa
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
                const data = await response.json();
                
                if (data && data.bitcoin) {
                    const btcPrice = data.bitcoin.usd;
                    const btcChange = data.bitcoin.usd_24h_change;
                    
                    // Atualizar todos os elementos de preço no dashboard
                    updateAllPriceElements(btcPrice, btcChange);
                }
            } catch (error) {
                console.error('Erro ao buscar preço real do Bitcoin:', error);
                // Não mostrar erro ao usuário, usar os dados de exemplo em vez disso
            }
        };
        
        // Tenta obter preços reais
        updateRealPrices();
        
        // Configurar atualização periódica
        setInterval(updateRealPrices, 60000); // Atualizar a cada minuto
        
    } catch (error) {
        console.warn('TradingView não foi inicializado', error);
        tradingViewContainer.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100"><p class="text-light">TradingView não está disponível</p></div>';
    }
}

/**
 * Atualiza todos os elementos de preço no dashboard com o preço real do Bitcoin
 */
function updateAllPriceElements(price, changePercent) {
    // Formatar preço para exibição
    const formattedPrice = price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Formatar mudança percentual
    const changePrefix = changePercent >= 0 ? '+' : '';
    const formattedChange = `${changePrefix}${changePercent.toFixed(2)}%`;
    const isPositive = changePercent >= 0;
    
    // Atualizar o preço principal do Bitcoin
    const currentPriceElement = document.getElementById('current-price');
    if (currentPriceElement) {
        currentPriceElement.textContent = formattedPrice;
        currentPriceElement.classList.add('flash');
        setTimeout(() => currentPriceElement.classList.remove('flash'), 1000);
    }
    
    // Atualizar a tendência de preço
    const trendElement = document.querySelector('.stats-trend span');
    if (trendElement) {
        trendElement.textContent = `${formattedChange} nas últimas 24h`;
        
        const trendIcon = trendElement.previousElementSibling;
        if (trendIcon) {
            if (isPositive) {
                trendIcon.classList.remove('fa-arrow-down');
                trendIcon.classList.add('fa-arrow-up');
                trendElement.parentElement.classList.remove('trend-down');
                trendElement.parentElement.classList.add('trend-up');
            } else {
                trendIcon.classList.remove('fa-arrow-up');
                trendIcon.classList.add('fa-arrow-down');
                trendElement.parentElement.classList.remove('trend-up');
                trendElement.parentElement.classList.add('trend-down');
            }
        }
    }
    
    // Atualizar os cartões de sinal com os preços reais
    updateSignalCards(price);
}

/**
 * Atualiza os cartões de sinal com preços reais do Bitcoin
 */
function updateSignalCards(currentPrice) {
    // Atualizar o cartão de sinal de compra
    const buySignalPriceElement = document.querySelector('.signal-type-buy');
    if (buySignalPriceElement) {
        // Gerar um preço ligeiramente abaixo do atual (0.5-1.5% menor)
        const buyPrice = currentPrice * (1 - (0.5 + Math.random()) / 100);
        buySignalPriceElement.innerHTML = `<i class="fas fa-arrow-up me-2"></i>COMPRAR @ $${buyPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    
    // Atualizar o cartão de sinal de venda
    const sellSignalPriceElement = document.querySelector('.signal-type-sell');
    if (sellSignalPriceElement) {
        // Gerar um preço ligeiramente acima do atual (1-3% maior)
        const sellPrice = currentPrice * (1 + (1 + Math.random() * 2) / 100);
        sellSignalPriceElement.innerHTML = `<i class="fas fa-arrow-down me-2"></i>VENDER @ $${sellPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    
    // Atualizar o preço alvo na previsão AI
    const predictionPriceElement = document.querySelector('.prediction-price');
    if (predictionPriceElement) {
        // Gerar um preço alvo baseado no preço atual (4-8% maior para previsão otimista)
        const targetPrice = currentPrice * (1 + (4 + Math.random() * 4) / 100);
        predictionPriceElement.textContent = `$${targetPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}

/**
 * Inicializa gráficos usando ApexCharts
 */
function initApexCharts() {
    // Verificar se ApexCharts está disponível
    if (typeof ApexCharts === 'undefined') return;
    
    // Exemplo: Mini gráfico de área para estatísticas
    const miniChartElements = document.querySelectorAll('.mini-chart-canvas');
    
    miniChartElements.forEach(element => {
        const chartId = element.getAttribute('id');
        const chartType = element.getAttribute('data-chart-type') || 'area';
        const chartColor = element.getAttribute('data-chart-color') || '#9d4edd';
        
        // Gerar dados aleatórios para demonstração
        const data = Array.from({length: 20}, () => Math.floor(Math.random() * 100));
        
        const options = {
            series: [{
                data: data
            }],
            chart: {
                type: chartType,
                height: 40,
                width: 100,
                sparkline: {
                    enabled: true
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                    animateGradually: {
                        enabled: true,
                        delay: 150
                    },
                    dynamicAnimation: {
                        enabled: true,
                        speed: 350
                    }
                }
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.2,
                    stops: [0, 100]
                }
            },
            colors: [chartColor],
            tooltip: {
                enabled: false
            }
        };
        
        try {
            new ApexCharts(element, options).render();
        } catch (error) {
            console.warn(`Erro ao renderizar gráfico ${chartId}:`, error);
        }
    });
}

/**
 * Handler para ações da IA (botões da interface de IA)
 */
function handleAIActions(action) {
    console.log('AI Action:', action);
    
    const aiMessageContainer = document.querySelector('.ai-message');
    const aiActionsContainer = document.querySelector('.ai-actions');
    
    if (!aiMessageContainer || !aiActionsContainer) return;
    
    // Simular resposta da IA
    aiMessageContainer.innerHTML = '<p>Analisando dados de mercado... Por favor, aguarde.</p>';
    aiActionsContainer.innerHTML = '<div class="loading-spinner" style="width: 20px; height: 20px;"></div>';
    
    // Simular atraso de processamento
    setTimeout(() => {
        switch(action) {
            case 'analyze':
                aiMessageContainer.innerHTML = `
                    <p>Análise completada! Detectei os seguintes padrões:</p>
                    <ul class="mb-0 mt-2 ps-3">
                        <li>RSI em 42.5 - Neutro</li>
                        <li>MACD cruzamento positivo</li>
                        <li>Bandas de Bollinger sugerem baixa volatilidade</li>
                    </ul>
                    <p class="mt-2 mb-0">Recomendação: <strong class="text-success">Tendência de alta com 72% de probabilidade</strong></p>
                `;
                break;
                
            case 'predict':
                aiMessageContainer.innerHTML = `
                    <p>Previsão para as próximas 24 horas:</p>
                    <p class="text-success mb-0">Preço alvo: $43,850 - $44,200 (72% confiança)</p>
                    <p class="mt-2 mb-0">Deseja ver detalhes da análise?</p>
                `;
                break;
                
            default:
                aiMessageContainer.innerHTML = '<p>Como posso ajudar você com suas análises de trading?</p>';
        }
        
        aiActionsContainer.innerHTML = `
            <button class="btn btn-sm btn-outline-primary" onclick="handleAIActions('analyze')">Analisar Mercado</button>
            <button class="btn btn-sm btn-outline-primary" onclick="handleAIActions('predict')">Prever Preço</button>
        `;
    }, 1500);
}

/**
 * Troca entre as abas de previsão
 */
function switchPredictionTab(tabId) {
    // Atualizar as classes das abas
    const tabs = document.querySelectorAll('.prediction-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.includes(tabId === 'market' ? 'Análise' : (tabId === '24h' ? '24h' : '7d'))) {
            tab.classList.add('active');
        }
    });
    
    // Atualizar o conteúdo
    const predictionSummary = document.querySelector('.prediction-summary');
    if (predictionSummary) {
        const title = predictionSummary.querySelector('h6');
        const price = predictionSummary.querySelector('.prediction-price');
        const change = predictionSummary.querySelector('.prediction-change');
        
        if (title && price && change) {
            switch(tabId) {
                case 'market':
                    title.textContent = 'Análise de Mercado';
                    price.textContent = '$45,210.00';
                    change.innerHTML = '<i class="fas fa-arrow-up"></i><span>+3.45%</span>';
                    change.className = 'prediction-change positive';
                    break;
                case '24h':
                    title.textContent = 'Preço Alvo (24h)';
                    price.textContent = '$46,875.00';
                    change.innerHTML = '<i class="fas fa-arrow-up"></i><span>+5.75%</span>';
                    change.className = 'prediction-change positive';
                    break;
                case '7d':
                    title.textContent = 'Preço Alvo (7d)';
                    price.textContent = '$48,350.00';
                    change.innerHTML = '<i class="fas fa-arrow-up"></i><span>+9.12%</span>';
                    change.className = 'prediction-change positive';
                    break;
            }
        }
    }
    
    // Atualizar os fatores se necessário
    const factorsContainer = document.querySelector('.prediction-factors');
    if (factorsContainer && tabId === '7d') {
        // Talvez adicionar mais fatores para a previsão de 7 dias
    }
}

/**
 * Gera um novo sinal de trading baseado em IA
 */
function generateAISignal() {
    // Mostrar loading no botão
    const generateBtn = document.getElementById('generate-signal-btn');
    if (!generateBtn) return;
    
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<div class="spinner-border spinner-border-sm me-2" role="status"></div>Gerando sinal...';
    generateBtn.disabled = true;
    
    // Simular requisição à API
    setTimeout(() => {
        // Atualizar o container de sinais com um novo sinal
        const signalsContainer = document.getElementById('latest-signals');
        if (signalsContainer) {
            // Criar elemento para novo sinal
            const newSignal = document.createElement('div');
            newSignal.className = 'signal-card';
            
            // Gerar sinal baseado nos dados atuais
            const currentPrice = document.getElementById('current-price');
            const price = currentPrice ? parseFloat(currentPrice.textContent.replace(/[$,]/g, '')) : 43000;
            
            // Ação do sinal (compra ou venda) baseada em RSI e outros fatores
            const isLowRSI = Math.random() > 0.5; // Simulação - na realidade seria baseado em dados reais
            const signalType = isLowRSI ? 'buy' : 'sell';
            const targetPrice = isLowRSI ? price * 0.995 : price * 1.005;
            
            newSignal.innerHTML = `
                <div class="signal-header">
                    <div class="signal-type signal-type-${signalType}">
                        <i class="fas fa-arrow-${isLowRSI ? 'up' : 'down'} me-2"></i>
                        ${isLowRSI ? 'COMPRAR' : 'VENDER'} @ $${targetPrice.toFixed(2)}
                    </div>
                    <div class="signal-confidence confidence-high">
                        ${Math.floor(80 + Math.random() * 10)}% Confiança
                    </div>
                </div>
                <div class="signal-body">
                    <div class="signal-reason">
                        <p class="mb-2">${isLowRSI ? 'Oportunidade de compra baseada em RSI sobrevendido e suporte identificado.' : 'Sinal de venda: RSI em região de sobrecompra com resistência detectada.'}</p>
                    </div>
                    <div class="signal-indicators">
                        <div class="indicator-chip">
                            <div class="indicator-icon icon-${isLowRSI ? 'bullish' : 'bearish'}">
                                <i class="fas fa-wave-square"></i>
                            </div>
                            <span>RSI: ${isLowRSI ? '30.6' : '72.3'}</span>
                        </div>
                        <div class="indicator-chip">
                            <div class="indicator-icon icon-${isLowRSI ? 'bullish' : 'bearish'}">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <span>${isLowRSI ? 'MACD Crossover' : 'Double Top'}</span>
                        </div>
                    </div>
                </div>
                <div class="signal-footer">
                    <div class="signal-meta">
                        <i class="far fa-clock"></i>
                        <span>Gerado agora</span>
                    </div>
                    <div class="signal-actions">
                        <a href="/paper_trading?signal=${signalType}" class="btn btn-sm btn-outline-${isLowRSI ? 'success' : 'danger'}">
                            <i class="fas fa-file-invoice-dollar me-1"></i>Paper Trade
                        </a>
                        <button class="btn btn-sm btn-outline-primary" onclick="showSignalDetails(this)">
                            <i class="fas fa-info-circle me-1"></i>Detalhes
                        </button>
                    </div>
                </div>
            `;
            
            // Adicionar o novo sinal ao topo
            if (signalsContainer.firstChild) {
                signalsContainer.insertBefore(newSignal, signalsContainer.firstChild);
            } else {
                signalsContainer.appendChild(newSignal);
            }
            
            // Remover o sinal mais antigo se houver mais de 3
            const signals = signalsContainer.querySelectorAll('.signal-card');
            if (signals.length > 3) {
                signalsContainer.removeChild(signals[signals.length - 1]);
            }
            
            // Atualizar contador de sinais
            const signalBadge = document.querySelector('.card-header .badge');
            if (signalBadge) {
                signalBadge.textContent = '1 Novo';
                signalBadge.classList.add('pulse-animation');
                
                // Remover animação após 3 segundos
                setTimeout(() => {
                    signalBadge.classList.remove('pulse-animation');
                }, 3000);
            }
            
            // Notificar o usuário
            showNotification('Novo sinal gerado com sucesso!', 'success');
        }
        
        // Restaurar botão
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }, 2000);
}

/**
 * Exibe detalhes do sinal em um modal
 */
function showSignalDetails(button) {
    // Obter o card do sinal
    const signalCard = button.closest('.signal-card');
    if (!signalCard) return;
    
    // Obter dados do sinal
    const signalType = signalCard.querySelector('.signal-type').textContent.trim();
    const confidence = signalCard.querySelector('.signal-confidence').textContent.trim();
    const reason = signalCard.querySelector('.signal-reason p').textContent.trim();
    
    // Verificar se o modal já existe ou criar um novo
    let modal = document.getElementById('signalDetailModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'signalDetailModal';
        modal.tabIndex = '-1';
        modal.setAttribute('aria-labelledby', 'signalDetailModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-dark">
                    <div class="modal-header">
                        <h5 class="modal-title" id="signalDetailModalLabel">Detalhes do Sinal</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="signal-detail-content">
                            <!-- Conteúdo será preenchido via JavaScript -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        <a href="/paper_trading" class="btn btn-primary">Paper Trade</a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Atualizar conteúdo do modal
    const contentContainer = modal.querySelector('.signal-detail-content');
    if (contentContainer) {
        contentContainer.innerHTML = `
            <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4>${signalType}</h4>
                    <span class="badge bg-primary">${confidence}</span>
                </div>
                <p class="text-white">${reason}</p>
            </div>
            
            <div class="mb-4">
                <h5 class="text-white mb-3">Análise Técnica</h5>
                <div class="technical-indicators">
                    ${Array.from(signalCard.querySelectorAll('.indicator-chip')).map(chip => {
                        return `<div class="indicator-detail mb-2">
                            <h6 class="text-white">${chip.querySelector('span').textContent}</h6>
                            <p>Indicador técnico que ${chip.querySelector('.icon-bullish') ? 'sugere uma tendência de alta' : 'aponta para possível queda'}.</p>
                        </div>`;
                    }).join('')}
                </div>
            </div>
            
            <div>
                <h5 class="text-white mb-3">Recomendação</h5>
                <p class="text-white">Este sinal tem uma confiança ${confidence} e é baseado em múltiplos indicadores técnicos. Considere usar Paper Trading para testar a estratégia antes de aplicar capital real.</p>
            </div>
        `;
    }
    
    // Atualizar link do botão de Paper Trading
    const paperTradeBtn = modal.querySelector('.modal-footer .btn-primary');
    if (paperTradeBtn) {
        const signalTypeValue = signalType.includes('COMPRAR') ? 'buy' : 'sell';
        paperTradeBtn.href = `/paper_trading?signal=${signalTypeValue}`;
    }
    
    // Mostrar o modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

/**
 * Abre o gerenciador de modelos de IA
 */
function openModelManager() {
    const modal = document.getElementById('modelManagerModal');
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

/**
 * Mostra uma notificação na interface
 */
function showNotification(message, type = 'info') {
    // Verificar se o container de notificações existe
    let container = document.querySelector('.notifications-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notifications-container';
        document.body.appendChild(container);
        
        // Estilizar o container
        container.style.position = 'fixed';
        container.style.top = '80px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.maxWidth = '350px';
    }
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} notification-icon"></i>
            <p>${message}</p>
        </div>
        <button class="notification-close" onclick="this.parentNode.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Estilizar notificação
    notification.style.backgroundColor = '#16213e';
    notification.style.color = '#fff';
    notification.style.padding = '15px';
    notification.style.borderRadius = '10px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    notification.style.display = 'flex';
    notification.style.justifyContent = 'space-between';
    notification.style.alignItems = 'center';
    notification.style.borderLeft = `4px solid ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'}`;
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(50px)';
    notification.style.transition = 'all 0.3s ease-out';
    
    // Adicionar ao container
    container.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(50px)';
        
        // Remover do DOM após a animação
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Exportar funções para uso global
window.handleAIActions = handleAIActions;
window.initTradingViewWidget = initTradingViewWidget;
window.initApexCharts = initApexCharts;
window.switchPredictionTab = switchPredictionTab;
window.generateAISignal = generateAISignal;
window.showSignalDetails = showSignalDetails;
window.openModelManager = openModelManager;