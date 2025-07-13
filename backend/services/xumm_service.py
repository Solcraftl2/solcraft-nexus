"""
Solcraft Nexus - XUMM Wallet Service
Real wallet integration for XRPL transactions
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import xumm
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)


class XUMMService:
    """Service for XUMM wallet integration"""
    
    def __init__(self):
        self.api_key = os.getenv("XUMM_API_KEY")
        self.api_secret = os.getenv("XUMM_API_SECRET")
        
        if not self.api_key or not self.api_secret:
            logger.warning("XUMM API credentials not found. Some features will be disabled.")
            self.sdk = None
        else:
            try:
                self.sdk = xumm.XummSdk(self.api_key, self.api_secret)
                logger.info("XUMM SDK initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing XUMM SDK: {str(e)}")
                self.sdk = None
    
    def is_available(self) -> bool:
        """Check if XUMM service is available"""
        return self.sdk is not None
    
    async def create_sign_request(self, transaction: Dict[str, Any], 
                                user_token: Optional[str] = None) -> Dict[str, Any]:
        """Create XUMM sign request payload"""
        if not self.is_available():
            return {"success": False, "error": "XUMM service not available"}
        
        try:
            payload_data = {
                "txjson": transaction,
                "options": {
                    "submit": True,
                    "multisign": False,
                    "expire": 5  # 5 minutes expiration
                }
            }
            
            # Add user token if provided (for push notifications)
            if user_token:
                payload_data["user_token"] = user_token
            
            payload = self.sdk.payload.create(payload_data)
            
            return {
                "success": True,
                "payload_uuid": payload.uuid,
                "qr_url": payload.refs.qr_png,
                "websocket_url": payload.refs.websocket_status,
                "deep_link": payload.next.always,
                "expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat() + "Z",  # 5 minutes from now
                "created_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error creating XUMM sign request: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_payload_status(self, payload_uuid: str) -> Dict[str, Any]:
        """Get payload status and result"""
        if not self.is_available():
            return {"success": False, "error": "XUMM service not available"}
        
        try:
            payload = self.sdk.payload.get(payload_uuid)
            
            result = {
                "success": True,
                "payload_uuid": payload_uuid,
                "signed": payload.meta.signed,
                "cancelled": payload.meta.cancelled,
                "expired": payload.meta.expired,
                "opened": payload.meta.opened,
                "return_url_app": payload.meta.return_url_app,
                "return_url_web": payload.meta.return_url_web
            }
            
            # Add transaction details if signed
            if payload.meta.signed:
                result.update({
                    "tx_id": payload.response.txid,
                    "account": payload.response.account,
                    "signer": payload.response.signer,
                    "network_id": payload.response.network_id
                })
            
            return result
        except Exception as e:
            logger.error(f"Error getting payload status: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def cancel_payload(self, payload_uuid: str) -> Dict[str, Any]:
        """Cancel an active payload"""
        if not self.is_available():
            return {"success": False, "error": "XUMM service not available"}
        
        try:
            result = self.sdk.payload.cancel(payload_uuid)
            return {
                "success": True,
                "cancelled": result.cancelled,
                "reason": result.reason
            }
        except Exception as e:
            logger.error(f"Error cancelling payload: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def create_trustline_request(self, user_account: str, token_currency: str,
                                     issuer: str, limit: str = "1000000") -> Dict[str, Any]:
        """Create trustline sign request for tokenization"""
        transaction = {
            "TransactionType": "TrustSet",
            "Account": user_account,
            "LimitAmount": {
                "currency": token_currency,
                "issuer": issuer,
                "value": limit
            },
            "Fee": "12"
        }
        
        return await self.create_sign_request(transaction)
    
    async def create_payment_request(self, from_account: str, to_account: str,
                                   amount: str, currency: str = "XRP", 
                                   issuer: Optional[str] = None) -> Dict[str, Any]:
        """Create payment sign request"""
        if currency == "XRP":
            # XRP payment in drops
            amount_value = str(int(float(amount) * 1000000))
        else:
            # Token payment
            amount_value = {
                "currency": currency,
                "issuer": issuer,
                "value": amount
            }
        
        transaction = {
            "TransactionType": "Payment",
            "Account": from_account,
            "Destination": to_account,
            "Amount": amount_value,
            "Fee": "12"
        }
        
        return await self.create_sign_request(transaction)
    
    async def create_offer_request(self, account: str, taker_gets: Dict,
                                 taker_pays: Dict) -> Dict[str, Any]:
        """Create trading offer sign request"""
        transaction = {
            "TransactionType": "OfferCreate",
            "Account": account,
            "TakerGets": taker_gets,
            "TakerPays": taker_pays,
            "Fee": "12"
        }
        
        return await self.create_sign_request(transaction)
    
    async def get_user_tokens(self, user_token: str) -> Dict[str, Any]:
        """Get user tokens (if user is signed in via XUMM)"""
        if not self.is_available():
            return {"success": False, "error": "XUMM service not available"}
        
        try:
            user_token_data = self.sdk.user.get_token_data(user_token)
            return {
                "success": True,
                "account": user_token_data.account,
                "network_type": user_token_data.network_type,
                "network_endpoint": user_token_data.network_endpoint,
                "picture": user_token_data.picture,
                "name": user_token_data.name
            }
        except Exception as e:
            logger.error(f"Error getting user tokens: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def verify_user_account(self, account: str, user_token: str) -> Dict[str, Any]:
        """Verify that user owns the account"""
        if not self.is_available():
            return {"success": False, "error": "XUMM service not available"}
        
        try:
            user_data = await self.get_user_tokens(user_token)
            if user_data["success"]:
                verified = user_data["account"] == account
                return {
                    "success": True,
                    "verified": verified,
                    "account": account,
                    "user_account": user_data["account"]
                }
            else:
                return user_data
        except Exception as e:
            logger.error(f"Error verifying user account: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_kyc_status(self, user_token: str) -> Dict[str, Any]:
        """Get user KYC status (if available)"""
        if not self.is_available():
            return {"success": False, "error": "XUMM service not available"}
        
        try:
            # Note: KYC features may require specific XUMM API permissions
            kyc_status = self.sdk.misc.get_kyc_status(user_token)
            return {
                "success": True,
                "kyc_approved": kyc_status.kyc_approved,
                "possible": kyc_status.possible
            }
        except Exception as e:
            logger.error(f"Error getting KYC status: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def send_ping(self, user_token: str, subtitle: str, body: str) -> Dict[str, Any]:
        """Send push notification to user"""
        if not self.is_available():
            return {"success": False, "error": "XUMM service not available"}
        
        try:
            ping_result = self.sdk.misc.ping(user_token, {
                "subtitle": subtitle,
                "body": body
            })
            return {
                "success": True,
                "pushed": ping_result.pushed,
                "uuid": ping_result.uuid
            }
        except Exception as e:
            logger.error(f"Error sending ping: {str(e)}")
            return {"success": False, "error": str(e)}

# Global service instance
xumm_service = XUMMService()