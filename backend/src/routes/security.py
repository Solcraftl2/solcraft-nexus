from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.services.mfa_service import mfa_service
from src.services.security_service import security_audit_service
import logging

logger = logging.getLogger(__name__)

security_bp = Blueprint('security', __name__)

@security_bp.route('/mfa/setup', methods=['POST'])
@jwt_required()
def setup_mfa():
    """Setup 2FA for the current user"""
    try:
        user_id = get_jwt_identity()
        result = mfa_service.setup_2fa(user_id)
        
        return jsonify({
            'success': True,
            'data': {
                'qr_code': result['qr_code'],
                'manual_entry_key': result['manual_entry_key'],
                'backup_codes': result['backup_codes']
            }
        }), 200
        
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error setting up MFA: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@security_bp.route('/mfa/verify', methods=['POST'])
@jwt_required()
def verify_mfa():
    """Verify and enable 2FA"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'token' not in data:
            return jsonify({'success': False, 'error': 'Token is required'}), 400
        
        result = mfa_service.verify_and_enable_2fa(user_id, data['token'])
        
        return jsonify({
            'success': True,
            'message': '2FA enabled successfully'
        }), 200
        
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error verifying MFA: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@security_bp.route('/mfa/disable', methods=['POST'])
@jwt_required()
def disable_mfa():
    """Disable 2FA"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'password' not in data or 'token' not in data:
            return jsonify({'success': False, 'error': 'Password and token are required'}), 400
        
        result = mfa_service.disable_2fa(user_id, data['password'], data['token'])
        
        return jsonify({
            'success': True,
            'message': '2FA disabled successfully'
        }), 200
        
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error disabling MFA: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@security_bp.route('/mfa/backup-codes', methods=['POST'])
@jwt_required()
def generate_backup_codes():
    """Generate new backup codes"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'password' not in data or 'token' not in data:
            return jsonify({'success': False, 'error': 'Password and token are required'}), 400
        
        backup_codes = mfa_service.generate_new_backup_codes(user_id, data['password'], data['token'])
        
        return jsonify({
            'success': True,
            'data': {'backup_codes': backup_codes}
        }), 200
        
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error generating backup codes: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@security_bp.route('/mfa/status', methods=['GET'])
@jwt_required()
def get_mfa_status():
    """Get 2FA status for current user"""
    try:
        user_id = get_jwt_identity()
        status = mfa_service.get_user_2fa_status(user_id)
        
        return jsonify({
            'success': True,
            'data': status
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting MFA status: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@security_bp.route('/audit/password', methods=['POST'])
@jwt_required()
def audit_password():
    """Audit password strength"""
    try:
        data = request.get_json()
        
        if not data or 'password' not in data:
            return jsonify({'success': False, 'error': 'Password is required'}), 400
        
        audit_result = security_audit_service.audit_password_strength(data['password'])
        
        return jsonify({
            'success': True,
            'data': audit_result
        }), 200
        
    except Exception as e:
        logger.error(f"Error auditing password: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@security_bp.route('/report', methods=['GET'])
@jwt_required()
def get_security_report():
    """Get security report for current user"""
    try:
        user_id = get_jwt_identity()
        report = security_audit_service.generate_security_report(user_id)
        
        if not report:
            return jsonify({'success': False, 'error': 'Unable to generate security report'}), 500
        
        return jsonify({
            'success': True,
            'data': report
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting security report: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@security_bp.route('/events', methods=['GET'])
@jwt_required()
def get_security_events():
    """Get security events for current user"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 50, type=int)
        
        events = mfa_service.get_user_security_events(user_id, limit)
        
        return jsonify({
            'success': True,
            'data': events
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting security events: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@security_bp.route('/login-history', methods=['GET'])
@jwt_required()
def get_login_history():
    """Get login history for current user"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 50, type=int)
        
        history = mfa_service.get_user_login_history(user_id, limit)
        
        return jsonify({
            'success': True,
            'data': history
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting login history: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

