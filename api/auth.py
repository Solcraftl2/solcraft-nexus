from http.server import BaseHTTPRequestHandler
import json
import jwt
import datetime
import os
from urllib.parse import urlparse, parse_qs

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

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        """Handle POST requests"""
        try:
            # Parse URL to get the provider
            parsed_path = urlparse(self.path)
            path_parts = parsed_path.path.split('/')
            
            # Extract provider from path like /api/auth/oauth/google
            if len(path_parts) >= 5 and path_parts[4]:
                provider = path_parts[4]
            else:
                provider = 'google'  # default
            
            # Handle wallet authentication
            if 'wallet' in self.path:
                self.handle_wallet_auth()
                return
            
            # Handle OAuth authentication
            self.handle_oauth_auth(provider)
            
        except Exception as e:
            self.send_error_response(str(e))

    def handle_oauth_auth(self, provider):
        """Handle OAuth authentication"""
        try:
            # Get request data
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
            else:
                data = {}
            
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
            
            self.send_json_response(response_data)
            
        except Exception as e:
            self.send_error_response(f'Errore durante il login {provider}: {str(e)}')

    def handle_wallet_auth(self):
        """Handle wallet authentication"""
        try:
            # Get request data
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
            else:
                data = {}
            
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
            
            self.send_json_response(response_data)
            
        except Exception as e:
            self.send_error_response(f'Errore connessione wallet: {str(e)}')

    def send_json_response(self, data, status_code=200):
        """Send JSON response with CORS headers"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def send_error_response(self, error_message, status_code=400):
        """Send error response with CORS headers"""
        error_data = {
            'success': False,
            'error': error_message,
            'message': 'Errore durante l\'autenticazione'
        }
        self.send_json_response(error_data, status_code)

