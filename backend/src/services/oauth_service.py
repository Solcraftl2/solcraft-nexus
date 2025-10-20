from authlib.integrations.flask_client import OAuth
from flask import current_app, url_for, session, request
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import requests
import logging
from typing import Dict, Optional, Any
from src.models.user import db, User
from src.models.asset import Portfolio
import uuid

logger = logging.getLogger(__name__)

class OAuthService:
    """Service for OAuth authentication with external providers"""
    
    def __init__(self, app=None):
        self.oauth = OAuth()
        self.providers = {}
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize OAuth with Flask app"""
        self.oauth.init_app(app)
        
        # Configure Google OAuth
        if app.config.get('GOOGLE_CLIENT_ID') and app.config.get('GOOGLE_CLIENT_SECRET'):
            self.providers['google'] = self.oauth.register(
                name='google',
                client_id=app.config['GOOGLE_CLIENT_ID'],
                client_secret=app.config['GOOGLE_CLIENT_SECRET'],
                server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
                client_kwargs={
                    'scope': 'openid email profile'
                }
            )
        
        # Configure Apple OAuth (Sign in with Apple)
        if app.config.get('APPLE_CLIENT_ID') and app.config.get('APPLE_CLIENT_SECRET'):
            self.providers['apple'] = self.oauth.register(
                name='apple',
                client_id=app.config['APPLE_CLIENT_ID'],
                client_secret=app.config['APPLE_CLIENT_SECRET'],
                authorize_url='https://appleid.apple.com/auth/authorize',
                access_token_url='https://appleid.apple.com/auth/token',
                client_kwargs={
                    'scope': 'name email',
                    'response_mode': 'form_post'
                }
            )
        
        # Configure GitHub OAuth
        if app.config.get('GITHUB_CLIENT_ID') and app.config.get('GITHUB_CLIENT_SECRET'):
            self.providers['github'] = self.oauth.register(
                name='github',
                client_id=app.config['GITHUB_CLIENT_ID'],
                client_secret=app.config['GITHUB_CLIENT_SECRET'],
                access_token_url='https://github.com/login/oauth/access_token',
                authorize_url='https://github.com/login/oauth/authorize',
                api_base_url='https://api.github.com/',
                client_kwargs={'scope': 'user:email'},
            )
        
        # Configure Microsoft OAuth
        if app.config.get('MICROSOFT_CLIENT_ID') and app.config.get('MICROSOFT_CLIENT_SECRET'):
            self.providers['microsoft'] = self.oauth.register(
                name='microsoft',
                client_id=app.config['MICROSOFT_CLIENT_ID'],
                client_secret=app.config['MICROSOFT_CLIENT_SECRET'],
                authorize_url='https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
                access_token_url='https://login.microsoftonline.com/common/oauth2/v2.0/token',
                client_kwargs={
                    'scope': 'openid email profile'
                }
            )
    
    def get_authorization_url(self, provider: str, redirect_uri: str) -> str:
        """Get authorization URL for OAuth provider"""
        try:
            if provider not in self.providers:
                raise ValueError(f"Provider {provider} not configured")
            
            client = self.providers[provider]
            
            # Store redirect URI in session for callback
            session[f'{provider}_redirect_uri'] = redirect_uri
            
            return client.authorize_redirect(redirect_uri)
            
        except Exception as e:
            logger.error(f"Error getting authorization URL for {provider}: {str(e)}")
            raise Exception(f"Failed to get authorization URL: {str(e)}")
    
    def handle_callback(self, provider: str, code: str = None, state: str = None) -> Dict[str, Any]:
        """Handle OAuth callback and extract user info"""
        try:
            if provider not in self.providers:
                raise ValueError(f"Provider {provider} not configured")
            
            if provider == 'google':
                return self._handle_google_callback(code)
            elif provider == 'apple':
                return self._handle_apple_callback()
            elif provider == 'github':
                return self._handle_github_callback()
            elif provider == 'microsoft':
                return self._handle_microsoft_callback()
            else:
                raise ValueError(f"Callback handler not implemented for {provider}")
                
        except Exception as e:
            logger.error(f"Error handling {provider} callback: {str(e)}")
            raise Exception(f"OAuth callback failed: {str(e)}")
    
    def _handle_google_callback(self, code: str = None) -> Dict[str, Any]:
        """Handle Google OAuth callback"""
        try:
            client = self.providers['google']
            token = client.authorize_access_token()
            
            # Verify the ID token
            id_info = id_token.verify_oauth2_token(
                token['id_token'],
                google_requests.Request(),
                current_app.config['GOOGLE_CLIENT_ID']
            )
            
            return {
                'provider': 'google',
                'provider_id': id_info['sub'],
                'email': id_info['email'],
                'email_verified': id_info.get('email_verified', False),
                'first_name': id_info.get('given_name', ''),
                'last_name': id_info.get('family_name', ''),
                'profile_picture': id_info.get('picture'),
                'locale': id_info.get('locale', 'en')
            }
            
        except Exception as e:
            logger.error(f"Error in Google callback: {str(e)}")
            raise Exception(f"Google authentication failed: {str(e)}")
    
    def _handle_apple_callback(self) -> Dict[str, Any]:
        """Handle Apple OAuth callback"""
        try:
            client = self.providers['apple']
            token = client.authorize_access_token()
            
            # Apple returns user info in the ID token
            user_info = client.parse_id_token(token)
            
            # Apple might also send user info in the form data on first authorization
            user_data = request.form.get('user')
            if user_data:
                import json
                user_json = json.loads(user_data)
                first_name = user_json.get('name', {}).get('firstName', '')
                last_name = user_json.get('name', {}).get('lastName', '')
            else:
                first_name = user_info.get('given_name', '')
                last_name = user_info.get('family_name', '')
            
            return {
                'provider': 'apple',
                'provider_id': user_info['sub'],
                'email': user_info.get('email', ''),
                'email_verified': user_info.get('email_verified', False),
                'first_name': first_name,
                'last_name': last_name,
                'profile_picture': None,  # Apple doesn't provide profile pictures
                'locale': 'en'
            }
            
        except Exception as e:
            logger.error(f"Error in Apple callback: {str(e)}")
            raise Exception(f"Apple authentication failed: {str(e)}")
    
    def _handle_github_callback(self) -> Dict[str, Any]:
        """Handle GitHub OAuth callback"""
        try:
            client = self.providers['github']
            token = client.authorize_access_token()
            
            # Get user info from GitHub API
            resp = client.get('user', token=token)
            user_info = resp.json()
            
            # Get user emails
            email_resp = client.get('user/emails', token=token)
            emails = email_resp.json()
            
            # Find primary email
            primary_email = None
            for email in emails:
                if email.get('primary', False):
                    primary_email = email['email']
                    break
            
            if not primary_email and emails:
                primary_email = emails[0]['email']
            
            # Parse name
            full_name = user_info.get('name', '')
            name_parts = full_name.split(' ', 1) if full_name else ['', '']
            first_name = name_parts[0] if len(name_parts) > 0 else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            
            return {
                'provider': 'github',
                'provider_id': str(user_info['id']),
                'email': primary_email or '',
                'email_verified': True,  # GitHub emails are considered verified
                'first_name': first_name,
                'last_name': last_name,
                'profile_picture': user_info.get('avatar_url'),
                'locale': 'en'
            }
            
        except Exception as e:
            logger.error(f"Error in GitHub callback: {str(e)}")
            raise Exception(f"GitHub authentication failed: {str(e)}")
    
    def _handle_microsoft_callback(self) -> Dict[str, Any]:
        """Handle Microsoft OAuth callback"""
        try:
            client = self.providers['microsoft']
            token = client.authorize_access_token()
            
            # Get user info from Microsoft Graph API
            headers = {'Authorization': f"Bearer {token['access_token']}"}
            resp = requests.get('https://graph.microsoft.com/v1.0/me', headers=headers)
            user_info = resp.json()
            
            return {
                'provider': 'microsoft',
                'provider_id': user_info['id'],
                'email': user_info.get('mail') or user_info.get('userPrincipalName', ''),
                'email_verified': True,  # Microsoft emails are considered verified
                'first_name': user_info.get('givenName', ''),
                'last_name': user_info.get('surname', ''),
                'profile_picture': None,  # Would need additional API call
                'locale': user_info.get('preferredLanguage', 'en')
            }
            
        except Exception as e:
            logger.error(f"Error in Microsoft callback: {str(e)}")
            raise Exception(f"Microsoft authentication failed: {str(e)}")
    
    def find_or_create_user(self, oauth_data: Dict[str, Any]) -> User:
        """Find existing user or create new one from OAuth data"""
        try:
            # First, try to find user by email
            user = User.query.filter_by(email=oauth_data['email'].lower()).first()
            
            if user:
                # Update OAuth provider info if needed
                # In a full implementation, you'd store OAuth provider associations
                return user
            
            # Create new user
            user = User(
                email=oauth_data['email'].lower(),
                first_name=oauth_data['first_name'],
                last_name=oauth_data['last_name'],
                account_type='individual',
                status='active',  # OAuth users are automatically active
                kyc_status='not_started',
                language=oauth_data.get('locale', 'en')[:2],  # Extract language code
                email_verified=oauth_data.get('email_verified', False),
                # Note: OAuth users don't have passwords - they authenticate via OAuth
            )
            
            # Set a random password (won't be used for OAuth login)
            user.set_password(str(uuid.uuid4()))
            
            db.session.add(user)
            db.session.flush()  # Get the user ID
            
            # Create default portfolio
            default_portfolio = Portfolio(
                user_id=user.id,
                name='Default Portfolio',
                description='Your main investment portfolio',
                is_default=True
            )
            db.session.add(default_portfolio)
            
            db.session.commit()
            
            logger.info(f"Created new user from {oauth_data['provider']} OAuth: {user.email}")
            
            return user
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating user from OAuth data: {str(e)}")
            raise Exception(f"Failed to create user: {str(e)}")

# Global service instance
oauth_service = OAuthService()

