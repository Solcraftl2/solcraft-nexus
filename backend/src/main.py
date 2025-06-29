import os
import sys
# DON'T CHANGE THIS PATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from prometheus_flask_exporter import PrometheusMetrics
from src.config import Config

# Import models
from src.models.user import db, User
from src.models.asset import Asset, Portfolio
from src.models.transaction import Transaction

# Import routes
from src.routes.user import user_bp
from src.routes.wallet import wallet_bp
from src.routes.oauth import oauth_bp
from src.routes.tokenization import tokenization_bp
from src.routes.security import security_bp

# Import services
from src.services.oauth_service import oauth_service

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Prometheus metrics for latency and errors
    metrics = PrometheusMetrics(app)
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    oauth_service.init_app(app)
    
    # Enable CORS for all routes
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # Register blueprints
    app.register_blueprint(user_bp, url_prefix='/api/v1/users')
    app.register_blueprint(wallet_bp, url_prefix='/api/v1/wallet')
    app.register_blueprint(oauth_bp, url_prefix='/api/v1/auth/oauth')
    app.register_blueprint(tokenization_bp, url_prefix='/api/v1')
    app.register_blueprint(security_bp, url_prefix='/api/v1/security')
    
    # Create database tables
    with app.app_context():
        db.create_all()
        
        # Create default admin user if it doesn't exist
        admin_user = User.query.filter_by(email='admin@solcraft-nexus.com').first()
        if not admin_user:
            admin_user = User(
                email='admin@solcraft-nexus.com',
                first_name='Admin',
                last_name='User',
                account_type='individual',
                status='active',
                kyc_status='approved',
                email_verified=True
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()
            print("Created default admin user: admin@solcraft-nexus.com / admin123")
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'SolCraft Nexus Backend',
            'version': '1.0.0'
        })
    
    # API info endpoint
    @app.route('/api/info')
    def api_info():
        return jsonify({
            'service': 'SolCraft Nexus - Tokenization Platform',
            'version': '1.0.0',
            'description': 'Professional tokenization platform on Ripple XRP Ledger',
            'endpoints': {
                'authentication': '/api/v1/users/*',
                'oauth': '/api/v1/auth/oauth/*',
                'wallet': '/api/v1/wallet/*',
                'crypto': '/api/v1/crypto/*',
                'assets': '/api/v1/assets/*',
                'tokens': '/api/v1/tokens/*',
                'portfolio': '/api/v1/portfolio/*',
                'marketplace': '/api/v1/marketplace/*',
                'security': '/api/v1/security/*'
            },
            'features': [
                'XRP Ledger Integration',
                'Asset Tokenization',
                'Multi-Factor Authentication',
                'OAuth Social Login',
                'Secure Wallet Management',
                'Dividend Distribution',
                'Governance & Voting',
                'Multi-User Organizations',
                'Advanced Security'
            ]
        })
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)

