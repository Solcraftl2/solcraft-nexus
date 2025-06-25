from flask import Flask, request, jsonify
import json
import jwt
import datetime
import os
import uuid

app = Flask(__name__)

JWT_SECRET = os.environ.get('JWT_SECRET', 'solcraft-nexus-secret-key-2024')

# In-memory storage (in production use database)
TOKENIZED_ASSETS = []
USER_TOKENS = {}

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

@app.route('/api/tokenization/create', methods=['POST', 'OPTIONS'])
def create_tokenized_asset():
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
        
        # Validate required fields
        required_fields = ['name', 'description', 'category', 'totalValue', 'tokenSupply']
        for field in required_fields:
            if not data.get(field):
                raise ValueError(f'Campo {field} richiesto')
        
        # Create tokenized asset
        asset_id = str(uuid.uuid4())
        token_symbol = data.get('tokenSymbol', f"TKN{len(TOKENIZED_ASSETS) + 1}")
        
        tokenized_asset = {
            'id': asset_id,
            'name': data['name'],
            'description': data['description'],
            'category': data['category'],
            'totalValue': float(data['totalValue']),
            'tokenSupply': int(data['tokenSupply']),
            'tokenSymbol': token_symbol,
            'pricePerToken': float(data['totalValue']) / int(data['tokenSupply']),
            'owner': user['user_id'],
            'ownerName': user['name'],
            'createdAt': datetime.datetime.now().isoformat(),
            'status': 'active',
            'documents': data.get('documents', []),
            'terms': data.get('terms', {}),
            'blockchain': 'XRP Ledger',
            'contractAddress': f'0x{asset_id.replace("-", "")[:40]}',
            'totalInvested': 0,
            'investorsCount': 0,
            'apy': data.get('expectedReturn', 8.5),
            'riskLevel': data.get('riskLevel', 'medium')
        }
        
        # Store asset
        TOKENIZED_ASSETS.append(tokenized_asset)
        
        # Add to user tokens
        if user['user_id'] not in USER_TOKENS:
            USER_TOKENS[user['user_id']] = []
        
        USER_TOKENS[user['user_id']].append({
            'id': asset_id,
            'name': tokenized_asset['name'],
            'symbol': token_symbol,
            'totalSupply': tokenized_asset['tokenSupply'],
            'ownedTokens': tokenized_asset['tokenSupply'],  # Owner gets all tokens initially
            'value': tokenized_asset['totalValue'],
            'createdAt': tokenized_asset['createdAt']
        })
        
        # Create automatic liquidity pool
        pool_id = f'pool_{asset_id[:8]}'
        pool_data = {
            'id': pool_id,
            'name': f'{tokenized_asset["name"]} Pool',
            'assetId': asset_id,
            'tokenSymbol': token_symbol,
            'type': 'liquidity',
            'tvl': tokenized_asset['totalValue'],
            'apy': tokenized_asset['apy'],
            'participants': 1,
            'createdAt': datetime.datetime.now().isoformat(),
            'status': 'active'
        }
        
        response_data = {
            'success': True,
            'message': f'Asset {tokenized_asset["name"]} tokenizzato con successo!',
            'asset': tokenized_asset,
            'pool': pool_data,
            'transaction': {
                'id': f'tx_{asset_id[:8]}',
                'type': 'tokenization',
                'status': 'completed',
                'hash': f'0x{uuid.uuid4().hex}',
                'timestamp': datetime.datetime.now().isoformat()
            }
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_response = {
            'success': False,
            'error': str(e),
            'message': 'Errore durante la tokenizzazione'
        }
        response = jsonify(error_response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.status_code = 400
        return response

@app.route('/api/tokenization/estimate', methods=['POST', 'OPTIONS'])
def estimate_tokenization():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    try:
        # Get request data
        data = request.get_json() or {}
        total_value = float(data.get('totalValue', 0))
        token_supply = int(data.get('tokenSupply', 1000))
        
        if total_value <= 0 or token_supply <= 0:
            raise ValueError('Valore totale e supply token devono essere maggiori di 0')
        
        # Calculate estimates
        price_per_token = total_value / token_supply
        platform_fee = total_value * 0.025  # 2.5% platform fee
        gas_fee = 50  # Estimated gas fee in USD
        total_cost = platform_fee + gas_fee
        
        response_data = {
            'success': True,
            'estimate': {
                'totalValue': total_value,
                'tokenSupply': token_supply,
                'pricePerToken': round(price_per_token, 4),
                'platformFee': round(platform_fee, 2),
                'gasFee': gas_fee,
                'totalCost': round(total_cost, 2),
                'netValue': round(total_value - total_cost, 2)
            }
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_response = {
            'success': False,
            'error': str(e),
            'message': 'Errore calcolo stima'
        }
        response = jsonify(error_response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.status_code = 400
        return response

@app.route('/api/user/tokens', methods=['GET', 'OPTIONS'])
def get_user_tokens():
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
        
        # Get user tokens
        user_tokens = USER_TOKENS.get(user['user_id'], [])
        
        response_data = {
            'success': True,
            'tokens': user_tokens,
            'total': len(user_tokens)
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_response = {
            'success': False,
            'error': str(e),
            'message': 'Errore caricamento token utente'
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

