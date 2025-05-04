import os
import logging
from datetime import datetime
from flask import Flask, render_template, redirect, url_for, request, flash, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_cors import CORS
from models import User, TradingStrategy, BacktestResult, TradingSignal, PaperTrade
from database import init_db, db  # Usa seu database.py


# Configure logging
logging.basicConfig(level=logging.DEBUG)


# Create the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Register custom filters
@app.template_filter('humanize')
def humanize_time(dt, default="just now"):
    if not dt:
        return default
    now = datetime.utcnow()
    diff = now - dt
    seconds = diff.total_seconds()
    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif seconds < 604800:
        days = int(seconds / 86400)
        return f"{days} day{'s' if days > 1 else ''} ago"
    else:
        return dt.strftime('%Y-%m-%d')

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///neuraltrade.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize extensions
db.init_app(app)
CORS(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Import models after db initialization
from models import User, TradingStrategy, BacktestResult, TradingSignal

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create database tables
with app.app_context():
    db.create_all()

# Import utility modules
from utils.technical_indicators import get_technical_indicators
from utils.binance_api import get_bitcoin_data, get_account_info
from utils.prediction_model import predict_price
from utils.backtesting import run_backtest

# Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user, remember=True)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password', 'danger')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        user_exists = User.query.filter_by(email=email).first()
        username_exists = User.query.filter_by(username=username).first()
        if user_exists:
            flash('Email already exists', 'danger')
        elif username_exists:
            flash('Username already exists', 'danger')
        else:
            hashed_password = generate_password_hash(password)
            new_user = User(username=username, email=email, password_hash=hashed_password)
            db.session.add(new_user)
            db.session.commit()
            flash('Account created successfully!', 'success')
            return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/signals')
@login_required
def signals():
    user_signals = TradingSignal.query.filter_by(user_id=current_user.id).order_by(TradingSignal.created_at.desc()).limit(10).all()
    return render_template('signals.html', signals=user_signals)

@app.route('/backtest')
@login_required
def backtest():
    strategies = TradingStrategy.query.filter_by(user_id=current_user.id).all()
    backtest_results = BacktestResult.query.filter_by(user_id=current_user.id).order_by(BacktestResult.created_at.desc()).limit(5).all()
    return render_template('backtest.html', strategies=strategies, results=backtest_results)

@app.route('/paper_trading')
@login_required
def paper_trading():
    return render_template('paper_trading.html')

@app.route('/settings')
@login_required
def settings():
    return render_template('settings.html')

@app.route('/ai_predictions')
@login_required
def ai_predictions():
    return render_template('ai_predictions.html')

@app.route('/technical_analysis')
@login_required
def technical_analysis():
    return render_template('technical_analysis.html')

@app.route('/api/bitcoin/price', methods=['GET'])
@login_required
def get_bitcoin_price():
    interval = request.args.get('interval', '1h')
    limit = int(request.args.get('limit', 100))
    try:
        data = get_bitcoin_data(interval, limit)
        return jsonify(data)
    except Exception as e:
        logging.error(f"Error fetching Bitcoin data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/indicators', methods=['GET'])
@login_required
def technical_indicators():
    interval = request.args.get('interval', '1h')
    limit = int(request.args.get('limit', 100))
    try:
        data = get_bitcoin_data(interval, limit)
        indicators = get_technical_indicators(data)
        return jsonify(indicators)
    except Exception as e:
        logging.error(f"Error calculating technical indicators: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict', methods=['GET'])
@login_required
def predict():
    interval = request.args.get('interval', '1h')
    periods = int(request.args.get('periods', 24))
    try:
        data = get_bitcoin_data(interval, 500)
        prediction = predict_price(data, periods)
        return jsonify(prediction)
    except Exception as e:
        logging.error(f"Error generating prediction: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/backtest', methods=['POST'])
@login_required
def api_backtest():
    data = request.json
    strategy_id = data.get('strategy_id')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    try:
        strategy = TradingStrategy.query.filter_by(id=strategy_id, user_id=current_user.id).first()
        if not strategy:
            return jsonify({"error": "Strategy not found"}), 404
        result = run_backtest(strategy, start_date, end_date)
        backtest_result = BacktestResult(
            user_id=current_user.id,
            strategy_id=strategy_id,
            start_date=datetime.strptime(start_date, '%Y-%m-%d'),
            end_date=datetime.strptime(end_date, '%Y-%m-%d'),
            profit_loss=result['profit_loss'],
            win_rate=result['win_rate'],
            total_trades=result['total_trades'],
            result_data=str(result)
        )
        db.session.add(backtest_result)
        db.session.commit()
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error running backtest: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/strategies', methods=['GET', 'POST'])
@login_required
def strategies():
    if request.method == 'GET':
        user_strategies = TradingStrategy.query.filter_by(user_id=current_user.id).all()
        return jsonify([{
            'id': s.id,
            'name': s.name,
            'description': s.description,
            'parameters': s.parameters
        } for s in user_strategies])
    else:
        data = request.json
        strategy = TradingStrategy(
            user_id=current_user.id,
            name=data.get('name'),
            description=data.get('description'),
            parameters=data.get('parameters')
        )
        db.session.add(strategy)
        db.session.commit()
        return jsonify({
            'id': strategy.id,
            'name': strategy.name,
            'description': strategy.description,
            'parameters': strategy.parameters
        }), 201

@app.route('/api/signals/generate', methods=['POST'])
@login_required
def generate_signals():
    try:
        data = get_bitcoin_data('1h', 100)
        indicators = get_technical_indicators(data)
        last_price = float(data[-1]['close'])
        rsi = indicators['rsi'][-1]
        macd = indicators['macd'][-1]
        signal = indicators['macd_signal'][-1]
        signal_type = None
        reason = []
        if rsi < 30:
            reason.append("RSI oversold")
            signal_type = "BUY"
        elif rsi > 70:
            reason.append("RSI overbought")
            signal_type = "SELL"
        if macd > signal and macd > 0:
            reason.append("MACD bullish crossover")
            signal_type = "BUY"
        elif macd < signal and macd < 0:
            reason.append("MACD bearish crossover")
            signal_type = "SELL"
        if signal_type:
            new_signal = TradingSignal(
                user_id=current_user.id,
                signal_type=signal_type,
                price=last_price,
                confidence=0.75,
                reason=', '.join(reason)
            )
            db.session.add(new_signal)
            db.session.commit()
            return jsonify({
                'id': new_signal.id,
                'signal_type': new_signal.signal_type,
                'price': new_signal.price,
                'confidence': new_signal.confidence,
                'reason': new_signal.reason,
                'created_at': new_signal.created_at.isoformat()
            })
        else:
            return jsonify({'message': 'No significant signals detected at this time'})
    except Exception as e:
        logging.error(f"Error generating signals: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Run the Flask application
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)