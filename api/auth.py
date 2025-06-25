from flask import Flask, request, jsonify
import json
import jwt
import datetime
import os

app = Flask(__name__)

# Secret key for JWT (in production use environment variable)
JWT_SECRET = os.environ.get('JWT_SECRET', 'solcraft-nexus-secret-key-2024')

def create_jwt_token(user_data):
    """Create JWT token for user"""
    payload = {
        'user_id': user_data['id'],
        'email': user_data['email'],
        'name': user_data['name'],
        'auth_method': user_data.get('auth_method', 'oauth'),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def simulate_oauth_user(provider):
    """Simulate OAuth user data - in production this would call real OAuth APIs"""
    oauth_users = {
        'google': {
            'id': 'google_123456789',
            'name': 'Utente Google',
            'email': 'utente@gmail.com',
            'avatar': 'https://lh3.googleusercontent.com/a/default-user',
            'provider': 'google'
        },
        'github': {
            'id': 'github_987654321',
            'name': 'Utente GitHub',
            'email': 'utente@github.com',
            'avatar': 'https://avatars.githubusercontent.com/u/default',
            'provider': 'github'
        },
        'apple': {
            'id': 'apple_456789123',
            'name': 'Utente Apple',
            'email': 'utente@icloud.com',
            'avatar': 'https://cdn.apple.com/default-avatar',
            'provider': 'apple'
        }
    }
    return oauth_users.get(provider, oauth_users['google'])

@app.route('/api/auth/oauth/<provider>', methods=['POST', 'OPTIONS'])
def oauth_login(provider):
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
        
        # Simulate OAuth authentication
        user_data = simulate_oauth_user(provider)
        user_data['auth_method'] = provider
        
        # Create JWT token
        token = create_jwt_token(user_data)
        
        # Response
        response_data = {
            'success': True,
            'message': f'Login {provider} completato!',
            'user': {
                'id': user_data['id'],
                'name': user_data['name'],
                'email': user_data['email'],
                'avatar': user_data['avatar'],
                'provider': provider
            },
            'token': token
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        return response
        
    except Exception as e:
        error_response = {
            'success': False,
            'error': str(e),
            'message': f'Errore durante il login {provider}'
        }
        response = jsonify(error_response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.status_code = 400
        return response

@app.route('/api/auth/wallet', methods=['POST', 'OPTIONS'])
def wallet_auth():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    try:
        data = request.get_json() or {}
        wallet_address = data.get('address', '')
        
        if not wallet_address:
            raise ValueError('Indirizzo wallet richiesto')
        
        # Create user data from wallet
        user_data = {
            'id': f'wallet_{wallet_address[:10]}',
            'name': f'Wallet {wallet_address[:6]}...{wallet_address[-4:]}',
            'email': f'{wallet_address[:10]}@wallet.local',
            'avatar': f'https://api.dicebear.com/7.x/identicon/svg?seed={wallet_address}',
            'auth_method': 'wallet',
            'wallet_address': wallet_address
        }
        
        # Create JWT token
        token = create_jwt_token(user_data)
        
        response_data = {
            'success': True,
            'message': 'Wallet connesso con successo!',
            'user': user_data,
            'token': token
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        error_response = {
            'success': False,
            'error': str(e),
            'message': 'Errore connessione wallet'
        }
        response = jsonify(error_response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.status_code = 400
        return response

# For Vercel serverless functions
def handler(request, context):
    """Vercel serverless handler"""
    with app.test_request_context(
        path=request.get('path', '/'),
        method=request.get('httpMethod', 'GET'),
        headers=request.get('headers', {}),
        data=request.get('body', ''),
        query_string=request.get('queryStringParameters', {})
    ):
        try:
            response = app.full_dispatch_request()
            return {
                'statusCode': response.status_code,
                'headers': dict(response.headers),
                'body': response.get_data(as_text=True)
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }

# Export for Vercel
app = app

if __name__ == '__main__':
    app.run(debug=True)

