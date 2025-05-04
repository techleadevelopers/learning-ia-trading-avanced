from datetime import datetime
from database import db
from flask_login import UserMixin
import json
import ta  # Biblioteca para indicadores técnicos (pip install ta)
import pandas as pd

# Removendo a inicialização do Flask daqui
# app = Flask(__name__) # Removido

class User(UserMixin, db.Model):
    __tablename__ = 'users' #Adicionado nome da tabela
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    api_key = db.Column(db.String(256))
    api_secret = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    strategies = db.relationship('TradingStrategy', backref='user', lazy=True)
    signals = db.relationship('TradingSignal', backref='user', lazy=True)
    backtest_results = db.relationship('BacktestResult', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'

class TradingStrategy(db.Model):
    __tablename__ = 'trading_strategies' #Adicionado nome da tabela
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) #Alterado para users.id
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    parameters = db.Column(db.Text, nullable=False)  # JSON string of strategy parameters
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    backtest_results = db.relationship('BacktestResult', backref='strategy', lazy=True)

    def __repr__(self):
        return f'<Strategy {self.name}>'

class BacktestResult(db.Model):
    __tablename__ = 'backtest_results' #Adicionado nome da tabela
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) #Alterado para users.id
    strategy_id = db.Column(db.Integer, db.ForeignKey('trading_strategies.id'), nullable=False) #Alterado para trading_strategies.id
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    profit_loss = db.Column(db.Float, nullable=False)
    win_rate = db.Column(db.Float)
    total_trades = db.Column(db.Integer)
    result_data = db.Column(db.Text)  # JSON string of detailed backtest results
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<BacktestResult {self.id} - PL: {self.profit_loss}>'

class TradingSignal(db.Model):
    __tablename__ = 'trading_signals' #Adicionado nome da tabela
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) #Alterado para users.id
    signal_type = db.Column(db.String(10), nullable=False)  # BUY, SELL, HOLD
    price = db.Column(db.Float, nullable=False)
    confidence = db.Column(db.Float)  # 0.0 to 1.0 confidence score
    reason = db.Column(db.Text)  # Explanation for the signal
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Signal {self.id} - {self.signal_type} at {self.price}>'

class PaperTrade(db.Model):
    __tablename__ = 'paper_trades' #Adicionado nome da tabela
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) #Alterado para users.id
    signal_id = db.Column(db.Integer, db.ForeignKey('trading_signals.id')) #Alterado para trading_signals.id
    trade_type = db.Column(db.String(10), nullable=False)  # BUY, SELL
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='OPEN')  # OPEN, CLOSED
    close_price = db.Column(db.Float)
    profit_loss = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime)

    # Relationship
    signal = db.relationship('TradingSignal', backref='paper_trades', lazy=True)

    def __repr__(self):
        return f'<PaperTrade {self.id} - {self.trade_type} at {self.price}>'

class AdvancedAnalyzer:
    def __init__(self):
        pass

    def analyze(self, market_data: pd.DataFrame, strategy_parameters: dict):
        """
        Executa a análise avançada com base nos dados de mercado e parâmetros da estratégia.

        Args:
            market_data (pd.DataFrame): DataFrame com dados de preço (Open, High, Low, Close, Volume) e timestamps.
            strategy_parameters (dict): Dicionário contendo os parâmetros da estratégia (carregado do JSON).

        Returns:
            dict: Um dicionário contendo os resultados da análise (sinais brutos, confiança, razão).
        """
        analysis_results = {}

        # 1. Calcular Indicadores Técnicos
        technical_signals = self._calculate_technical_indicators(market_data, strategy_parameters.get('technical_indicators', []))
        analysis_results.update(technical_signals)

        # 2. Identificar Padrões de Candle
        candle_signals = self._identify_candle_patterns(market_data, strategy_parameters.get('candle_patterns', []))
        analysis_results.update(candle_signals)

        # 3. Analisar Sentimento (se habilitado)
        if strategy_parameters.get('sentiment_analysis', {}).get('enabled'):
            sentiment_signal = self._analyze_sentiment(strategy_parameters.get('sentiment_analysis', {}))
            if sentiment_signal:
                analysis_results['sentiment'] = sentiment_signal

        # 4. Analisar Dados On-Chain (se habilitado e para BTC)
        if strategy_parameters.get('on_chain_analysis', {}).get('enabled'):
            onchain_signal = self._analyze_on_chain(strategy_parameters.get('on_chain_analysis', {}))
            if onchain_signal:
                analysis_results['on_chain'] = onchain_signal

        # 5. Combinar e Ponderar Sinais
        final_signal, confidence, reason = self._combine_signals(analysis_results, strategy_parameters.get('signal_combination_rules', []), strategy_parameters.get('confluence_threshold', 0.5))

        return {"signal_type": final_signal, "confidence": confidence, "reason": reason, "raw_signals": analysis_results}

    def _calculate_technical_indicators(self, market_data: pd.DataFrame, indicators_config: list) -> dict:
        """Calcula os indicadores técnicos configurados."""
        signals = {}
        for indicator_config in indicators_config:
            name = indicator_config.get('name')
            params = {k: v for k, v in indicator_config.items() if k not in ['name']}
            try:
                if hasattr(ta.trend, f'{name}_indicator'): #utilizado _indicator
                    indicator_class = getattr(ta.trend, f'{name}_indicator') #utilizado _indicator
                    indicator = indicator_class(market_data['high'], market_data['low'], market_data['close'], **params) # Corrigido para minúsculas
                    signals[f'technical_{name}'] = indicator.trend().iloc[-1] #utilizado trend()
                    # Adicione lógica para interpretar o valor do indicador como um sinal (BUY/SELL)
                    signals[f'signal_technical_{name}'] = self._interpret_technical_signal(name, signals[f'technical_{name}'], params)
                elif hasattr(ta.momentum, f'{name}_indicator'): #utilizado _indicator
                    indicator_class = getattr(ta.momentum, f'{name}_indicator') #utilizado _indicator
                    indicator = indicator_class(market_data['close'], **params) # Corrigido para minúsculas
                    signals[f'momentum_{name}'] = indicator.momentum().iloc[-1] #utilizado momentum()
                    signals[f'signal_momentum_{name}'] = self._interpret_technical_signal(name, signals[f'momentum_{name}'], params)
                elif hasattr(ta.volume, f'{name}_indicator'): #utilizado _indicator
                    indicator_class = getattr(ta.volume, f'{name}_indicator') #utilizado _indicator
                    indicator = indicator_class(market_data['close'], market_data['volume'], **params) # Corrigido para minúsculas
                    signals[f'volume_{name}'] = indicator.volume().iloc[-1] #utilizado volume()
                    signals[f'signal_volume_{name}'] = self._interpret_technical_signal(name, signals[f'volume_name'], params)
                elif hasattr(ta.volatility, f'{name}_indicator'): #utilizado _indicator
                    indicator_class = getattr(ta.volatility, f'{name}_indicator') #utilizado _indicator
                    indicator = indicator_class(market_data['high'], market_data['low'], market_data['close'], **params) #Corrigido para maiúsculas
                    signals[f'volatility_{name}'] = indicator.volatility().iloc[-1] #utilizado volatility()
                    signals[f'signal_volatility_{name}'] = self._interpret_technical_signal(name, signals[f'volatility_{name}'], params)
            except AttributeError:
                print(f"Indicador técnico '{name}' não encontrado na biblioteca 'ta'.")
            except Exception as e:
                print(f"Erro ao calcular indicador '{name}': {e}")
        return signals

    def _interpret_technical_signal(self, indicator_name: str, value: float, params: dict) -> str:
        """Interpreta o valor de um indicador técnico para gerar um sinal (BUY, SELL, HOLD)."""
        if indicator_name == 'rsi':
            if value > params.get('overbought', 70):
                return 'SELL'
            elif value < params.get('oversold', 30):
                return 'BUY'
        elif indicator_name == 'macd':
            # Precisa acessar a linha MACD e a linha de sinal
            pass  # Implementar lógica de cruzamentos
        # Adicione interpretações para outros indicadores
        return 'HOLD'

    def _identify_candle_patterns(self, market_data: pd.DataFrame, patterns_config: list) -> dict:
        """Identifica os padrões de candle configurados."""
        signals = {}
        for pattern in patterns_config:
            try:
                pattern_function = getattr(ta.patterns, pattern)
                result = pattern_function(market_data['open'], market_data['high'], market_data['low'], market_data['close']) #Corrigido para minusculas
                if result.iloc[-1]:
                    signals[f'candle_{pattern}'] = True
                    signals[f'signal_candle_{pattern}'] = self._interpret_candle_signal(pattern)
            except AttributeError:
                print(f"Padrão de candle '{pattern}' não encontrado na biblioteca 'ta'.")
            except Exception as e:
                print(f"Erro ao identificar padrão '{pattern}': {e}")
        return signals

    def _interpret_candle_signal(self, pattern_name: str) -> str:
        """Interpreta um padrão de candle para gerar um sinal."""
        if 'BULLISH' in pattern_name.upper(): #Corrigido para maiusculas
            return 'BUY'
        elif 'BEARISH' in pattern_name.upper(): #Corrigido para maiusculas
            return 'SELL'
        return 'HOLD'

    def _analyze_sentiment(self, sentiment_config: dict) -> str:
        """Analisa o sentimento (requer integração com uma biblioteca ou API de análise de sentimento)."""
        # Implementar lógica para buscar e analisar dados de sentimento
        # Retornar um sinal baseado no sentimento (ex: 'BULLISH_SENTIMENT', 'BEARISH_SENTIMENT')
        return None

    def _analyze_on_chain(self, onchain_config: dict) -> str:
        """Analisa dados on-chain (requer integração com uma API de dados on-chain)."""
        # Implementar lógica para buscar e analisar dados on-chain
        # Retornar um sinal baseado nos dados on-chain
        return None

    def _combine_signals(self, raw_signals: dict, combination_rules: list, confluence_threshold: float) -> tuple[str, float, str]:
        """Combina os sinais brutos usando as regras definidas e calcula a confiança."""
        weighted_signals = {}
        reason_parts = []

        for rule in combination_rules:
            condition = rule.get('condition')
            signal = rule.get('signal')
            weight = rule.get('weight', 1.0)

            if self._evaluate_condition(condition, raw_signals):
                weighted_signals.setdefault(signal, 0)
                weighted_signals[signal] += weight
                reason_parts.append(f"Regra '{condition}' -> '{signal}' ({weight})")

        if not weighted_signals:
            return 'HOLD', 0.0, "Nenhuma regra de combinação satisfeita."

        # Determinar o sinal predominante com base nos pesos
        final_signal = max(weighted_signals, key=weighted_signals.get)
        total_weight = sum(weighted_signals.values())
        confidence = weighted_signals[final_signal] / total_weight if total_weight > 0 else 0.0
        reason = ", ".join(reason_parts)

        return final_signal, confidence, reason

    def _evaluate_condition(self, condition: str, signals: dict) -> bool:
        """Avalia uma condição lógica usando os sinais brutos."""
        # Implementar um parser simples para avaliar a string de condição
        # Exemplo: "RSI > 70 AND MACD_CROSS_OVER_SIGNAL"
        # Isso exigirá um pouco de lógica para interpretar os nomes dos sinais e os operadores
        # Uma abordagem mais robusta seria usar uma biblioteca de avaliação de expressões
        try:
            # Uma implementação muito básica e limitada:
            parts = condition.split()
            op = None
            left_operand = None
            right_operand = None
            current_result = True

            i = 0
            while i < len(parts):
                part = parts[i]
                if part in signals:
                    operand_value = signals.get(part)
                    # Precisa de lógica mais inteligente para comparar valores
                    if left_operand is None:
                        left_operand = operand_value
                    else:
                        right_operand = operand_value
                elif part in ['>', '<', '>=', '<=', '==']:
                    op = part
                elif part.upper() == 'AND':
                    current_result = current_result and self._perform_comparison(left_operand, op, right_operand)
                    left_operand = None
                    op = None
                    right_operand = None
                elif part.upper() == 'OR':
                    current_result = current_result or self._perform_comparison(left_operand, op, right_operand)
                    left_operand = None
                    op = None
                    right_operand = None
                i += 1

            if op and left_operand is not None and right_operand is not None:
                current_result = current_result and self._perform_comparison(left_operand, op, right_operand)

            return current_result
        except Exception as e:
            print(f"Erro ao avaliar condição '{condition}': {e}")
            return False

    def _perform_comparison(self, val1, op, val2):
        if op == '>':
            return val1 > val2
        elif op == '<':
            return val1 < val2
        elif op == '>=':
            return val1 >= val2
        elif op == '<=':
            return val1 <= val2
        elif op == '==':
            return val1 == val2
        return False

def generate_trading_signal(user_id: int, strategy_id: int, market_data: pd.DataFrame):
    """Gera um sinal de trading para um usuário e estratégia específicos."""
    strategy = TradingStrategy.query.get(strategy_id)
    if not strategy:
        print(f"Estratégia com ID {strategy_id} não encontrada.")
        return None

    try:
        strategy_parameters = json.loads(strategy.parameters)
    except json.JSONDecodeError:
        print(f"Erro ao decodificar os parâmetros JSON da estratégia {strategy_id}.")
        return None

    analyzer = AdvancedAnalyzer()
    analysis_result = analyzer.analyze(market_data, strategy_parameters)

    if analysis_result:
        signal = TradingSignal(
            user_id=user_id,
            signal_type=analysis_result['signal_type'],
            price=market_data['close'].iloc[-1] if not market_data.empty else 0.0,  # Pegar o preço mais recente
            confidence=analysis_result['confidence'],
            reason=analysis_result['reason']
        )
        db.session.add(signal)
        db.session.commit()
        return signal
    else:
        return None
