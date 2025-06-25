import xrpl
from xrpl.models.transactions import Payment, TrustSet
from xrpl.models.requests import AccountInfo, AccountLines, AccountTx
from xrpl.wallet import Wallet
from xrpl.utils import xrp_to_drops
import json
import logging
from decimal import Decimal
from typing import Dict, List, Any, Optional
from datetime import datetime
from src.services.wallet_service import XRPLService
from src.models.asset import Asset, TokenHolding
from src.models.user import db, User
from src.models.transaction import Transaction

logger = logging.getLogger(__name__)

class TokenizationService:
    """Service for tokenizing assets on XRP Ledger using Multi-Purpose Tokens (MPT)"""
    
    def __init__(self):
        self.xrpl_service = XRPLService()
    
    def create_asset_token(self, asset_data: Dict[str, Any], issuer_wallet: Wallet) -> Dict[str, Any]:
        """Create a new token for an asset (simulated for demo)"""
        try:
            # For demo purposes, we'll simulate token creation
            # In production, this would use Multi-Purpose Tokens when available
            
            # Prepare token metadata
            metadata = self._prepare_token_metadata(asset_data)
            
            # Generate a simulated MPT ID
            import hashlib
            import time
            token_data = f"{asset_data['name']}{asset_data['symbol']}{issuer_wallet.address}{time.time()}"
            mpt_id = f"MPT_{hashlib.md5(token_data.encode()).hexdigest()[:16].upper()}"
            
            # Simulate successful token creation
            result = {
                'success': True,
                'mpt_id': mpt_id,
                'transaction_hash': f"demo_tokenization_{hashlib.md5(token_data.encode()).hexdigest()[:16]}",
                'ledger_index': 12345678,
                'issuer_address': issuer_wallet.address,
                'total_supply': asset_data['total_supply'],
                'metadata': metadata
            }
            
            logger.info(f"Simulated token creation for asset {asset_data['name']}: {mpt_id}")
            
            return result
                
        except Exception as e:
            logger.error(f"Error creating asset token: {str(e)}")
            raise Exception(f"Failed to create asset token: {str(e)}")
    
    def mint_tokens(self, mpt_id: str, issuer_wallet: Wallet, recipient: str, 
                   amount: Decimal, memo: str = None) -> Dict[str, Any]:
        """Mint new tokens to a recipient"""
        try:
            # Create mint transaction (using Payment with MPT)
            from xrpl.models.transactions import Payment
            
            payment = Payment(
                account=issuer_wallet.address,
                destination=recipient,
                amount={
                    "mpt_id": mpt_id,
                    "value": str(int(amount * 10**8))  # Convert to smallest unit
                }
            )
            
            if memo:
                payment.memos = [{"Memo": {"MemoData": memo.encode().hex()}}]
            
            response = xrpl.transaction.submit_and_wait(payment, self.xrpl_service.client, issuer_wallet)
            
            if response.is_successful():
                result = response.result
                return {
                    'success': True,
                    'transaction_hash': result['hash'],
                    'ledger_index': result.get('ledger_index'),
                    'mpt_id': mpt_id,
                    'recipient': recipient,
                    'amount_minted': amount
                }
            else:
                raise Exception(f"Token minting failed: {response.result}")
                
        except Exception as e:
            logger.error(f"Error minting tokens: {str(e)}")
            raise Exception(f"Failed to mint tokens: {str(e)}")
    
    def burn_tokens(self, mpt_id: str, holder_wallet: Wallet, amount: Decimal) -> Dict[str, Any]:
        """Burn tokens from holder's account"""
        try:
            # Create burn transaction (send to issuer with burn flag)
            from xrpl.models.transactions import Payment
            
            # Get MPT issuer address
            issuer_address = self._get_mpt_issuer(mpt_id)
            
            payment = Payment(
                account=holder_wallet.address,
                destination=issuer_address,
                amount={
                    "mpt_id": mpt_id,
                    "value": str(int(amount * 10**8))  # Convert to smallest unit
                },
                flags=0x00020000  # tfBurnToken flag
            )
            
            response = xrpl.transaction.submit_and_wait(payment, self.xrpl_service.client, holder_wallet)
            
            if response.is_successful():
                result = response.result
                return {
                    'success': True,
                    'transaction_hash': result['hash'],
                    'ledger_index': result.get('ledger_index'),
                    'mpt_id': mpt_id,
                    'amount_burned': amount
                }
            else:
                raise Exception(f"Token burning failed: {response.result}")
                
        except Exception as e:
            logger.error(f"Error burning tokens: {str(e)}")
            raise Exception(f"Failed to burn tokens: {str(e)}")
    
    def transfer_tokens(self, sender_wallet: Wallet, recipient: str, mpt_id: str, 
                       amount: Decimal, memo: str = None) -> Dict[str, Any]:
        """Transfer tokens between accounts"""
        try:
            from xrpl.models.transactions import Payment
            
            payment = Payment(
                account=sender_wallet.address,
                destination=recipient,
                amount={
                    "mpt_id": mpt_id,
                    "value": str(int(amount * 10**8))  # Convert to smallest unit
                }
            )
            
            if memo:
                payment.memos = [{"Memo": {"MemoData": memo.encode().hex()}}]
            
            response = xrpl.transaction.submit_and_wait(payment, self.xrpl_service.client, sender_wallet)
            
            if response.is_successful():
                result = response.result
                return {
                    'success': True,
                    'transaction_hash': result['hash'],
                    'ledger_index': result.get('ledger_index'),
                    'mpt_id': mpt_id,
                    'sender': sender_wallet.address,
                    'recipient': recipient,
                    'amount_transferred': amount
                }
            else:
                raise Exception(f"Token transfer failed: {response.result}")
                
        except Exception as e:
            logger.error(f"Error transferring tokens: {str(e)}")
            raise Exception(f"Failed to transfer tokens: {str(e)}")
    
    def get_token_info(self, mpt_id: str) -> Dict[str, Any]:
        """Get information about a token (simulated for demo)"""
        try:
            # For demo purposes, simulate token info
            # In production, this would query the actual MPT from the ledger
            
            return {
                'mpt_id': mpt_id,
                'issuer': 'rSimulatedIssuerAddress',
                'maximum_amount': '1000000000000000',  # 10^15 smallest units
                'outstanding_amount': '500000000000000',  # 5*10^14 smallest units
                'transfer_fee': 250,  # 0.25%
                'flags': 15,  # Simulated flags
                'metadata': 'Simulated metadata'
            }
                
        except Exception as e:
            logger.error(f"Error getting token info for {mpt_id}: {str(e)}")
            raise Exception(f"Failed to get token info: {str(e)}")
    
    def get_account_mpt_balances(self, address: str) -> List[Dict[str, Any]]:
        """Get MPT balances for an account"""
        try:
            # This would use a new request type for MPT balances
            # For now, we'll return empty list as MPT is still in development
            return []
            
        except Exception as e:
            logger.error(f"Error getting MPT balances for {address}: {str(e)}")
            raise Exception(f"Failed to get MPT balances: {str(e)}")
    
    def tokenize_asset(self, asset_id: str, issuer_user_id: str) -> Dict[str, Any]:
        """Complete tokenization process for an asset"""
        try:
            # Get asset from database
            asset = Asset.query.get(asset_id)
            if not asset:
                raise ValueError("Asset not found")
            
            # Get issuer user
            issuer_user = User.query.get(issuer_user_id)
            if not issuer_user:
                raise ValueError("Issuer user not found")
            
            # Check if user has permission to tokenize this asset
            if asset.issuer_id != issuer_user_id:
                raise ValueError("User not authorized to tokenize this asset")
            
            # Get or create issuer wallet
            if not issuer_user.wallet_address:
                # Create custodial wallet for user
                from src.services.wallet_service import wallet_service
                wallet_data = wallet_service.create_custodial_wallet(issuer_user_id)
                issuer_user.wallet_address = wallet_data['address']
                issuer_user.wallet_type = wallet_data['wallet_type']
                db.session.commit()
            
            # For demo purposes, we'll simulate the wallet
            # In production, you'd retrieve the actual wallet securely
            issuer_wallet = self._get_user_wallet(issuer_user)
            
            # Prepare asset data for tokenization
            asset_data = {
                'name': asset.name,
                'symbol': asset.symbol,
                'description': asset.description,
                'asset_type': asset.asset_type,
                'total_supply': asset.total_supply,
                'transfer_fee': 250,  # 0.25% transfer fee
                'metadata': {
                    'asset_id': asset.id,
                    'asset_type': asset.asset_type,
                    'estimated_value': str(asset.estimated_value),
                    'revenue_model': asset.revenue_model,
                    'location': asset.location,
                    'created_at': asset.created_at.isoformat()
                }
            }
            
            # Create the token on XRP Ledger
            token_result = self.create_asset_token(asset_data, issuer_wallet)
            
            if token_result['success']:
                # Update asset with blockchain information
                asset.xrpl_token_id = token_result['mpt_id']
                asset.xrpl_issuer_address = token_result['issuer_address']
                asset.tokenization_status = 'completed'
                asset.tokenized_at = datetime.utcnow()
                asset.status = 'active'
                
                # Create transaction record
                transaction = Transaction(
                    transaction_type='mint',
                    status='completed',
                    user_id=issuer_user_id,
                    asset_id=asset_id,
                    amount=asset.total_supply,
                    xrpl_transaction_hash=token_result['transaction_hash'],
                    executed_at=datetime.utcnow(),
                    confirmed_at=datetime.utcnow()
                )
                
                db.session.add(transaction)
                db.session.commit()
                
                return {
                    'success': True,
                    'asset_id': asset_id,
                    'mpt_id': token_result['mpt_id'],
                    'transaction_hash': token_result['transaction_hash'],
                    'issuer_address': token_result['issuer_address'],
                    'total_supply': asset.total_supply,
                    'message': 'Asset successfully tokenized'
                }
            else:
                raise Exception("Token creation failed")
                
        except Exception as e:
            # Update asset status to failed
            if 'asset' in locals():
                asset.tokenization_status = 'failed'
                db.session.commit()
            
            logger.error(f"Error tokenizing asset {asset_id}: {str(e)}")
            raise Exception(f"Failed to tokenize asset: {str(e)}")
    
    def _prepare_token_metadata(self, asset_data: Dict[str, Any]) -> str:
        """Prepare metadata for MPT creation"""
        metadata = {
            'name': asset_data['name'],
            'symbol': asset_data['symbol'],
            'description': asset_data.get('description', ''),
            'asset_type': asset_data.get('asset_type'),
            'created_by': 'SolCraft Nexus',
            'version': '1.0'
        }
        
        # Add custom metadata if provided
        if 'metadata' in asset_data:
            metadata.update(asset_data['metadata'])
        
        # Convert to hex-encoded JSON
        metadata_json = json.dumps(metadata, separators=(',', ':'))
        return metadata_json.encode().hex()
    
    def _calculate_token_flags(self, asset_data: Dict[str, Any]) -> int:
        """Calculate appropriate flags for the token based on asset type"""
        flags = 0
        
        # Default flags for most assets
        flags |= 0x00000001  # lsfMPTLocked (initially locked)
        flags |= 0x00000002  # lsfMPTCanEscrow (can be escrowed)
        flags |= 0x00000004  # lsfMPTCanTrade (can be traded)
        flags |= 0x00000008  # lsfMPTCanTransfer (can be transferred)
        
        # Asset-specific flags
        asset_type = asset_data.get('asset_type', '')
        
        if asset_type in ['real_estate', 'art', 'vehicle']:
            # Physical assets - require authorization for transfers
            flags |= 0x00000010  # lsfMPTRequireAuth
        
        if asset_type in ['commodity', 'energy']:
            # Consumable assets - can be burned
            flags |= 0x00000020  # lsfMPTCanClawback
        
        return flags
    
    def _extract_mpt_id_from_response(self, response: Dict[str, Any]) -> str:
        """Extract MPT ID from transaction response"""
        # This would extract the actual MPT ID from the transaction metadata
        # For now, we'll generate a placeholder
        return f"MPT_{response['hash'][:16]}"
    
    def _get_mpt_issuer(self, mpt_id: str) -> str:
        """Get the issuer address for an MPT"""
        # This would query the ledger for MPT information
        # For now, return a placeholder
        return "rIssuerAddressPlaceholder"
    
    def _get_user_wallet(self, user: User) -> Wallet:
        """Get user's wallet for transactions"""
        # In production, this would securely retrieve the user's wallet
        # For demo purposes, we'll create a test wallet
        from xrpl.wallet import Wallet
        return Wallet.create()

# Global service instance
tokenization_service = TokenizationService()

