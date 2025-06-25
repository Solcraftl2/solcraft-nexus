import os
import base64
import json
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from xrpl.wallet import Wallet
from xrpl.constants import CryptoAlgorithm
from typing import Dict, Optional, Any
from src.config import Config
from src.models.user import db, User

logger = logging.getLogger(__name__)

class SecureWalletService:
    """Service for secure wallet and private key management"""
    
    def __init__(self):
        self.master_key = self._get_or_create_master_key()
        self.fernet = Fernet(self.master_key)
    
    def _get_or_create_master_key(self) -> bytes:
        """Get or create master encryption key"""
        try:
            # In production, this should be stored in a secure key management system
            master_key_env = os.environ.get('WALLET_MASTER_KEY')
            
            if master_key_env:
                return base64.urlsafe_b64decode(master_key_env.encode())
            
            # Generate new master key for development
            password = Config.SECRET_KEY.encode()
            salt = b'solcraft_nexus_salt'  # In production, use random salt per installation
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            
            key = base64.urlsafe_b64encode(kdf.derive(password))
            
            logger.warning("Using generated master key for development. Set WALLET_MASTER_KEY in production!")
            
            return key
            
        except Exception as e:
            logger.error(f"Error getting master key: {str(e)}")
            raise Exception("Failed to initialize wallet encryption")
    
    def create_secure_wallet(self, user_id: str, wallet_type: str = 'custodial') -> Dict[str, Any]:
        """Create a new wallet with secure key storage"""
        try:
            # Generate new wallet
            wallet = Wallet.create(algorithm=CryptoAlgorithm.SECP256K1)
            
            if wallet_type == 'custodial':
                # Store encrypted private key for custodial wallets
                encrypted_seed = self._encrypt_data(wallet.seed)
                encrypted_private_key = self._encrypt_data(wallet.private_key)
                
                # Store in secure wallet storage (in production, use dedicated key storage)
                wallet_data = {
                    'user_id': user_id,
                    'address': wallet.address,
                    'public_key': wallet.public_key,
                    'encrypted_seed': encrypted_seed,
                    'encrypted_private_key': encrypted_private_key,
                    'wallet_type': wallet_type,
                    'algorithm': 'secp256k1'
                }
                
                # In production, store this in a separate secure database or HSM
                self._store_wallet_data(user_id, wallet_data)
                
                return {
                    'address': wallet.address,
                    'public_key': wallet.public_key,
                    'wallet_type': wallet_type,
                    'is_secure': True
                }
            else:
                # For non-custodial wallets, only store address
                return {
                    'address': wallet.address,
                    'wallet_type': wallet_type,
                    'is_secure': False,
                    'note': 'Private key not stored - user managed'
                }
                
        except Exception as e:
            logger.error(f"Error creating secure wallet: {str(e)}")
            raise Exception(f"Failed to create secure wallet: {str(e)}")
    
    def get_wallet_for_transaction(self, user_id: str) -> Optional[Wallet]:
        """Get wallet instance for transaction signing"""
        try:
            user = User.query.get(user_id)
            if not user or not user.wallet_address:
                raise ValueError("User or wallet not found")
            
            if user.wallet_type != 'custodial':
                raise ValueError("Cannot access non-custodial wallet private key")
            
            # Retrieve encrypted wallet data
            wallet_data = self._get_wallet_data(user_id)
            if not wallet_data:
                raise ValueError("Wallet data not found")
            
            # Decrypt seed and recreate wallet
            encrypted_seed = wallet_data['encrypted_seed']
            seed = self._decrypt_data(encrypted_seed)
            
            # Recreate wallet from seed
            wallet = Wallet.from_seed(seed)
            
            # Verify address matches
            if wallet.address != user.wallet_address:
                raise ValueError("Wallet address mismatch")
            
            return wallet
            
        except Exception as e:
            logger.error(f"Error getting wallet for transaction: {str(e)}")
            raise Exception(f"Failed to access wallet: {str(e)}")
    
    def import_wallet(self, user_id: str, seed_or_private_key: str, wallet_type: str = 'custodial') -> Dict[str, Any]:
        """Import existing wallet"""
        try:
            # Try to create wallet from seed or private key
            try:
                if len(seed_or_private_key.split()) > 1:
                    # Looks like a seed phrase
                    wallet = Wallet.from_seed(seed_or_private_key)
                else:
                    # Assume it's a private key
                    wallet = Wallet(seed_or_private_key, sequence=0)
            except Exception:
                raise ValueError("Invalid seed phrase or private key")
            
            if wallet_type == 'custodial':
                # Store encrypted keys
                encrypted_seed = self._encrypt_data(wallet.seed)
                encrypted_private_key = self._encrypt_data(wallet.private_key)
                
                wallet_data = {
                    'user_id': user_id,
                    'address': wallet.address,
                    'public_key': wallet.public_key,
                    'encrypted_seed': encrypted_seed,
                    'encrypted_private_key': encrypted_private_key,
                    'wallet_type': wallet_type,
                    'algorithm': 'secp256k1',
                    'imported': True
                }
                
                self._store_wallet_data(user_id, wallet_data)
            
            return {
                'address': wallet.address,
                'public_key': wallet.public_key,
                'wallet_type': wallet_type,
                'imported': True
            }
            
        except Exception as e:
            logger.error(f"Error importing wallet: {str(e)}")
            raise Exception(f"Failed to import wallet: {str(e)}")
    
    def export_wallet(self, user_id: str, export_type: str = 'seed') -> str:
        """Export wallet (seed or private key) for backup"""
        try:
            user = User.query.get(user_id)
            if not user or user.wallet_type != 'custodial':
                raise ValueError("Cannot export non-custodial wallet")
            
            wallet_data = self._get_wallet_data(user_id)
            if not wallet_data:
                raise ValueError("Wallet data not found")
            
            if export_type == 'seed':
                encrypted_seed = wallet_data['encrypted_seed']
                return self._decrypt_data(encrypted_seed)
            elif export_type == 'private_key':
                encrypted_private_key = wallet_data['encrypted_private_key']
                return self._decrypt_data(encrypted_private_key)
            else:
                raise ValueError("Invalid export type. Use 'seed' or 'private_key'")
                
        except Exception as e:
            logger.error(f"Error exporting wallet: {str(e)}")
            raise Exception(f"Failed to export wallet: {str(e)}")
    
    def rotate_encryption_key(self, old_master_key: bytes, new_master_key: bytes):
        """Rotate encryption key for all stored wallets"""
        try:
            old_fernet = Fernet(old_master_key)
            new_fernet = Fernet(new_master_key)
            
            # Get all users with custodial wallets
            users = User.query.filter_by(wallet_type='custodial').all()
            
            for user in users:
                wallet_data = self._get_wallet_data(user.id)
                if wallet_data:
                    # Decrypt with old key
                    seed = old_fernet.decrypt(wallet_data['encrypted_seed'].encode()).decode()
                    private_key = old_fernet.decrypt(wallet_data['encrypted_private_key'].encode()).decode()
                    
                    # Re-encrypt with new key
                    wallet_data['encrypted_seed'] = new_fernet.encrypt(seed.encode()).decode()
                    wallet_data['encrypted_private_key'] = new_fernet.encrypt(private_key.encode()).decode()
                    
                    # Store updated data
                    self._store_wallet_data(user.id, wallet_data)
            
            # Update master key
            self.master_key = new_master_key
            self.fernet = new_fernet
            
            logger.info("Successfully rotated encryption key for all wallets")
            
        except Exception as e:
            logger.error(f"Error rotating encryption key: {str(e)}")
            raise Exception(f"Failed to rotate encryption key: {str(e)}")
    
    def validate_wallet_integrity(self, user_id: str) -> bool:
        """Validate wallet data integrity"""
        try:
            user = User.query.get(user_id)
            if not user or user.wallet_type != 'custodial':
                return True  # Non-custodial wallets don't store keys
            
            wallet_data = self._get_wallet_data(user_id)
            if not wallet_data:
                return False
            
            # Decrypt and recreate wallet
            seed = self._decrypt_data(wallet_data['encrypted_seed'])
            wallet = Wallet.from_seed(seed)
            
            # Verify address matches
            if wallet.address != user.wallet_address:
                logger.error(f"Wallet integrity check failed for user {user_id}: address mismatch")
                return False
            
            # Verify public key matches
            if wallet.public_key != wallet_data['public_key']:
                logger.error(f"Wallet integrity check failed for user {user_id}: public key mismatch")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating wallet integrity: {str(e)}")
            return False
    
    def _encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        try:
            encrypted_data = self.fernet.encrypt(data.encode())
            return encrypted_data.decode()
        except Exception as e:
            logger.error(f"Error encrypting data: {str(e)}")
            raise Exception("Encryption failed")
    
    def _decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        try:
            decrypted_data = self.fernet.decrypt(encrypted_data.encode())
            return decrypted_data.decode()
        except Exception as e:
            logger.error(f"Error decrypting data: {str(e)}")
            raise Exception("Decryption failed")
    
    def _store_wallet_data(self, user_id: str, wallet_data: Dict[str, Any]):
        """Store wallet data securely"""
        try:
            # In production, this should use a dedicated secure storage system
            # For now, we'll store in a separate file with restricted permissions
            
            storage_dir = os.path.join(os.path.dirname(__file__), '..', 'secure_storage')
            os.makedirs(storage_dir, mode=0o700, exist_ok=True)
            
            wallet_file = os.path.join(storage_dir, f'wallet_{user_id}.json')
            
            with open(wallet_file, 'w') as f:
                json.dump(wallet_data, f)
            
            # Set restrictive permissions
            os.chmod(wallet_file, 0o600)
            
        except Exception as e:
            logger.error(f"Error storing wallet data: {str(e)}")
            raise Exception("Failed to store wallet data")
    
    def _get_wallet_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve wallet data"""
        try:
            storage_dir = os.path.join(os.path.dirname(__file__), '..', 'secure_storage')
            wallet_file = os.path.join(storage_dir, f'wallet_{user_id}.json')
            
            if not os.path.exists(wallet_file):
                return None
            
            with open(wallet_file, 'r') as f:
                return json.load(f)
                
        except Exception as e:
            logger.error(f"Error retrieving wallet data: {str(e)}")
            return None
    
    def delete_wallet_data(self, user_id: str):
        """Securely delete wallet data"""
        try:
            storage_dir = os.path.join(os.path.dirname(__file__), '..', 'secure_storage')
            wallet_file = os.path.join(storage_dir, f'wallet_{user_id}.json')
            
            if os.path.exists(wallet_file):
                # Overwrite file with random data before deletion
                file_size = os.path.getsize(wallet_file)
                with open(wallet_file, 'wb') as f:
                    f.write(os.urandom(file_size))
                
                os.remove(wallet_file)
                logger.info(f"Securely deleted wallet data for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error deleting wallet data: {str(e)}")
            raise Exception("Failed to delete wallet data")

# Global service instance
secure_wallet_service = SecureWalletService()

