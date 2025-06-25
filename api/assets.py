from flask import Flask, request, jsonify
import json
import jwt
import datetime
import os

app = Flask(__name__)

JWT_SECRET = os.environ.get('JWT_SECRET', 'solcraft-nexus-secret-key-2024')

# In-memory storage (in production use database)
ASSETS_STORAGE = []
USER_ASSETS = {}

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError('Token scaduto')
    except jwt.InvalidTokenError:
        raise ValueError('Token non valido')

def get_user_from_request():
    """Extract user from Authorization header"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        raise ValueError('Token di autorizzazione richiesto')
    
    token = auth_header.replace('Bearer ', '')
    return verify_token(token)

@app.route('/api/assets', methods=['GET', 'OPTIONS'])
def get_assets():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    try:
        # Get query parameters
        category = request.args.get('category', '')
        search = request.args.get('search', '')
        
        # Filter assets
        filtered_assets = ASSETS_STORAGE.copy()
        
        if category and category != 'all':
            filtered_assets = [a for a in filtered_assets if a.get('category', '').lower() == category.lower()]
        
        if search:
            search_lower = search.lower()
            filtered_assets = [a for a in filtered_assets if 
                             search_lower in a.get('name', '').lower() or 
                             search_lower in a.get('description', '').lower()]
        
        response_data = {
            'success': True,
            'assets': filtered_assets,
            'total': len(filtered_assets)
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_response = {
            'success': False,
            'error': str(e),
            'message': 'Errore caricamento asset'
        }
        response = jsonify(error_response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.status_code = 400
        return response

@app.route('/api/assets/<asset_id>', methods=['GET', 'OPTIONS'])
def get_asset_details(asset_id):
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    try:
        # Find asset
        asset = next((a for a in ASSETS_STORAGE if a['id'] == asset_id), None)
        
        if not asset:
            raise ValueError('Asset non trovato')
        
        response_data = {
            'success': True,
            'asset': asset
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_response = {
            'success': False,
            'error': str(e),
            'message': 'Errore caricamento dettagli asset'
        }
        response = jsonify(error_response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.status_code = 400
        return response

@app.route('/api/assets/<asset_id>/invest', methods=['POST', 'OPTIONS'])
def invest_in_asset(asset_id):
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    try:
        # Verify user authentication
        user = get_user_from_request()
        
        # Get request data
        data = request.get_json() or {}
        amount = float(data.get('amount', 0))
        
        if amount <= 0:
            raise ValueError('Importo investimento deve essere maggiore di 0')
        
        # Find asset
        asset = next((a for a in ASSETS_STORAGE if a['id'] == asset_id), None)
        if not asset:
            raise ValueError('Asset non trovato')
        
        # Create investment record
        investment = {
            'id': f'inv_{len(USER_ASSETS)}_{datetime.datetime.now().timestamp()}',
            'asset_id': asset_id,
            'user_id': user['user_id'],
            'amount': amount,
            'timestamp': datetime.datetime.now().isoformat(),
            'status': 'completed'
        }
        
        # Store investment
        if user['user_id'] not in USER_ASSETS:
            USER_ASSETS[user['user_id']] = []
        USER_ASSETS[user['user_id']].append(investment)
        
        response_data = {
            'success': True,
            'message': f'Investimento di ${amount:.2f} completato!',
            'investment': investment
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_response = {
            'success': False,
            'error': str(e),
            'message': 'Errore durante l\'investimento'
        }
        response = jsonify(error_response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.status_code = 400
        return response

@app.route('/api/user/assets', methods=['GET', 'OPTIONS'])
def get_user_assets():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    try:
        # Verify user authentication
        user = get_user_from_request()
        
        # Get user assets
        user_assets = USER_ASSETS.get(user['user_id'], [])
        
        response_data = {
            'success': True,
            'assets': user_assets,
            'total': len(user_assets)
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_response = {
            'success': False,
            'error': str(e),
            'message': 'Errore caricamento asset utente'
        }
        response = jsonify(error_response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.status_code = 400
        return response

# For Vercel serverless functions
def handler(request):
    return app(request.environ, lambda status, headers: None)

if __name__ == '__main__':
    app.run(debug=True)

