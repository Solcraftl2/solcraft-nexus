"""
Solcraft Nexus - Tokenization Service
Real asset tokenization on XRPL with Supabase PostgreSQL
"""

import os
import json
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from services.xrpl_service import xrpl_service
from services.xumm_service import xumm_service
from services.supabase_service import supabase_service
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)


class AssetTokenization(BaseModel):
    """Asset tokenization model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_name: str
    asset_type: str  # real_estate, art, insurance, carbon_credits, commodities
    asset_description: str
    asset_value_usd: float
    token_symbol: str
    token_supply: int
    token_decimals: int = 6
    issuer_address: str
    owner_address: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    status: str = "pending"  # pending, trustline_created, issued, active, suspended
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    txn_hashes: List[str] = Field(default_factory=list)


class TokenTransaction(BaseModel):
    """Token transaction model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_type: str  # issue, transfer, burn, trustline
    token_symbol: str
    issuer_address: str
    from_address: Optional[str] = None
    to_address: Optional[str] = None
    amount: float
    txn_hash: Optional[str] = None
    xumm_payload_uuid: Optional[str] = None
    status: str = "pending"  # pending, signed, submitted, validated, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TokenizationService:
    """Service for real asset tokenization on XRPL with Supabase"""
    
    def __init__(self):
        self.db = supabase_service
        
    async def create_asset_tokenization(self, asset_data: Dict[str, Any], 
                                       owner_address: str) -> Dict[str, Any]:
        """Create new asset tokenization"""
        try:
            # Validate owner address
            address_validation = await xrpl_service.validate_address(owner_address)
            if not address_validation["success"] or not address_validation["valid"]:
                return {"success": False, "error": "Invalid owner address"}
            
            # Generate unique token symbol if not provided
            token_symbol = asset_data.get("token_symbol")
            if not token_symbol:
                # Generate from asset name (first 3 chars + random)
                base_symbol = asset_data["asset_name"][:3].upper()
                token_symbol = f"{base_symbol}{str(uuid.uuid4())[:4].upper()}"
            
            # Validate token symbol format (must be 3 characters for XRPL)
            if len(token_symbol) < 3:
                token_symbol = f"{token_symbol}{'X' * (3 - len(token_symbol))}"
            elif len(token_symbol) > 20:
                token_symbol = token_symbol[:20]
            
            # Create tokenization record
            tokenization_data = {
                "id": str(uuid.uuid4()),
                "asset_name": asset_data["asset_name"],
                "asset_type": asset_data["asset_type"],
                "asset_description": asset_data["asset_description"],
                "asset_value_usd": float(asset_data["asset_value_usd"]),
                "token_symbol": token_symbol,
                "token_supply": int(asset_data.get("token_supply", 1000000)),
                "issuer_address": owner_address,  # Owner is also issuer initially
                "owner_address": owner_address,
                "metadata": {
                    "location": asset_data.get("location"),
                    "documents": asset_data.get("documents", []),
                    "valuation_date": asset_data.get("valuation_date"),
                    "valuation_method": asset_data.get("valuation_method"),
                    "legal_entity": asset_data.get("legal_entity"),
                    "compliance_status": asset_data.get("compliance_status", "pending")
                },
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Save to Supabase
            result = await self.db.create_tokenization(tokenization_data)
            if not result["success"]:
                return result
            
            return {
                "success": True,
                "tokenization_id": tokenization_data["id"],
                "token_symbol": token_symbol,
                "status": "pending",
                "next_step": "create_trustline",
                "message": "Asset tokenization created. Next: Create trustline for token."
            }
        except Exception as e:
            logger.error(f"Error creating asset tokenization: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def create_trustline_for_token(self, tokenization_id: str, 
                                       user_address: str) -> Dict[str, Any]:
        """Create trustline for new token"""
        try:
            # Get tokenization
            tokenization_result = await self.db.get_tokenization(tokenization_id)
            if not tokenization_result["success"] or not tokenization_result["data"]:
                return {"success": False, "error": "Tokenization not found"}
            
            tokenization = tokenization_result["data"]
            
            # Create XUMM sign request for trustline
            xumm_result = await xumm_service.create_trustline_request(
                user_account=user_address,
                token_currency=tokenization["token_symbol"],
                issuer=tokenization["issuer_address"],
                limit=str(tokenization["token_supply"])
            )
            
            if not xumm_result["success"]:
                return xumm_result
            
            # Create transaction record
            transaction_data = {
                "id": str(uuid.uuid4()),
                "transaction_type": "trustline",
                "token_symbol": tokenization["token_symbol"],
                "issuer_address": tokenization["issuer_address"],
                "to_address": user_address,
                "amount": 0,  # Trustline doesn't transfer amount
                "xumm_payload_uuid": xumm_result["payload_uuid"],
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            transaction_result = await self.db.create_transaction(transaction_data)
            if not transaction_result["success"]:
                return transaction_result
            
            return {
                "success": True,
                "transaction_id": transaction_data["id"],
                "payload_uuid": xumm_result["payload_uuid"],
                "qr_url": xumm_result["qr_url"],
                "deep_link": xumm_result["deep_link"],
                "expires_at": xumm_result["expires_at"],
                "message": "Scan QR code or use deep link to sign trustline transaction"
            }
        except Exception as e:
            logger.error(f"Error creating trustline: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def issue_tokens(self, tokenization_id: str, recipient_address: str,
                          amount: int) -> Dict[str, Any]:
        """Issue tokens to recipient"""
        try:
            # Get tokenization
            tokenization_result = await self.db.get_tokenization(tokenization_id)
            if not tokenization_result["success"] or not tokenization_result["data"]:
                return {"success": False, "error": "Tokenization not found"}
            
            tokenization = tokenization_result["data"]
            
            # Check if tokenization is ready for issuing
            if tokenization["status"] != "trustline_created":
                return {"success": False, "error": "Trustline must be created first"}
            
            # Create payment transaction (token issuance)
            xumm_result = await xumm_service.create_payment_request(
                from_account=tokenization["issuer_address"],
                to_account=recipient_address,
                amount=str(amount),
                currency=tokenization["token_symbol"],
                issuer=tokenization["issuer_address"]
            )
            
            if not xumm_result["success"]:
                return xumm_result
            
            # Create transaction record
            transaction_data = {
                "id": str(uuid.uuid4()),
                "transaction_type": "issue",
                "token_symbol": tokenization["token_symbol"],
                "issuer_address": tokenization["issuer_address"],
                "from_address": tokenization["issuer_address"],
                "to_address": recipient_address,
                "amount": float(amount),
                "xumm_payload_uuid": xumm_result["payload_uuid"],
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            transaction_result = await self.db.create_transaction(transaction_data)
            if not transaction_result["success"]:
                return transaction_result
            
            return {
                "success": True,
                "transaction_id": transaction_data["id"],
                "payload_uuid": xumm_result["payload_uuid"],
                "qr_url": xumm_result["qr_url"],
                "deep_link": xumm_result["deep_link"],
                "expires_at": xumm_result["expires_at"],
                "amount": amount,
                "token_symbol": tokenization["token_symbol"],
                "message": "Scan QR code to sign token issuance transaction"
            }
        except Exception as e:
            logger.error(f"Error issuing tokens: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def transfer_tokens(self, from_address: str, to_address: str,
                            token_symbol: str, issuer_address: str, 
                            amount: float) -> Dict[str, Any]:
        """Transfer tokens between addresses"""
        try:
            # Create payment transaction
            xumm_result = await xumm_service.create_payment_request(
                from_account=from_address,
                to_account=to_address,
                amount=str(amount),
                currency=token_symbol,
                issuer=issuer_address
            )
            
            if not xumm_result["success"]:
                return xumm_result
            
            # Create transaction record
            transaction_data = {
                "id": str(uuid.uuid4()),
                "transaction_type": "transfer",
                "token_symbol": token_symbol,
                "issuer_address": issuer_address,
                "from_address": from_address,
                "to_address": to_address,
                "amount": amount,
                "xumm_payload_uuid": xumm_result["payload_uuid"],
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            transaction_result = await self.db.create_transaction(transaction_data)
            if not transaction_result["success"]:
                return transaction_result
            
            return {
                "success": True,
                "transaction_id": transaction_data["id"],
                "payload_uuid": xumm_result["payload_uuid"],
                "qr_url": xumm_result["qr_url"],
                "deep_link": xumm_result["deep_link"],
                "expires_at": xumm_result["expires_at"],
                "message": "Scan QR code to sign token transfer transaction"
            }
        except Exception as e:
            logger.error(f"Error transferring tokens: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def check_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        """Check transaction status via XUMM"""
        try:
            # Get transaction
            transaction_result = await self.db.get_transaction(transaction_id)
            if not transaction_result["success"] or not transaction_result["data"]:
                return {"success": False, "error": "Transaction not found"}
            
            transaction = transaction_result["data"]
            
            if not transaction.get("xumm_payload_uuid"):
                return {"success": False, "error": "No XUMM payload found"}
            
            # Check XUMM status
            xumm_status = await xumm_service.get_payload_status(transaction["xumm_payload_uuid"])
            if not xumm_status["success"]:
                return xumm_status
            
            # Update transaction status
            new_status = "pending"
            txn_hash = None
            
            if xumm_status.get("signed") and xumm_status.get("submitted"):
                new_status = "validated"
                if "tx_id" in xumm_status:
                    txn_hash = xumm_status["tx_id"]
            elif xumm_status.get("cancelled"):
                new_status = "failed"
            elif xumm_status.get("expired"):
                new_status = "failed"
            
            if new_status != transaction["status"]:
                await self.db.update_transaction_status(transaction_id, new_status, txn_hash)
            
            return {
                "success": True,
                "transaction_id": transaction_id,
                "status": new_status,
                "xumm_status": xumm_status,
                "txn_hash": txn_hash
            }
        except Exception as e:
            logger.error(f"Error checking transaction status: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_user_tokens(self, user_address: str) -> Dict[str, Any]:
        """Get user's token portfolio"""
        try:
            # Get tokens from XRPL
            tokens_result = await xrpl_service.get_account_tokens(user_address)
            if not tokens_result["success"]:
                return tokens_result
            
            # Enrich with tokenization data
            enriched_tokens = []
            for token in tokens_result["tokens"]:
                # Look up tokenization info
                # Note: We need to modify this query for Supabase
                tokenization_result = await self.db.supabase.table("tokenizations").select("*").eq(
                    "token_symbol", token["currency"]
                ).eq("issuer_address", token["issuer"]).execute()
                
                token_info = {
                    "currency": token["currency"],
                    "issuer": token["issuer"],
                    "balance": token["balance"],
                    "limit": token["limit"]
                }
                
                if tokenization_result.data:
                    tokenization = tokenization_result.data[0]
                    token_info.update({
                        "asset_name": tokenization["asset_name"],
                        "asset_type": tokenization["asset_type"],
                        "asset_value_usd": tokenization["asset_value_usd"],
                        "tokenization_id": tokenization["id"]
                    })
                
                enriched_tokens.append(token_info)
            
            return {
                "success": True,
                "address": user_address,
                "tokens": enriched_tokens,
                "count": len(enriched_tokens)
            }
        except Exception as e:
            logger.error(f"Error getting user tokens: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_tokenization_details(self, tokenization_id: str) -> Dict[str, Any]:
        """Get detailed tokenization information"""
        try:
            tokenization_result = await self.db.get_tokenization(tokenization_id)
            if not tokenization_result["success"] or not tokenization_result["data"]:
                return {"success": False, "error": "Tokenization not found"}
            
            tokenization = tokenization_result["data"]
            
            # Get token metrics from XRPL
            metrics = await xrpl_service.get_token_metrics(
                tokenization["token_symbol"],
                tokenization["issuer_address"]
            )
            
            # Get related transactions
            transactions_result = await self.db.supabase.table("token_transactions").select("*").eq(
                "token_symbol", tokenization["token_symbol"]
            ).eq("issuer_address", tokenization["issuer_address"]).order(
                "created_at", desc=True
            ).limit(10).execute()
            
            result = tokenization.copy()
            if metrics["success"]:
                result["metrics"] = metrics
            result["recent_transactions"] = transactions_result.data
            
            return {"success": True, "tokenization": result}
        except Exception as e:
            logger.error(f"Error getting tokenization details: {str(e)}")
            return {"success": False, "error": str(e)}

# Create service instance
tokenization_service = TokenizationService()