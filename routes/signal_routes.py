from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from models import db, TradingSignal
from datetime import datetime
import random

api = Blueprint('api', __name__)

@api.route('/generate_signal', methods=['POST'])
@login_required
def generate_signal():
    data = request.get_json()

    # Aqui você pode colocar a lógica real de geração de sinal
    signal_type = random.choice(['BUY', 'SELL', 'HOLD'])
    price = float(data.get('price', 0))
    confidence = round(random.uniform(0.5, 1.0), 2)
    reason = f"Mock reason for signal generation at {datetime.utcnow()}"

    # Criação do sinal
    signal = TradingSignal(
        user_id=current_user.id,
        signal_type=signal_type,
        price=price,
        confidence=confidence,
        reason=reason,
        created_at=datetime.utcnow()
    )

    db.session.add(signal)
    db.session.commit()

    return jsonify({
        'id': signal.id,
        'signal_type': signal.signal_type,
        'price': signal.price,
        'confidence': signal.confidence,
        'reason': signal.reason,
        'created_at': signal.created_at.isoformat()
    }), 201
