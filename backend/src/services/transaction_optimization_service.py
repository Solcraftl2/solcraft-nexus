import xrpl
from xrpl.models.requests import ServerInfo, Fee
from xrpl.models.transactions import Payment, TrustSet
from xrpl.utils import xrp_to_drops, drops_to_xrp
import logging
import time
from decimal import Decimal
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from src.services.wallet_service import XRPLService
from src.models.transaction import Transaction
from src.models.user import db

logger = logging.getLogger(__name__)

class TransactionOptimizationService:
    """Service for transaction fee optimization and advanced transaction management"""
    
    def __init__(self):
        self.xrpl_service = XRPLService()
        self.fee_cache = {}
        self.fee_cache_expiry = None
        self.network_stats = {}
        
    def get_optimal_fee(self, transaction_type: str = 'payment', priority: str = 'normal') -> Decimal:
        """Get optimal fee for transaction based on network conditions"""
        try:
            # Check cache first
            if self._is_fee_cache_valid():
                base_fee = self.fee_cache.get('base_fee', Decimal('0.00001'))
            else:
                base_fee = self._fetch_current_network_fee()
            
            # Adjust fee based on transaction type and priority
            multiplier = self._get_fee_multiplier(transaction_type, priority)
            optimal_fee = base_fee * multiplier
            
            # Ensure minimum fee
            min_fee = Decimal('0.00001')  # 10 drops
            optimal_fee = max(optimal_fee, min_fee)
            
            # Cap maximum fee for safety
            max_fee = Decimal('0.01')  # 10,000 drops
            optimal_fee = min(optimal_fee, max_fee)
            
            logger.debug(f"Optimal fee for {transaction_type} ({priority}): {optimal_fee} XRP")
            
            return optimal_fee
            
        except Exception as e:
            logger.error(f"Error calculating optimal fee: {str(e)}")
            return Decimal('0.00001')  # Fallback to minimum fee
    
    def _fetch_current_network_fee(self) -> Decimal:
        """Fetch current network fee from XRP Ledger"""
        try:
            # Get server info for fee information
            server_info_request = ServerInfo()
            response = self.xrpl_service.client.request(server_info_request)
            
            if response.is_successful():
                info = response.result.get('info', {})
                validated_ledger = info.get('validated_ledger', {})
                
                # Get base fee from validated ledger
                base_fee_xrp = validated_ledger.get('base_fee_xrp', 0.00001)
                reserve_base_xrp = validated_ledger.get('reserve_base_xrp', 10)
                reserve_inc_xrp = validated_ledger.get('reserve_inc_xrp', 2)
                
                # Update cache
                self.fee_cache = {
                    'base_fee': Decimal(str(base_fee_xrp)),
                    'reserve_base': Decimal(str(reserve_base_xrp)),
                    'reserve_inc': Decimal(str(reserve_inc_xrp)),
                    'load_factor': info.get('load_factor', 1)
                }
                self.fee_cache_expiry = datetime.utcnow() + timedelta(minutes=5)
                
                logger.debug(f"Updated fee cache: base_fee={base_fee_xrp} XRP")
                
                return Decimal(str(base_fee_xrp))
            else:
                logger.warning("Failed to get server info, using default fee")
                return Decimal('0.00001')
                
        except Exception as e:
            logger.error(f"Error fetching network fee: {str(e)}")
            return Decimal('0.00001')
    
    def _is_fee_cache_valid(self) -> bool:
        """Check if fee cache is still valid"""
        return (self.fee_cache_expiry and 
                datetime.utcnow() < self.fee_cache_expiry and 
                'base_fee' in self.fee_cache)
    
    def _get_fee_multiplier(self, transaction_type: str, priority: str) -> Decimal:
        """Get fee multiplier based on transaction type and priority"""
        # Base multipliers by transaction type
        type_multipliers = {
            'payment': Decimal('1.0'),
            'trust_set': Decimal('1.2'),
            'offer_create': Decimal('1.1'),
            'offer_cancel': Decimal('0.8'),
            'account_set': Decimal('1.0'),
            'token_mint': Decimal('1.5'),
            'token_burn': Decimal('1.3')
        }
        
        # Priority multipliers
        priority_multipliers = {
            'low': Decimal('0.8'),
            'normal': Decimal('1.0'),
            'high': Decimal('1.5'),
            'urgent': Decimal('2.0')
        }
        
        # Network load adjustment
        load_factor = self.fee_cache.get('load_factor', 1)
        load_multiplier = Decimal(str(min(load_factor, 10)))  # Cap at 10x
        
        base_multiplier = type_multipliers.get(transaction_type, Decimal('1.0'))
        priority_multiplier = priority_multipliers.get(priority, Decimal('1.0'))
        
        return base_multiplier * priority_multiplier * load_multiplier
    
    def estimate_transaction_cost(self, transaction_data: Dict[str, Any]) -> Dict[str, Decimal]:
        """Estimate total cost of a transaction including fees and reserves"""
        try:
            tx_type = transaction_data.get('type', 'payment')
            priority = transaction_data.get('priority', 'normal')
            amount = Decimal(str(transaction_data.get('amount', 0)))
            
            # Calculate fee
            fee = self.get_optimal_fee(tx_type, priority)
            
            # Calculate reserve requirements
            reserve_cost = self._calculate_reserve_cost(transaction_data)
            
            # Total cost
            total_cost = amount + fee + reserve_cost
            
            return {
                'amount': amount,
                'fee': fee,
                'reserve': reserve_cost,
                'total': total_cost,
                'currency': 'XRP'
            }
            
        except Exception as e:
            logger.error(f"Error estimating transaction cost: {str(e)}")
            return {
                'amount': Decimal('0'),
                'fee': Decimal('0.00001'),
                'reserve': Decimal('0'),
                'total': Decimal('0.00001'),
                'currency': 'XRP'
            }
    
    def _calculate_reserve_cost(self, transaction_data: Dict[str, Any]) -> Decimal:
        """Calculate additional reserve cost for transaction"""
        try:
            tx_type = transaction_data.get('type', 'payment')
            
            # Reserve costs for different transaction types
            if tx_type == 'trust_set':
                # Trust lines require reserve
                return self.fee_cache.get('reserve_inc', Decimal('2'))
            elif tx_type == 'offer_create':
                # Offers require reserve
                return self.fee_cache.get('reserve_inc', Decimal('2'))
            else:
                # Most transactions don't require additional reserve
                return Decimal('0')
                
        except Exception as e:
            logger.error(f"Error calculating reserve cost: {str(e)}")
            return Decimal('0')
    
    def optimize_transaction_timing(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Suggest optimal timing for transaction based on network conditions"""
        try:
            current_load = self.fee_cache.get('load_factor', 1)
            
            recommendations = {
                'current_load': current_load,
                'recommendation': 'proceed',
                'estimated_confirmation_time': '3-5 seconds',
                'suggested_fee_priority': 'normal'
            }
            
            if current_load > 5:
                recommendations.update({
                    'recommendation': 'wait',
                    'reason': 'High network load detected',
                    'estimated_confirmation_time': '10-30 seconds',
                    'suggested_fee_priority': 'high',
                    'suggested_wait_time': '5-10 minutes'
                })
            elif current_load > 2:
                recommendations.update({
                    'recommendation': 'proceed_with_caution',
                    'reason': 'Moderate network load',
                    'estimated_confirmation_time': '5-10 seconds',
                    'suggested_fee_priority': 'normal'
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error optimizing transaction timing: {str(e)}")
            return {
                'recommendation': 'proceed',
                'estimated_confirmation_time': '3-5 seconds',
                'suggested_fee_priority': 'normal'
            }
    
    def batch_transactions(self, transactions: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """Optimize transaction batching for efficiency"""
        try:
            # Group transactions by sender
            sender_groups = {}
            for tx in transactions:
                sender = tx.get('sender')
                if sender not in sender_groups:
                    sender_groups[sender] = []
                sender_groups[sender].append(tx)
            
            # Create optimized batches
            batches = []
            for sender, sender_txs in sender_groups.items():
                # Sort by priority and amount
                sender_txs.sort(key=lambda x: (
                    self._get_priority_score(x.get('priority', 'normal')),
                    -float(x.get('amount', 0))
                ))
                
                # Split into batches of reasonable size
                batch_size = 5  # Reasonable batch size for XRP Ledger
                for i in range(0, len(sender_txs), batch_size):
                    batch = sender_txs[i:i + batch_size]
                    batches.append(batch)
            
            return batches
            
        except Exception as e:
            logger.error(f"Error batching transactions: {str(e)}")
            return [[tx] for tx in transactions]  # Fallback to individual transactions
    
    def _get_priority_score(self, priority: str) -> int:
        """Get numeric score for priority"""
        priority_scores = {
            'urgent': 4,
            'high': 3,
            'normal': 2,
            'low': 1
        }
        return priority_scores.get(priority, 2)
    
    def monitor_transaction_status(self, tx_hash: str, timeout: int = 30) -> Dict[str, Any]:
        """Monitor transaction status until confirmation or timeout"""
        try:
            start_time = time.time()
            
            while time.time() - start_time < timeout:
                # Check transaction status
                status = self._check_transaction_status(tx_hash)
                
                if status['confirmed']:
                    return {
                        'status': 'confirmed',
                        'confirmation_time': time.time() - start_time,
                        'ledger_index': status.get('ledger_index'),
                        'result_code': status.get('result_code')
                    }
                elif status['failed']:
                    return {
                        'status': 'failed',
                        'error': status.get('error'),
                        'result_code': status.get('result_code')
                    }
                
                # Wait before next check
                time.sleep(1)
            
            # Timeout reached
            return {
                'status': 'timeout',
                'message': f'Transaction not confirmed within {timeout} seconds'
            }
            
        except Exception as e:
            logger.error(f"Error monitoring transaction: {str(e)}")
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def _check_transaction_status(self, tx_hash: str) -> Dict[str, Any]:
        """Check current status of a transaction"""
        try:
            from xrpl.models.requests import Tx
            
            tx_request = Tx(transaction=tx_hash)
            response = self.xrpl_service.client.request(tx_request)
            
            if response.is_successful():
                tx_data = response.result
                meta = tx_data.get('meta', {})
                
                return {
                    'confirmed': tx_data.get('validated', False),
                    'failed': meta.get('TransactionResult') != 'tesSUCCESS',
                    'ledger_index': tx_data.get('ledger_index'),
                    'result_code': meta.get('TransactionResult')
                }
            else:
                # Transaction not found yet
                return {
                    'confirmed': False,
                    'failed': False
                }
                
        except Exception as e:
            logger.error(f"Error checking transaction status: {str(e)}")
            return {
                'confirmed': False,
                'failed': False,
                'error': str(e)
            }
    
    def get_network_statistics(self) -> Dict[str, Any]:
        """Get current network statistics and health metrics"""
        try:
            server_info_request = ServerInfo()
            response = self.xrpl_service.client.request(server_info_request)
            
            if response.is_successful():
                info = response.result.get('info', {})
                validated_ledger = info.get('validated_ledger', {})
                
                stats = {
                    'ledger_index': validated_ledger.get('seq'),
                    'ledger_hash': validated_ledger.get('hash'),
                    'close_time': validated_ledger.get('close_time'),
                    'base_fee': validated_ledger.get('base_fee_xrp'),
                    'reserve_base': validated_ledger.get('reserve_base_xrp'),
                    'reserve_inc': validated_ledger.get('reserve_inc_xrp'),
                    'load_factor': info.get('load_factor'),
                    'server_state': info.get('server_state'),
                    'uptime': info.get('uptime'),
                    'peers': info.get('peers'),
                    'validation_quorum': info.get('validation_quorum')
                }
                
                # Update internal stats
                self.network_stats = stats
                
                return stats
            else:
                logger.warning("Failed to get network statistics")
                return {}
                
        except Exception as e:
            logger.error(f"Error getting network statistics: {str(e)}")
            return {}
    
    def suggest_fee_strategy(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Suggest fee strategy based on user profile and usage patterns"""
        try:
            transaction_volume = user_profile.get('monthly_tx_volume', 0)
            user_type = user_profile.get('user_type', 'individual')
            cost_sensitivity = user_profile.get('cost_sensitivity', 'medium')
            
            if user_type == 'enterprise' or transaction_volume > 1000:
                # High-volume users
                strategy = {
                    'default_priority': 'normal',
                    'batch_transactions': True,
                    'use_fee_optimization': True,
                    'monitor_network_load': True,
                    'suggested_reserve': Decimal('50')  # Higher reserve for reliability
                }
            elif cost_sensitivity == 'high':
                # Cost-sensitive users
                strategy = {
                    'default_priority': 'low',
                    'batch_transactions': True,
                    'use_fee_optimization': True,
                    'wait_for_low_load': True,
                    'suggested_reserve': Decimal('20')
                }
            else:
                # Regular users
                strategy = {
                    'default_priority': 'normal',
                    'batch_transactions': False,
                    'use_fee_optimization': False,
                    'suggested_reserve': Decimal('15')
                }
            
            return strategy
            
        except Exception as e:
            logger.error(f"Error suggesting fee strategy: {str(e)}")
            return {
                'default_priority': 'normal',
                'batch_transactions': False,
                'use_fee_optimization': False
            }

# Global service instance
transaction_optimization_service = TransactionOptimizationService()

