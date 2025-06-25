import xrpl
from xrpl.clients import JsonRpcClient, WebsocketClient
from xrpl.wallet import Wallet
from xrpl.models.transactions import Payment, TrustSet
from xrpl.models.requests import AccountInfo, AccountLines, AccountTx
from xrpl.utils import xrp_to_drops, drops_to_xrp
from xrpl.constants import CryptoAlgorithm
import asyncio
import logging
from decimal import Decimal
from typing import Optional, Dict, List, Any
from src.config import Config

logger = logging.getLogger(__name__)

class XRPLService:
    """Service for interacting with XRP Ledger"""
    
    def __init__(self, server_url: str = None):
        self.server_url = server_url or Config.XRPL_SERVER
        self.client = JsonRpcClient(self.server_url)
        
    def create_wallet(self) -> Dict[str, str]:
        """Create a new XRP Ledger wallet"""
        try:
            wallet = Wallet.create(algorithm=CryptoAlgorithm.SECP256K1)
            
            return {
                'address': wallet.address,
                'public_key': wallet.public_key,
                'private_key': wallet.private_key,  # Store securely!
                'seed': wallet.seed
            }
        except Exception as e:
            logger.error(f"Error creating wallet: {str(e)}")
            raise Exception(f"Failed to create wallet: {str(e)}")
    
    def get_wallet_from_seed(self, seed: str) -> Wallet:
        """Recreate wallet from seed"""
        try:
            return Wallet.from_seed(seed)
        except Exception as e:
            logger.error(f"Error recreating wallet from seed: {str(e)}")
            raise Exception(f"Invalid wallet seed: {str(e)}")
    
    def get_account_info(self, address: str) -> Dict[str, Any]:
        """Get account information"""
        try:
            request = AccountInfo(account=address)
            response = self.client.request(request)
            
            if response.is_successful():
                account_data = response.result['account_data']
                return {
                    'address': account_data['Account'],
                    'balance': drops_to_xrp(account_data['Balance']),
                    'sequence': account_data['Sequence'],
                    'flags': account_data.get('Flags', 0),
                    'owner_count': account_data.get('OwnerCount', 0),
                    'previous_txn_id': account_data.get('PreviousTxnID'),
                    'reserve': Decimal('10'),  # Base reserve
                    'available_balance': Decimal(drops_to_xrp(account_data['Balance'])) - Decimal('10')
                }
            else:
                raise Exception(f"Failed to get account info: {response.result}")
                
        except Exception as e:
            logger.error(f"Error getting account info for {address}: {str(e)}")
            raise Exception(f"Failed to get account info: {str(e)}")
    
    def get_account_transactions(self, address: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get account transaction history"""
        try:
            request = AccountTx(account=address, limit=limit)
            response = self.client.request(request)
            
            if response.is_successful():
                transactions = []
                for tx in response.result.get('transactions', []):
                    tx_data = tx['tx']
                    meta = tx.get('meta', {})
                    
                    transactions.append({
                        'hash': tx_data['hash'],
                        'transaction_type': tx_data['TransactionType'],
                        'account': tx_data['Account'],
                        'destination': tx_data.get('Destination'),
                        'amount': self._parse_amount(tx_data.get('Amount')),
                        'fee': drops_to_xrp(tx_data['Fee']),
                        'sequence': tx_data['Sequence'],
                        'date': tx_data.get('date'),
                        'ledger_index': tx.get('ledger_index'),
                        'validated': tx.get('validated', False),
                        'result_code': meta.get('TransactionResult')
                    })
                
                return transactions
            else:
                raise Exception(f"Failed to get transactions: {response.result}")
                
        except Exception as e:
            logger.error(f"Error getting transactions for {address}: {str(e)}")
            raise Exception(f"Failed to get transactions: {str(e)}")
    
    def send_xrp(self, sender_wallet: Wallet, destination: str, amount: Decimal, 
                 destination_tag: int = None, memo: str = None) -> Dict[str, Any]:
        """Send XRP to another address"""
        try:
            # Validate amount
            if amount <= 0:
                raise ValueError("Amount must be positive")
            
            # Check sender balance
            sender_info = self.get_account_info(sender_wallet.address)
            if sender_info['available_balance'] < amount:
                raise ValueError("Insufficient balance")
            
            # Create payment transaction
            payment = Payment(
                account=sender_wallet.address,
                destination=destination,
                amount=xrp_to_drops(amount),
                destination_tag=destination_tag
            )
            
            # Add memo if provided
            if memo:
                payment.memos = [{"Memo": {"MemoData": memo.encode().hex()}}]
            
            # Submit transaction
            response = xrpl.transaction.submit_and_wait(payment, self.client, sender_wallet)
            
            if response.is_successful():
                result = response.result
                return {
                    'success': True,
                    'hash': result['hash'],
                    'ledger_index': result.get('ledger_index'),
                    'validated': result.get('validated', False),
                    'fee': drops_to_xrp(result['Fee']),
                    'amount_sent': amount,
                    'destination': destination
                }
            else:
                raise Exception(f"Transaction failed: {response.result}")
                
        except Exception as e:
            logger.error(f"Error sending XRP: {str(e)}")
            raise Exception(f"Failed to send XRP: {str(e)}")
    
    def get_token_balances(self, address: str) -> List[Dict[str, Any]]:
        """Get token balances for an account"""
        try:
            request = AccountLines(account=address)
            response = self.client.request(request)
            
            if response.is_successful():
                balances = []
                for line in response.result.get('lines', []):
                    balances.append({
                        'currency': line['currency'],
                        'issuer': line['account'],
                        'balance': Decimal(line['balance']),
                        'limit': Decimal(line['limit']) if line['limit'] != '0' else None,
                        'quality_in': line.get('quality_in'),
                        'quality_out': line.get('quality_out')
                    })
                
                return balances
            else:
                raise Exception(f"Failed to get token balances: {response.result}")
                
        except Exception as e:
            logger.error(f"Error getting token balances for {address}: {str(e)}")
            raise Exception(f"Failed to get token balances: {str(e)}")
    
    def create_trust_line(self, wallet: Wallet, currency: str, issuer: str, 
                         limit: Decimal = None) -> Dict[str, Any]:
        """Create a trust line for a token"""
        try:
            trust_set = TrustSet(
                account=wallet.address,
                limit_amount={
                    "currency": currency,
                    "issuer": issuer,
                    "value": str(limit) if limit else "1000000000"
                }
            )
            
            response = xrpl.transaction.submit_and_wait(trust_set, self.client, wallet)
            
            if response.is_successful():
                result = response.result
                return {
                    'success': True,
                    'hash': result['hash'],
                    'ledger_index': result.get('ledger_index'),
                    'validated': result.get('validated', False),
                    'currency': currency,
                    'issuer': issuer,
                    'limit': limit
                }
            else:
                raise Exception(f"Trust line creation failed: {response.result}")
                
        except Exception as e:
            logger.error(f"Error creating trust line: {str(e)}")
            raise Exception(f"Failed to create trust line: {str(e)}")
    
    def send_token(self, sender_wallet: Wallet, destination: str, currency: str, 
                   issuer: str, amount: Decimal, destination_tag: int = None) -> Dict[str, Any]:
        """Send tokens to another address"""
        try:
            # Create payment transaction for tokens
            payment = Payment(
                account=sender_wallet.address,
                destination=destination,
                amount={
                    "currency": currency,
                    "issuer": issuer,
                    "value": str(amount)
                },
                destination_tag=destination_tag
            )
            
            response = xrpl.transaction.submit_and_wait(payment, self.client, sender_wallet)
            
            if response.is_successful():
                result = response.result
                return {
                    'success': True,
                    'hash': result['hash'],
                    'ledger_index': result.get('ledger_index'),
                    'validated': result.get('validated', False),
                    'currency': currency,
                    'issuer': issuer,
                    'amount_sent': amount,
                    'destination': destination
                }
            else:
                raise Exception(f"Token transfer failed: {response.result}")
                
        except Exception as e:
            logger.error(f"Error sending token: {str(e)}")
            raise Exception(f"Failed to send token: {str(e)}")
    
    def _parse_amount(self, amount) -> Dict[str, Any]:
        """Parse amount from transaction (can be XRP or token)"""
        if isinstance(amount, str):
            # XRP amount in drops
            return {
                'currency': 'XRP',
                'value': drops_to_xrp(amount),
                'issuer': None
            }
        elif isinstance(amount, dict):
            # Token amount
            return {
                'currency': amount['currency'],
                'value': Decimal(amount['value']),
                'issuer': amount['issuer']
            }
        else:
            return {
                'currency': 'Unknown',
                'value': Decimal('0'),
                'issuer': None
            }
    
    def validate_address(self, address: str) -> bool:
        """Validate XRP Ledger address"""
        try:
            # Basic validation - XRP addresses start with 'r' and are 25-34 characters
            if not address.startswith('r') or len(address) < 25 or len(address) > 34:
                return False
            
            # Try to get account info to verify address exists
            try:
                self.get_account_info(address)
                return True
            except:
                # Address format might be valid but account doesn't exist yet
                return True
                
        except Exception:
            return False
    
    def estimate_fee(self) -> Decimal:
        """Get current network fee estimate"""
        try:
            # For now, return standard fee
            # In production, you might want to query server_info for current fee
            return Decimal('0.00001')  # 10 drops
        except Exception:
            return Decimal('0.00001')  # Fallback fee

class WalletService:
    """Service for managing user wallets"""
    
    def __init__(self):
        self.xrpl_service = XRPLService()
    
    def create_custodial_wallet(self, user_id: str) -> Dict[str, str]:
        """Create a custodial wallet for a user"""
        try:
            wallet_data = self.xrpl_service.create_wallet()
            
            # In production, encrypt and store private key securely
            # For now, we'll just return the address and store it in user record
            
            return {
                'address': wallet_data['address'],
                'wallet_type': 'custodial'
            }
            
        except Exception as e:
            logger.error(f"Error creating custodial wallet for user {user_id}: {str(e)}")
            raise Exception(f"Failed to create wallet: {str(e)}")
    
    def connect_external_wallet(self, user_id: str, address: str) -> Dict[str, str]:
        """Connect an external wallet to user account"""
        try:
            # Validate the address
            if not self.xrpl_service.validate_address(address):
                raise ValueError("Invalid XRP Ledger address")
            
            return {
                'address': address,
                'wallet_type': 'non_custodial'
            }
            
        except Exception as e:
            logger.error(f"Error connecting external wallet for user {user_id}: {str(e)}")
            raise Exception(f"Failed to connect wallet: {str(e)}")
    
    def get_wallet_balance(self, address: str) -> Dict[str, Any]:
        """Get wallet balance and token holdings"""
        try:
            # Get XRP balance
            account_info = self.xrpl_service.get_account_info(address)
            
            # Get token balances
            token_balances = self.xrpl_service.get_token_balances(address)
            
            return {
                'address': address,
                'xrp_balance': account_info['balance'],
                'available_balance': account_info['available_balance'],
                'reserve': account_info['reserve'],
                'token_balances': token_balances,
                'owner_count': account_info['owner_count']
            }
            
        except Exception as e:
            logger.error(f"Error getting wallet balance for {address}: {str(e)}")
            raise Exception(f"Failed to get wallet balance: {str(e)}")
    
    def get_transaction_history(self, address: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get transaction history for a wallet"""
        try:
            return self.xrpl_service.get_account_transactions(address, limit)
        except Exception as e:
            logger.error(f"Error getting transaction history for {address}: {str(e)}")
            raise Exception(f"Failed to get transaction history: {str(e)}")

# Global service instances
xrpl_service = XRPLService()
wallet_service = WalletService()

