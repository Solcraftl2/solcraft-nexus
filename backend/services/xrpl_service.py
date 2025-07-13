"""
Solcraft Nexus - XRPL Service
Advanced Web3 tokenization platform service for XRPL mainnet
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import xrpl
from xrpl.models import Payment, TrustSet, OfferCreate, AccountSet
from xrpl.clients import JsonRpcClient, WebsocketClient
from xrpl.wallet import Wallet
from xrpl.transaction import autofill_and_sign, reliable_submission
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)


class XRPLService:
    """Service for XRPL mainnet operations"""
    
    def __init__(self):
        self.network = os.getenv("XRPL_NETWORK", "mainnet")
        self.websocket_url = os.getenv("XRPL_WEBSOCKET_URL", "wss://xrplcluster.com/")
        self.json_rpc_url = os.getenv("XRPL_JSON_RPC_URL", "https://xrplcluster.com/")
        self.client = JsonRpcClient(self.json_rpc_url)
        self.solcraft_symbol = os.getenv("SOLCRAFT_TOKEN_SYMBOL", "SOLCRAFT")
        
    async def get_account_info(self, account_address: str) -> Dict[str, Any]:
        """Get account information from XRPL"""
        try:
            async with JsonRpcClient(self.json_rpc_url) as client:
                account_info = await client.request(xrpl.models.requests.AccountInfo(
                    account=account_address,
                    ledger_index="validated"
                ))
                return {
                    "success": True,
                    "account": account_info.result["account_data"],
                    "balance_xrp": float(account_info.result["account_data"]["Balance"]) / 1000000
                }
        except Exception as e:
            logger.error(f"Error getting account info: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_account_tokens(self, account_address: str) -> Dict[str, Any]:
        """Get account token balances (trustlines)"""
        try:
            async with JsonRpcClient(self.json_rpc_url) as client:
                account_lines = await client.request(xrpl.models.requests.AccountLines(
                    account=account_address,
                    ledger_index="validated"
                ))
                
                tokens = []
                for line in account_lines.result.get("lines", []):
                    tokens.append({
                        "currency": line["currency"],
                        "issuer": line["account"],
                        "balance": float(line["balance"]),
                        "limit": float(line["limit"]) if line["limit"] != "0" else None
                    })
                
                return {
                    "success": True,
                    "tokens": tokens,
                    "count": len(tokens)
                }
        except Exception as e:
            logger.error(f"Error getting account tokens: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def create_trustline_transaction(self, account: str, token_currency: str, 
                                         issuer: str, limit: str = "1000000") -> Dict[str, Any]:
        """Create trustline transaction payload for token"""
        try:
            # Get account sequence
            account_info = await self.get_account_info(account)
            if not account_info["success"]:
                return account_info
            
            # Create TrustSet transaction
            trust_set = TrustSet(
                account=account,
                limit_amount=xrpl.models.amounts.IssuedCurrencyAmount(
                    currency=token_currency,
                    issuer=issuer,
                    value=limit
                ),
                fee="12"  # 12 drops
            )
            
            return {
                "success": True,
                "transaction": trust_set.to_dict(),
                "transaction_type": "TrustSet",
                "currency": token_currency,
                "issuer": issuer,
                "limit": limit
            }
        except Exception as e:
            logger.error(f"Error creating trustline transaction: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def create_token_payment_transaction(self, from_account: str, to_account: str,
                                             amount: str, currency: str, issuer: str) -> Dict[str, Any]:
        """Create token payment transaction"""
        try:
            payment = Payment(
                account=from_account,
                destination=to_account,
                amount=xrpl.models.amounts.IssuedCurrencyAmount(
                    currency=currency,
                    issuer=issuer,
                    value=amount
                ),
                fee="12"
            )
            
            return {
                "success": True,
                "transaction": payment.to_dict(),
                "transaction_type": "Payment",
                "amount": amount,
                "currency": currency,
                "issuer": issuer,
                "from": from_account,
                "to": to_account
            }
        except Exception as e:
            logger.error(f"Error creating payment transaction: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def create_xrp_payment_transaction(self, from_account: str, to_account: str,
                                           amount_xrp: float) -> Dict[str, Any]:
        """Create XRP payment transaction"""
        try:
            # Convert XRP to drops (1 XRP = 1,000,000 drops)
            amount_drops = str(int(amount_xrp * 1000000))
            
            payment = Payment(
                account=from_account,
                destination=to_account,
                amount=amount_drops,
                fee="12"
            )
            
            return {
                "success": True,
                "transaction": payment.to_dict(),
                "transaction_type": "Payment",
                "amount_xrp": amount_xrp,
                "amount_drops": amount_drops,
                "from": from_account,
                "to": to_account
            }
        except Exception as e:
            logger.error(f"Error creating XRP payment transaction: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def create_token_offer_transaction(self, account: str, taker_gets: Dict,
                                           taker_pays: Dict) -> Dict[str, Any]:
        """Create token trading offer transaction"""
        try:
            offer = OfferCreate(
                account=account,
                taker_gets=taker_gets,
                taker_pays=taker_pays,
                fee="12"
            )
            
            return {
                "success": True,
                "transaction": offer.to_dict(),
                "transaction_type": "OfferCreate",
                "taker_gets": taker_gets,
                "taker_pays": taker_pays
            }
        except Exception as e:
            logger.error(f"Error creating offer transaction: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_orderbook(self, taker_gets: Dict, taker_pays: Dict) -> Dict[str, Any]:
        """Get orderbook for token pair"""
        try:
            book_offers = self.client.request(xrpl.models.requests.BookOffers(
                taker_gets=taker_gets,
                taker_pays=taker_pays,
                ledger_index="validated",
                limit=20
            ))
            
            offers = []
            for offer in book_offers.result.get("offers", []):
                offers.append({
                    "account": offer["Account"],
                    "sequence": offer["Sequence"],
                    "taker_gets": offer["TakerGets"],
                    "taker_pays": offer["TakerPays"],
                    "quality": offer.get("quality")
                })
            
            return {
                "success": True,
                "offers": offers,
                "count": len(offers)
            }
        except Exception as e:
            logger.error(f"Error getting orderbook: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_transaction_history(self, account: str, limit: int = 20) -> Dict[str, Any]:
        """Get account transaction history"""
        try:
            account_tx = self.client.request(xrpl.models.requests.AccountTx(
                account=account,
                ledger_index_min=-1,
                ledger_index_max=-1,
                limit=limit
            ))
            
            transactions = []
            for tx in account_tx.result.get("transactions", []):
                tx_data = tx["tx"]
                meta_data = tx["meta"]
                
                transactions.append({
                    "hash": tx_data["hash"],
                    "transaction_type": tx_data["TransactionType"],
                    "account": tx_data["Account"],
                    "destination": tx_data.get("Destination"),
                    "amount": tx_data.get("Amount"),
                    "fee": tx_data["Fee"],
                    "date": tx_data.get("date"),
                    "ledger_index": tx["ledger_index"],
                    "validated": tx["validated"],
                    "meta": meta_data
                })
            
            return {
                "success": True,
                "transactions": transactions,
                "count": len(transactions)
            }
        except Exception as e:
            logger.error(f"Error getting transaction history: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_token_metrics(self, currency: str, issuer: str) -> Dict[str, Any]:
        """Get token metrics and statistics"""
        try:
            # Get gateway balances (total issued tokens)
            gateway_balances = self.client.request(xrpl.models.requests.GatewayBalances(
                account=issuer,
                ledger_index="validated"
            ))
            
            # Get account lines to count holders
            account_lines = self.client.request(xrpl.models.requests.AccountLines(
                account=issuer,
                ledger_index="validated"
            ))
            
            total_supply = 0
            holder_count = 0
            
            # Calculate metrics from gateway balances
            obligations = gateway_balances.result.get("obligations", {})
            if currency in obligations:
                total_supply = float(obligations[currency])
            
            # Count token holders from account lines
            for line in account_lines.result.get("lines", []):
                if line["currency"] == currency and float(line["balance"]) > 0:
                    holder_count += 1
            
            return {
                "success": True,
                "currency": currency,
                "issuer": issuer,
                "total_supply": total_supply,
                "holder_count": holder_count,
                "circulating_supply": total_supply  # For tokens, this is typically the same
            }
        except Exception as e:
            logger.error(f"Error getting token metrics: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def validate_address(self, address: str) -> Dict[str, Any]:
        """Validate XRPL address format"""
        try:
            from xrpl.core import addresscodec
            is_valid = addresscodec.is_valid_classic_address(address)
            
            return {
                "success": True,
                "valid": is_valid,
                "address": address,
                "format": "classic" if is_valid else "invalid"
            }
        except Exception as e:
            logger.error(f"Error validating address: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def format_currency_amount(self, amount: Any) -> Dict[str, Any]:
        """Format currency amount for display"""
        if isinstance(amount, str):
            # XRP amount in drops
            return {
                "currency": "XRP",
                "value": float(amount) / 1000000,
                "formatted": f"{float(amount) / 1000000:.6f} XRP"
            }
        elif isinstance(amount, dict):
            # Issued currency
            return {
                "currency": amount["currency"],
                "issuer": amount["issuer"],
                "value": float(amount["value"]),
                "formatted": f"{float(amount['value'])} {amount['currency']}"
            }
        else:
            return {"currency": "Unknown", "value": 0, "formatted": "0"}

# Global service instance
xrpl_service = XRPLService()