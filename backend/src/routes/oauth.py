from flask import Blueprint, request, jsonify, redirect, url_for, session
from flask_jwt_extended import create_access_token, create_refresh_token
from src.services.oauth_service import oauth_service
from src.models.user import db, User
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
oauth_bp = Blueprint('oauth', __name__)

@oauth_bp.route('/auth/oauth/<provider>/login', methods=['GET'])
def oauth_login(provider):
    """Initiate OAuth login with external provider"""
    try:
        # Validate provider
        supported_providers = ['google', 'apple', 'github', 'microsoft']
        if provider not in supported_providers:
            return jsonify({'error': f'Provider {provider} not supported'}), 400
        
        # Get redirect URI from query params or use default
        redirect_uri = request.args.get('redirect_uri') or url_for('oauth.oauth_callback', provider=provider, _external=True)
        
        # Get authorization URL
        auth_url = oauth_service.get_authorization_url(provider, redirect_uri)
        
        return jsonify({
            'provider': provider,
            'authorization_url': auth_url,
            'redirect_uri': redirect_uri
        }), 200
        
    except Exception as e:
        logger.error(f"Error initiating OAuth login for {provider}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@oauth_bp.route('/auth/oauth/<provider>/callback', methods=['GET', 'POST'])
def oauth_callback(provider):
    """Handle OAuth callback from external provider"""
    try:
        # Get authorization code from callback
        code = request.args.get('code') or request.form.get('code')
        state = request.args.get('state') or request.form.get('state')
        
        if not code:
            error = request.args.get('error') or request.form.get('error')
            error_description = request.args.get('error_description') or request.form.get('error_description')
            
            return jsonify({
                'error': 'OAuth authorization failed',
                'details': error_description or error or 'No authorization code received'
            }), 400
        
        # Handle OAuth callback and get user info
        oauth_data = oauth_service.handle_callback(provider, code, state)
        
        # Find or create user
        user = oauth_service.find_or_create_user(oauth_data)
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create JWT tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        # Check if this is a web callback or API callback
        if request.args.get('format') == 'json' or request.headers.get('Accept') == 'application/json':
            # Return JSON response for API clients
            return jsonify({
                'message': 'OAuth login successful',
                'provider': provider,
                'user': user.to_dict(include_sensitive=True),
                'access_token': access_token,
                'refresh_token': refresh_token
            }), 200
        else:
            # Redirect to frontend with tokens (for web clients)
            frontend_url = request.args.get('frontend_url') or 'http://localhost:3000'
            redirect_url = f"{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}&provider={provider}"
            return redirect(redirect_url)
        
    except Exception as e:
        logger.error(f"Error handling OAuth callback for {provider}: {str(e)}")
        
        # Check if this is a web callback or API callback
        if request.args.get('format') == 'json' or request.headers.get('Accept') == 'application/json':
            return jsonify({'error': str(e)}), 500
        else:
            # Redirect to frontend with error
            frontend_url = request.args.get('frontend_url') or 'http://localhost:3000'
            redirect_url = f"{frontend_url}/auth/error?error={str(e)}"
            return redirect(redirect_url)

@oauth_bp.route('/auth/oauth/providers', methods=['GET'])
def get_oauth_providers():
    """Get list of available OAuth providers"""
    try:
        # Check which providers are configured
        available_providers = []
        
        # This would check if the provider credentials are configured
        # For demo purposes, we'll return all supported providers
        providers_info = {
            'google': {
                'name': 'Google',
                'icon': 'google',
                'color': '#4285f4',
                'enabled': True  # Would check if GOOGLE_CLIENT_ID is configured
            },
            'apple': {
                'name': 'Apple',
                'icon': 'apple',
                'color': '#000000',
                'enabled': True  # Would check if APPLE_CLIENT_ID is configured
            },
            'github': {
                'name': 'GitHub',
                'icon': 'github',
                'color': '#333333',
                'enabled': True  # Would check if GITHUB_CLIENT_ID is configured
            },
            'microsoft': {
                'name': 'Microsoft',
                'icon': 'microsoft',
                'color': '#00a1f1',
                'enabled': True  # Would check if MICROSOFT_CLIENT_ID is configured
            }
        }
        
        return jsonify({
            'providers': providers_info
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting OAuth providers: {str(e)}")
        return jsonify({'error': str(e)}), 500

@oauth_bp.route('/auth/oauth/<provider>/link', methods=['POST'])
def link_oauth_account(provider):
    """Link OAuth account to existing user (for users who are already logged in)"""
    try:
        from flask_jwt_extended import jwt_required, get_jwt_identity
        
        @jwt_required()
        def _link_account():
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # This would store the OAuth provider association
            # For now, we'll just return success
            
            return jsonify({
                'message': f'{provider.title()} account linked successfully',
                'provider': provider,
                'user_id': current_user_id
            }), 200
        
        return _link_account()
        
    except Exception as e:
        logger.error(f"Error linking OAuth account for {provider}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@oauth_bp.route('/auth/oauth/<provider>/unlink', methods=['DELETE'])
def unlink_oauth_account(provider):
    """Unlink OAuth account from user"""
    try:
        from flask_jwt_extended import jwt_required, get_jwt_identity
        
        @jwt_required()
        def _unlink_account():
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # This would remove the OAuth provider association
            # For now, we'll just return success
            
            return jsonify({
                'message': f'{provider.title()} account unlinked successfully',
                'provider': provider,
                'user_id': current_user_id
            }), 200
        
        return _unlink_account()
        
    except Exception as e:
        logger.error(f"Error unlinking OAuth account for {provider}: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Additional route for handling Apple's specific callback format
@oauth_bp.route('/auth/oauth/apple/callback', methods=['POST'])
def apple_callback_post():
    """Handle Apple's POST callback (Apple sends POST instead of GET)"""
    return oauth_callback('apple')

