import pyotp
import qrcode
import io
import base64
from datetime import datetime, timedelta
from src.models.user import db, User
import logging

logger = logging.getLogger(__name__)

class TwoFactorAuth(db.Model):
    __tablename__ = 'two_factor_auth'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # TOTP settings
    secret_key = db.Column(db.String(32), nullable=False)
    is_enabled = db.Column(db.Boolean, default=False)
    backup_codes = db.Column(db.JSON)  # List of backup codes
    
    # Recovery settings
    recovery_email = db.Column(db.String(120))
    recovery_phone = db.Column(db.String(20))
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'is_enabled': self.is_enabled,
            'has_backup_codes': bool(self.backup_codes),
            'recovery_email': self.recovery_email,
            'recovery_phone': self.recovery_phone,
            'created_at': self.created_at.isoformat(),
            'last_used': self.last_used.isoformat() if self.last_used else None
        }

class LoginAttempt(db.Model):
    __tablename__ = 'login_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    ip_address = db.Column(db.String(45), nullable=False)
    user_agent = db.Column(db.String(500))
    
    success = db.Column(db.Boolean, default=False)
    failure_reason = db.Column(db.String(100))
    
    # Security details
    location = db.Column(db.String(100))  # Approximate location from IP
    device_fingerprint = db.Column(db.String(100))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'success': self.success,
            'failure_reason': self.failure_reason,
            'location': self.location,
            'device_fingerprint': self.device_fingerprint,
            'created_at': self.created_at.isoformat()
        }

class SecurityEvent(db.Model):
    __tablename__ = 'security_events'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    
    event_type = db.Column(db.String(50), nullable=False)  # login, password_change, 2fa_enabled, etc.
    severity = db.Column(db.String(20), default='info')  # info, warning, critical
    description = db.Column(db.Text)
    
    # Context
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))
    event_metadata = db.Column(db.JSON)  # Changed from 'metadata' to 'event_metadata'
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_type': self.event_type,
            'severity': self.severity,
            'description': self.description,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'metadata': self.event_metadata,  # Updated to use 'event_metadata'
            'created_at': self.created_at.isoformat()
        }

class MFAService:
    def __init__(self):
        self.issuer_name = "SolCraft Nexus"
        self.max_failed_attempts = 5
        self.lockout_duration = timedelta(minutes=30)
    
    def setup_2fa(self, user_id):
        """Setup 2FA for a user"""
        try:
            user = User.query.get(user_id)
            if not user:
                raise ValueError("User not found")
            
            # Check if 2FA is already setup
            existing_2fa = TwoFactorAuth.query.filter_by(user_id=user_id).first()
            if existing_2fa and existing_2fa.is_enabled:
                raise ValueError("2FA is already enabled for this user")
            
            # Generate secret key
            secret_key = pyotp.random_base32()
            
            # Generate backup codes
            backup_codes = [pyotp.random_base32()[:8] for _ in range(10)]
            
            if existing_2fa:
                # Update existing record
                existing_2fa.secret_key = secret_key
                existing_2fa.backup_codes = backup_codes
                existing_2fa.is_enabled = False  # Will be enabled after verification
                two_fa = existing_2fa
            else:
                # Create new 2FA record
                two_fa = TwoFactorAuth(
                    user_id=user_id,
                    secret_key=secret_key,
                    backup_codes=backup_codes,
                    is_enabled=False
                )
                db.session.add(two_fa)
            
            db.session.commit()
            
            # Generate QR code
            totp = pyotp.TOTP(secret_key)
            provisioning_uri = totp.provisioning_uri(
                name=user.email,
                issuer_name=self.issuer_name
            )
            
            qr_code = self.generate_qr_code(provisioning_uri)
            
            # Log security event
            self.log_security_event(
                user_id=user_id,
                event_type="2fa_setup_initiated",
                description="User initiated 2FA setup"
            )
            
            logger.info(f"2FA setup initiated for user {user_id}")
            
            return {
                'secret_key': secret_key,
                'qr_code': qr_code,
                'backup_codes': backup_codes,
                'manual_entry_key': secret_key
            }
            
        except Exception as e:
            logger.error(f"Error setting up 2FA: {str(e)}")
            db.session.rollback()
            raise
    
    def verify_and_enable_2fa(self, user_id, token):
        """Verify TOTP token and enable 2FA"""
        try:
            two_fa = TwoFactorAuth.query.filter_by(user_id=user_id).first()
            if not two_fa:
                raise ValueError("2FA not setup for this user")
            
            if two_fa.is_enabled:
                raise ValueError("2FA is already enabled")
            
            # Verify token
            totp = pyotp.TOTP(two_fa.secret_key)
            if not totp.verify(token, valid_window=1):
                raise ValueError("Invalid token")
            
            # Enable 2FA
            two_fa.is_enabled = True
            two_fa.last_used = datetime.utcnow()
            db.session.commit()
            
            # Log security event
            self.log_security_event(
                user_id=user_id,
                event_type="2fa_enabled",
                description="User successfully enabled 2FA"
            )
            
            logger.info(f"2FA enabled for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error enabling 2FA: {str(e)}")
            db.session.rollback()
            raise
    
    def verify_2fa_token(self, user_id, token):
        """Verify a 2FA token"""
        try:
            two_fa = TwoFactorAuth.query.filter_by(user_id=user_id, is_enabled=True).first()
            if not two_fa:
                return False
            
            # Try TOTP first
            totp = pyotp.TOTP(two_fa.secret_key)
            if totp.verify(token, valid_window=1):
                two_fa.last_used = datetime.utcnow()
                db.session.commit()
                return True
            
            # Try backup codes
            if two_fa.backup_codes and token in two_fa.backup_codes:
                # Remove used backup code
                two_fa.backup_codes.remove(token)
                two_fa.last_used = datetime.utcnow()
                db.session.commit()
                
                # Log backup code usage
                self.log_security_event(
                    user_id=user_id,
                    event_type="backup_code_used",
                    description="User used a backup code for 2FA",
                    severity="warning"
                )
                
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error verifying 2FA token: {str(e)}")
            return False
    
    def disable_2fa(self, user_id, password, token_or_backup_code):
        """Disable 2FA for a user"""
        try:
            user = User.query.get(user_id)
            if not user:
                raise ValueError("User not found")
            
            # Verify password
            if not user.check_password(password):
                raise ValueError("Invalid password")
            
            # Verify 2FA token or backup code
            if not self.verify_2fa_token(user_id, token_or_backup_code):
                raise ValueError("Invalid 2FA token or backup code")
            
            # Disable 2FA
            two_fa = TwoFactorAuth.query.filter_by(user_id=user_id).first()
            if two_fa:
                two_fa.is_enabled = False
                db.session.commit()
            
            # Log security event
            self.log_security_event(
                user_id=user_id,
                event_type="2fa_disabled",
                description="User disabled 2FA",
                severity="warning"
            )
            
            logger.info(f"2FA disabled for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error disabling 2FA: {str(e)}")
            db.session.rollback()
            raise
    
    def generate_new_backup_codes(self, user_id, password, token):
        """Generate new backup codes"""
        try:
            user = User.query.get(user_id)
            if not user:
                raise ValueError("User not found")
            
            # Verify password
            if not user.check_password(password):
                raise ValueError("Invalid password")
            
            # Verify 2FA token
            if not self.verify_2fa_token(user_id, token):
                raise ValueError("Invalid 2FA token")
            
            # Generate new backup codes
            backup_codes = [pyotp.random_base32()[:8] for _ in range(10)]
            
            two_fa = TwoFactorAuth.query.filter_by(user_id=user_id).first()
            if two_fa:
                two_fa.backup_codes = backup_codes
                db.session.commit()
            
            # Log security event
            self.log_security_event(
                user_id=user_id,
                event_type="backup_codes_regenerated",
                description="User generated new backup codes",
                severity="info"
            )
            
            logger.info(f"New backup codes generated for user {user_id}")
            return backup_codes
            
        except Exception as e:
            logger.error(f"Error generating backup codes: {str(e)}")
            db.session.rollback()
            raise
    
    def generate_qr_code(self, data):
        """Generate QR code as base64 image"""
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(data)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            img_base64 = base64.b64encode(buffer.getvalue()).decode()
            return f"data:image/png;base64,{img_base64}"
            
        except Exception as e:
            logger.error(f"Error generating QR code: {str(e)}")
            return None
    
    def log_login_attempt(self, user_id, ip_address, user_agent, success, failure_reason=None, location=None, device_fingerprint=None):
        """Log a login attempt"""
        try:
            attempt = LoginAttempt(
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                success=success,
                failure_reason=failure_reason,
                location=location,
                device_fingerprint=device_fingerprint
            )
            
            db.session.add(attempt)
            db.session.commit()
            
            # Check for suspicious activity
            if not success:
                self.check_brute_force_attempts(user_id, ip_address)
            
        except Exception as e:
            logger.error(f"Error logging login attempt: {str(e)}")
    
    def check_brute_force_attempts(self, user_id, ip_address):
        """Check for brute force attempts and lock account if necessary"""
        try:
            # Count failed attempts in the last hour
            one_hour_ago = datetime.utcnow() - timedelta(hours=1)
            failed_attempts = LoginAttempt.query.filter(
                LoginAttempt.user_id == user_id,
                LoginAttempt.ip_address == ip_address,
                LoginAttempt.success == False,
                LoginAttempt.created_at >= one_hour_ago
            ).count()
            
            if failed_attempts >= self.max_failed_attempts:
                # Lock the account
                user = User.query.get(user_id)
                if user:
                    user.account_locked_until = datetime.utcnow() + self.lockout_duration
                    db.session.commit()
                
                # Log security event
                self.log_security_event(
                    user_id=user_id,
                    event_type="account_locked",
                    description=f"Account locked due to {failed_attempts} failed login attempts",
                    severity="critical",
                    ip_address=ip_address
                )
                
                logger.warning(f"Account {user_id} locked due to brute force attempts from {ip_address}")
            
        except Exception as e:
            logger.error(f"Error checking brute force attempts: {str(e)}")
    
    def log_security_event(self, user_id, event_type, description, severity="info", ip_address=None, user_agent=None, metadata=None):
        """Log a security event"""
        try:
            event = SecurityEvent(
                user_id=user_id,
                event_type=event_type,
                severity=severity,
                description=description,
                ip_address=ip_address,
                user_agent=user_agent,
                event_metadata=metadata  # Updated to use 'event_metadata'
            )
            
            db.session.add(event)
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error logging security event: {str(e)}")
    
    def get_user_2fa_status(self, user_id):
        """Get 2FA status for a user"""
        try:
            two_fa = TwoFactorAuth.query.filter_by(user_id=user_id).first()
            if not two_fa:
                return {'enabled': False, 'setup': False}
            
            return {
                'enabled': two_fa.is_enabled,
                'setup': True,
                'has_backup_codes': bool(two_fa.backup_codes),
                'backup_codes_count': len(two_fa.backup_codes) if two_fa.backup_codes else 0,
                'last_used': two_fa.last_used.isoformat() if two_fa.last_used else None
            }
            
        except Exception as e:
            logger.error(f"Error getting 2FA status: {str(e)}")
            return {'enabled': False, 'setup': False}
    
    def get_user_security_events(self, user_id, limit=50):
        """Get security events for a user"""
        try:
            events = SecurityEvent.query.filter_by(
                user_id=user_id
            ).order_by(
                SecurityEvent.created_at.desc()
            ).limit(limit).all()
            
            return [event.to_dict() for event in events]
            
        except Exception as e:
            logger.error(f"Error getting security events: {str(e)}")
            return []
    
    def get_user_login_history(self, user_id, limit=50):
        """Get login history for a user"""
        try:
            attempts = LoginAttempt.query.filter_by(
                user_id=user_id
            ).order_by(
                LoginAttempt.created_at.desc()
            ).limit(limit).all()
            
            return [attempt.to_dict() for attempt in attempts]
            
        except Exception as e:
            logger.error(f"Error getting login history: {str(e)}")
            return []

# Global MFA service instance
mfa_service = MFAService()

