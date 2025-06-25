from http.server import BaseHTTPRequestHandler
import json
import jwt
import datetime
import os

# Secret key for JWT
JWT_SECRET = os.environ.get('JWT_SECRET', 'solcraft-nexus-secret-key-2024')

def create_jwt_token(user_data):
    """Create JWT token for user"""
    payload = {
        'user_id': user_data['id'],
        'email': user_data['email'],
        'name': user_data['name'],
        'auth_method': user_data.get('auth_method', 'wallet'),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        """Handle POST requests for Wallet authentication"""
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
            'message': 'Errore durante l\'autenticazione wallet'
        }
        self.send_json_response(error_data, status_code)

