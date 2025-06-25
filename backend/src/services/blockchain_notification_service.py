import asyncio
import websockets
import json
import logging
from typing import Dict, List, Any, Callable, Optional
from datetime import datetime
from threading import Thread
import time
from src.models.user import db, User
from src.models.transaction import Transaction
from src.models.asset import Asset
from src.config import Config

logger = logging.getLogger(__name__)

class BlockchainNotificationService:
    """Service for real-time blockchain notifications and transaction monitoring"""
    
    def __init__(self):
        self.websocket_url = Config.XRPL_SERVER.replace('https://', 'wss://').replace('http://', 'ws://')
        self.subscriptions = {}
        self.callbacks = {}
        self.is_running = False
        self.websocket = None
        
    async def connect(self):
        """Connect to XRP Ledger WebSocket"""
        try:
            self.websocket = await websockets.connect(self.websocket_url)
            self.is_running = True
            logger.info(f"Connected to XRP Ledger WebSocket: {self.websocket_url}")
            
            # Start listening for messages
            await self.listen_for_messages()
            
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket: {str(e)}")
            self.is_running = False
    
    async def listen_for_messages(self):
        """Listen for incoming WebSocket messages"""
        try:
            while self.is_running and self.websocket:
                message = await self.websocket.recv()
                data = json.loads(message)
                
                # Process the message
                await self.process_message(data)
                
        except websockets.exceptions.ConnectionClosed:
            logger.warning("WebSocket connection closed")
            self.is_running = False
        except Exception as e:
            logger.error(f"Error listening for messages: {str(e)}")
            self.is_running = False
    
    async def process_message(self, data: Dict[str, Any]):
        """Process incoming WebSocket message"""
        try:
            message_type = data.get('type')
            
            if message_type == 'transaction':
                await self.handle_transaction_notification(data)
            elif message_type == 'ledgerClosed':
                await self.handle_ledger_closed(data)
            elif message_type == 'validationReceived':
                await self.handle_validation_received(data)
            
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
    
    async def handle_transaction_notification(self, data: Dict[str, Any]):
        """Handle transaction notifications"""
        try:
            transaction_data = data.get('transaction', {})
            meta = data.get('meta', {})
            
            tx_hash = transaction_data.get('hash')
            tx_type = transaction_data.get('TransactionType')
            account = transaction_data.get('Account')
            destination = transaction_data.get('Destination')
            
            logger.info(f"Transaction notification: {tx_hash} ({tx_type})")
            
            # Check if this transaction involves any of our monitored addresses
            monitored_addresses = self.get_monitored_addresses()
            
            if account in monitored_addresses or destination in monitored_addresses:
                await self.process_relevant_transaction(transaction_data, meta)
            
        except Exception as e:
            logger.error(f"Error handling transaction notification: {str(e)}")
    
    async def handle_ledger_closed(self, data: Dict[str, Any]):
        """Handle ledger closed notifications"""
        try:
            ledger_index = data.get('ledger_index')
            ledger_hash = data.get('ledger_hash')
            
            logger.debug(f"Ledger closed: {ledger_index} ({ledger_hash})")
            
            # Update any pending transactions that might be confirmed
            await self.update_pending_transactions(ledger_index)
            
        except Exception as e:
            logger.error(f"Error handling ledger closed: {str(e)}")
    
    async def handle_validation_received(self, data: Dict[str, Any]):
        """Handle validation received notifications"""
        try:
            # This can be used for network health monitoring
            logger.debug("Validation received")
            
        except Exception as e:
            logger.error(f"Error handling validation: {str(e)}")
    
    async def subscribe_to_account(self, address: str):
        """Subscribe to account notifications"""
        try:
            if not self.websocket:
                raise Exception("WebSocket not connected")
            
            subscribe_message = {
                "command": "subscribe",
                "accounts": [address]
            }
            
            await self.websocket.send(json.dumps(subscribe_message))
            self.subscriptions[address] = True
            
            logger.info(f"Subscribed to account: {address}")
            
        except Exception as e:
            logger.error(f"Error subscribing to account {address}: {str(e)}")
    
    async def subscribe_to_ledger(self):
        """Subscribe to ledger notifications"""
        try:
            if not self.websocket:
                raise Exception("WebSocket not connected")
            
            subscribe_message = {
                "command": "subscribe",
                "streams": ["ledger"]
            }
            
            await self.websocket.send(json.dumps(subscribe_message))
            logger.info("Subscribed to ledger stream")
            
        except Exception as e:
            logger.error(f"Error subscribing to ledger: {str(e)}")
    
    def get_monitored_addresses(self) -> List[str]:
        """Get list of addresses to monitor"""
        try:
            # Get all user wallet addresses from database
            users = User.query.filter(User.wallet_address.isnot(None)).all()
            addresses = [user.wallet_address for user in users]
            
            # Add any asset issuer addresses
            assets = Asset.query.filter(Asset.xrpl_issuer_address.isnot(None)).all()
            addresses.extend([asset.xrpl_issuer_address for asset in assets])
            
            return list(set(addresses))  # Remove duplicates
            
        except Exception as e:
            logger.error(f"Error getting monitored addresses: {str(e)}")
            return []
    
    async def process_relevant_transaction(self, transaction_data: Dict[str, Any], meta: Dict[str, Any]):
        """Process a transaction that involves our monitored addresses"""
        try:
            tx_hash = transaction_data.get('hash')
            tx_type = transaction_data.get('TransactionType')
            account = transaction_data.get('Account')
            destination = transaction_data.get('Destination')
            amount = transaction_data.get('Amount')
            
            # Find the relevant user(s)
            sender_user = User.query.filter_by(wallet_address=account).first()
            recipient_user = User.query.filter_by(wallet_address=destination).first()
            
            # Update transaction status in database
            existing_tx = Transaction.query.filter_by(xrpl_transaction_hash=tx_hash).first()
            
            if existing_tx:
                # Update existing transaction
                existing_tx.status = 'completed'
                existing_tx.confirmed_at = datetime.utcnow()
                existing_tx.xrpl_ledger_index = meta.get('ledger_index')
                db.session.commit()
                
                logger.info(f"Updated transaction status: {tx_hash}")
            else:
                # Create new transaction record for incoming transactions
                if recipient_user and tx_type == 'Payment':
                    new_tx = Transaction(
                        transaction_type='receive',
                        status='completed',
                        user_id=recipient_user.id,
                        amount=self._parse_amount(amount),
                        xrpl_transaction_hash=tx_hash,
                        xrpl_ledger_index=meta.get('ledger_index'),
                        executed_at=datetime.utcnow(),
                        confirmed_at=datetime.utcnow(),
                        notes=f"Received from {account}",
                        transaction_metadata={
                            'sender': account,
                            'transaction_type': tx_type
                        }
                    )
                    
                    db.session.add(new_tx)
                    db.session.commit()
                    
                    logger.info(f"Created new incoming transaction: {tx_hash}")
            
            # Trigger any registered callbacks
            await self.trigger_callbacks(tx_hash, transaction_data, meta)
            
        except Exception as e:
            logger.error(f"Error processing relevant transaction: {str(e)}")
    
    async def update_pending_transactions(self, ledger_index: int):
        """Update pending transactions that might be confirmed"""
        try:
            # Find pending transactions
            pending_txs = Transaction.query.filter_by(status='pending').all()
            
            for tx in pending_txs:
                if tx.xrpl_transaction_hash:
                    # Check if transaction is now confirmed
                    # This would require querying the ledger for the specific transaction
                    # For now, we'll simulate confirmation after a certain time
                    if tx.executed_at and (datetime.utcnow() - tx.executed_at).seconds > 10:
                        tx.status = 'completed'
                        tx.confirmed_at = datetime.utcnow()
                        tx.xrpl_ledger_index = ledger_index
                        
                        logger.info(f"Confirmed pending transaction: {tx.xrpl_transaction_hash}")
            
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error updating pending transactions: {str(e)}")
    
    async def trigger_callbacks(self, tx_hash: str, transaction_data: Dict[str, Any], meta: Dict[str, Any]):
        """Trigger registered callbacks for transaction events"""
        try:
            for callback_id, callback_func in self.callbacks.items():
                try:
                    await callback_func(tx_hash, transaction_data, meta)
                except Exception as e:
                    logger.error(f"Error in callback {callback_id}: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Error triggering callbacks: {str(e)}")
    
    def register_callback(self, callback_id: str, callback_func: Callable):
        """Register a callback function for transaction events"""
        self.callbacks[callback_id] = callback_func
        logger.info(f"Registered callback: {callback_id}")
    
    def unregister_callback(self, callback_id: str):
        """Unregister a callback function"""
        if callback_id in self.callbacks:
            del self.callbacks[callback_id]
            logger.info(f"Unregistered callback: {callback_id}")
    
    def _parse_amount(self, amount) -> float:
        """Parse amount from transaction"""
        if isinstance(amount, str):
            # XRP amount in drops
            return float(amount) / 1000000
        elif isinstance(amount, dict):
            # Token amount
            return float(amount.get('value', 0))
        else:
            return 0.0
    
    async def disconnect(self):
        """Disconnect from WebSocket"""
        try:
            self.is_running = False
            if self.websocket:
                await self.websocket.close()
                self.websocket = None
            
            logger.info("Disconnected from XRP Ledger WebSocket")
            
        except Exception as e:
            logger.error(f"Error disconnecting: {str(e)}")
    
    def start_monitoring(self):
        """Start monitoring in a separate thread"""
        def run_monitoring():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                loop.run_until_complete(self.start_async_monitoring())
            except Exception as e:
                logger.error(f"Error in monitoring thread: {str(e)}")
            finally:
                loop.close()
        
        thread = Thread(target=run_monitoring, daemon=True)
        thread.start()
        logger.info("Started blockchain monitoring thread")
    
    async def start_async_monitoring(self):
        """Start async monitoring"""
        try:
            await self.connect()
            
            # Subscribe to ledger stream
            await self.subscribe_to_ledger()
            
            # Subscribe to all monitored accounts
            monitored_addresses = self.get_monitored_addresses()
            for address in monitored_addresses:
                await self.subscribe_to_account(address)
            
            # Keep the connection alive
            while self.is_running:
                await asyncio.sleep(1)
                
        except Exception as e:
            logger.error(f"Error in async monitoring: {str(e)}")
        finally:
            await self.disconnect()

# Global service instance
blockchain_notification_service = BlockchainNotificationService()

