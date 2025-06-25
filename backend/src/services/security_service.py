import os
import base64
import hashlib
import secrets
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class EncryptionService:
    def __init__(self):
        self.master_key = self._get_or_create_master_key()
        self.fernet = Fernet(self.master_key)
    
    def _get_or_create_master_key(self):
        """Get or create the master encryption key"""
        key_file = os.path.join(os.path.dirname(__file__), '..', '..', 'keys', 'master.key')
        
        # Create keys directory if it doesn't exist
        os.makedirs(os.path.dirname(key_file), exist_ok=True)
        
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            # Generate new master key
            key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(key)
            
            # Set restrictive permissions
            os.chmod(key_file, 0o600)
            logger.info("Generated new master encryption key")
            return key
    
    def encrypt_sensitive_data(self, data):
        """Encrypt sensitive data using Fernet (AES 128)"""
        try:
            if isinstance(data, str):
                data = data.encode('utf-8')
            
            encrypted_data = self.fernet.encrypt(data)
            return base64.b64encode(encrypted_data).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error encrypting data: {str(e)}")
            raise
    
    def decrypt_sensitive_data(self, encrypted_data):
        """Decrypt sensitive data"""
        try:
            encrypted_bytes = base64.b64decode(encrypted_data.encode('utf-8'))
            decrypted_data = self.fernet.decrypt(encrypted_bytes)
            return decrypted_data.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error decrypting data: {str(e)}")
            raise
    
    def generate_secure_token(self, length=32):
        """Generate a cryptographically secure random token"""
        return secrets.token_urlsafe(length)
    
    def hash_password_secure(self, password, salt=None):
        """Hash password using PBKDF2 with SHA-256"""
        if salt is None:
            salt = os.urandom(32)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        
        key = kdf.derive(password.encode('utf-8'))
        
        # Combine salt and hash for storage
        return base64.b64encode(salt + key).decode('utf-8')
    
    def verify_password_secure(self, password, hashed_password):
        """Verify password against secure hash"""
        try:
            # Decode the stored hash
            stored_data = base64.b64decode(hashed_password.encode('utf-8'))
            salt = stored_data[:32]
            stored_key = stored_data[32:]
            
            # Hash the provided password with the same salt
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            
            key = kdf.derive(password.encode('utf-8'))
            
            # Compare the keys
            return secrets.compare_digest(stored_key, key)
            
        except Exception as e:
            logger.error(f"Error verifying password: {str(e)}")
            return False
    
    def generate_rsa_keypair(self, key_size=2048):
        """Generate RSA key pair for asymmetric encryption"""
        try:
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=key_size,
            )
            
            public_key = private_key.public_key()
            
            # Serialize keys
            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            
            public_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            
            return {
                'private_key': private_pem.decode('utf-8'),
                'public_key': public_pem.decode('utf-8')
            }
            
        except Exception as e:
            logger.error(f"Error generating RSA keypair: {str(e)}")
            raise
    
    def encrypt_with_public_key(self, data, public_key_pem):
        """Encrypt data with RSA public key"""
        try:
            public_key = serialization.load_pem_public_key(public_key_pem.encode('utf-8'))
            
            if isinstance(data, str):
                data = data.encode('utf-8')
            
            encrypted_data = public_key.encrypt(
                data,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            return base64.b64encode(encrypted_data).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error encrypting with public key: {str(e)}")
            raise
    
    def decrypt_with_private_key(self, encrypted_data, private_key_pem):
        """Decrypt data with RSA private key"""
        try:
            private_key = serialization.load_pem_private_key(
                private_key_pem.encode('utf-8'),
                password=None
            )
            
            encrypted_bytes = base64.b64decode(encrypted_data.encode('utf-8'))
            
            decrypted_data = private_key.decrypt(
                encrypted_bytes,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            return decrypted_data.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error decrypting with private key: {str(e)}")
            raise
    
    def create_secure_session_token(self, user_id, expiry_hours=24):
        """Create a secure session token with expiry"""
        try:
            expiry_time = datetime.utcnow() + timedelta(hours=expiry_hours)
            
            session_data = {
                'user_id': user_id,
                'created_at': datetime.utcnow().isoformat(),
                'expires_at': expiry_time.isoformat(),
                'nonce': secrets.token_hex(16)
            }
            
            # Convert to string and encrypt
            session_string = f"{session_data['user_id']}|{session_data['created_at']}|{session_data['expires_at']}|{session_data['nonce']}"
            encrypted_token = self.encrypt_sensitive_data(session_string)
            
            return encrypted_token
            
        except Exception as e:
            logger.error(f"Error creating session token: {str(e)}")
            raise
    
    def validate_session_token(self, token):
        """Validate and decode a session token"""
        try:
            # Decrypt the token
            decrypted_data = self.decrypt_sensitive_data(token)
            parts = decrypted_data.split('|')
            
            if len(parts) != 4:
                return None
            
            user_id, created_at, expires_at, nonce = parts
            
            # Check expiry
            expiry_time = datetime.fromisoformat(expires_at)
            if datetime.utcnow() > expiry_time:
                return None
            
            return {
                'user_id': int(user_id),
                'created_at': created_at,
                'expires_at': expires_at,
                'nonce': nonce
            }
            
        except Exception as e:
            logger.error(f"Error validating session token: {str(e)}")
            return None
    
    def hash_api_key(self, api_key):
        """Hash API key for secure storage"""
        return hashlib.sha256(api_key.encode('utf-8')).hexdigest()
    
    def generate_api_key(self, prefix="sk"):
        """Generate a secure API key"""
        random_part = secrets.token_urlsafe(32)
        return f"{prefix}_{random_part}"
    
    def encrypt_wallet_private_key(self, private_key, user_password):
        """Encrypt wallet private key with user password"""
        try:
            # Derive key from user password
            salt = os.urandom(16)
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = kdf.derive(user_password.encode('utf-8'))
            
            # Encrypt private key
            fernet = Fernet(base64.urlsafe_b64encode(key))
            encrypted_key = fernet.encrypt(private_key.encode('utf-8'))
            
            # Combine salt and encrypted key
            result = base64.b64encode(salt + encrypted_key).decode('utf-8')
            return result
            
        except Exception as e:
            logger.error(f"Error encrypting wallet private key: {str(e)}")
            raise
    
    def decrypt_wallet_private_key(self, encrypted_private_key, user_password):
        """Decrypt wallet private key with user password"""
        try:
            # Decode the encrypted data
            encrypted_data = base64.b64decode(encrypted_private_key.encode('utf-8'))
            salt = encrypted_data[:16]
            encrypted_key = encrypted_data[16:]
            
            # Derive key from user password
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = kdf.derive(user_password.encode('utf-8'))
            
            # Decrypt private key
            fernet = Fernet(base64.urlsafe_b64encode(key))
            private_key = fernet.decrypt(encrypted_key)
            
            return private_key.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error decrypting wallet private key: {str(e)}")
            raise

class SecurityAuditService:
    def __init__(self):
        self.encryption_service = EncryptionService()
    
    def audit_password_strength(self, password):
        """Audit password strength and return score and recommendations"""
        score = 0
        recommendations = []
        
        # Length check
        if len(password) >= 12:
            score += 25
        elif len(password) >= 8:
            score += 15
        else:
            recommendations.append("Use at least 12 characters")
        
        # Character variety
        has_lower = any(c.islower() for c in password)
        has_upper = any(c.isupper() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        
        char_types = sum([has_lower, has_upper, has_digit, has_special])
        score += char_types * 15
        
        if not has_lower:
            recommendations.append("Include lowercase letters")
        if not has_upper:
            recommendations.append("Include uppercase letters")
        if not has_digit:
            recommendations.append("Include numbers")
        if not has_special:
            recommendations.append("Include special characters")
        
        # Common patterns check
        common_patterns = ['123', 'abc', 'password', 'admin', 'user']
        if any(pattern in password.lower() for pattern in common_patterns):
            score -= 20
            recommendations.append("Avoid common patterns and words")
        
        # Repetition check
        if len(set(password)) < len(password) * 0.7:
            score -= 10
            recommendations.append("Avoid excessive character repetition")
        
        # Ensure score is between 0 and 100
        score = max(0, min(100, score))
        
        # Determine strength level
        if score >= 80:
            strength = "Very Strong"
        elif score >= 60:
            strength = "Strong"
        elif score >= 40:
            strength = "Moderate"
        elif score >= 20:
            strength = "Weak"
        else:
            strength = "Very Weak"
        
        return {
            'score': score,
            'strength': strength,
            'recommendations': recommendations
        }
    
    def check_data_breach(self, email, password_hash):
        """Check if credentials appear in known data breaches (placeholder)"""
        # This would integrate with services like HaveIBeenPwned
        # For now, return a placeholder response
        return {
            'email_breached': False,
            'password_breached': False,
            'breach_count': 0,
            'last_breach_date': None
        }
    
    def generate_security_report(self, user_id):
        """Generate a comprehensive security report for a user"""
        try:
            from src.models.user import User
            from src.services.mfa_service import mfa_service
            
            user = User.query.get(user_id)
            if not user:
                return None
            
            # Get 2FA status
            mfa_status = mfa_service.get_user_2fa_status(user_id)
            
            # Get recent security events
            security_events = mfa_service.get_user_security_events(user_id, limit=10)
            
            # Get login history
            login_history = mfa_service.get_user_login_history(user_id, limit=10)
            
            # Calculate security score
            security_score = self.calculate_security_score(user, mfa_status, security_events, login_history)
            
            return {
                'user_id': user_id,
                'security_score': security_score,
                'mfa_enabled': mfa_status['enabled'],
                'recent_security_events': len(security_events),
                'recent_logins': len(login_history),
                'account_age_days': (datetime.utcnow() - user.created_at).days,
                'last_password_change': user.updated_at.isoformat() if user.updated_at else None,
                'recommendations': self.get_security_recommendations(user, mfa_status, security_score)
            }
            
        except Exception as e:
            logger.error(f"Error generating security report: {str(e)}")
            return None
    
    def calculate_security_score(self, user, mfa_status, security_events, login_history):
        """Calculate overall security score for a user"""
        score = 0
        
        # Base score for having an account
        score += 20
        
        # MFA enabled
        if mfa_status['enabled']:
            score += 30
        
        # Email verified
        if user.email_verified:
            score += 15
        
        # Recent activity (good sign)
        if login_history and len(login_history) > 0:
            score += 10
        
        # No recent security incidents
        critical_events = [e for e in security_events if e.get('severity') == 'critical']
        if len(critical_events) == 0:
            score += 15
        else:
            score -= len(critical_events) * 5
        
        # Account age (older accounts are generally more secure)
        account_age_days = (datetime.utcnow() - user.created_at).days
        if account_age_days > 30:
            score += 10
        
        return max(0, min(100, score))
    
    def get_security_recommendations(self, user, mfa_status, security_score):
        """Get personalized security recommendations"""
        recommendations = []
        
        if not mfa_status['enabled']:
            recommendations.append({
                'priority': 'high',
                'title': 'Enable Two-Factor Authentication',
                'description': 'Add an extra layer of security to your account'
            })
        
        if not user.email_verified:
            recommendations.append({
                'priority': 'medium',
                'title': 'Verify Your Email',
                'description': 'Verify your email address for account recovery'
            })
        
        if security_score < 70:
            recommendations.append({
                'priority': 'medium',
                'title': 'Review Security Settings',
                'description': 'Check and update your security preferences'
            })
        
        # Always recommend regular password updates
        recommendations.append({
            'priority': 'low',
            'title': 'Regular Password Updates',
            'description': 'Consider updating your password every 6 months'
        })
        
        return recommendations

# Global encryption service instance
encryption_service = EncryptionService()

# Global security audit service instance
security_audit_service = SecurityAuditService()

