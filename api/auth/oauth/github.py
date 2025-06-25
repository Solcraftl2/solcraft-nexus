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
        'auth_method': user_data.get('auth_method', 'oauth'),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def simulate_github_user():
    """Simulate GitHub OAuth user data"""
    return {
        'id': 'github_987654321',
        'name': 'Utente GitHub',
        'email': 'utente@github.com',
        'avatar': 'https://avatars.githubusercontent.com/u/default',
        'provider': 'github'
    }

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        """Handle POST requests for GitHub OAuth"""
        try:
            # Get request data
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
            else:
                data = {}
            
            # Simulate GitHub OAuth authentication
            user_data = simulate_github_user()
            user_data['auth_method'] = 'github'
            
            # Create JWT token
            token = create_jwt_token(user_data)
            
            # Response
            response_data = {
                'success': True,
                'message': 'Login GitHub completato!',
                'user': {
                    'id': user_data['id'],
                    'name': user_data['name'],
                    'email': user_data['email'],
                    'avatar': user_data['avatar'],
                    'provider': 'github'
                },
                'token': token
            }
            
            self.send_json_response(response_data)
            
        except Exception as e:
            self.send_error_response(f'Errore durante il login GitHub: {str(e)}')

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
            'message': 'Errore durante l\'autenticazione GitHub'
        }
        self.send_json_response(error_data, status_code)

