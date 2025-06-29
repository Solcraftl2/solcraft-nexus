import os
import logging
from decimal import Decimal
from typing import Dict, Any
from web3 import Web3
from src.config import Config

logger = logging.getLogger(__name__)

class EthereumService:
    """Simple Ethereum service for sending ETH transactions"""

    def __init__(self, provider_url: str = None):
        url = provider_url or Config.ETH_PROVIDER_URL
        self.web3 = Web3(Web3.HTTPProvider(url))
        if not self.web3.is_connected():
            logger.warning("Web3 provider not connected: %s", url)

    def get_balance(self, address: str) -> Decimal:
        try:
            balance_wei = self.web3.eth.get_balance(address)
            return Decimal(self.web3.from_wei(balance_wei, 'ether'))
        except Exception as e:
            logger.error("Error getting ETH balance: %s", e)
            raise

    def send_eth(self, private_key: str, destination: str, amount: Decimal) -> Dict[str, Any]:
        try:
            account = self.web3.eth.account.from_key(private_key)
            nonce = self.web3.eth.get_transaction_count(account.address)
            tx = {
                'to': destination,
                'value': self.web3.to_wei(amount, 'ether'),
                'gas': 21000,
                'gasPrice': self.web3.eth.gas_price,
                'nonce': nonce,
            }
            signed = self.web3.eth.account.sign_transaction(tx, private_key)
            tx_hash = self.web3.eth.send_raw_transaction(signed.rawTransaction)
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            fee = Decimal(self.web3.from_wei(receipt.gasUsed * tx['gasPrice'], 'ether'))
            return {
                'success': receipt.status == 1,
                'hash': tx_hash.hex(),
                'fee': fee,
                'amount_sent': amount,
                'destination': destination,
            }
        except Exception as e:
            logger.error("Error sending ETH: %s", e)
            raise

ethereum_service = EthereumService()
