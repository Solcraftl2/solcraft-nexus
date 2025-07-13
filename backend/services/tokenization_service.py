"""
Solcraft Nexus - Tokenization Service
Real asset tokenization on XRPL mainnet
"""

import os
import json
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from services.xrpl_service import xrpl_service
from services.xumm_service import xumm_service
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
    """Service for real asset tokenization on XRPL"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.tokenizations_collection = db.tokenizations
        self.transactions_collection = db.token_transactions
        self.wallets_collection = db.wallets
        
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
            tokenization = AssetTokenization(
                asset_name=asset_data["asset_name"],
                asset_type=asset_data["asset_type"],
                asset_description=asset_data["asset_description"],
                asset_value_usd=float(asset_data["asset_value_usd"]),
                token_symbol=token_symbol,
                token_supply=int(asset_data.get("token_supply", 1000000)),
                issuer_address=owner_address,  # Owner is also issuer initially
                owner_address=owner_address,
                metadata={
                    "location": asset_data.get("location"),
                    "documents": asset_data.get("documents", []),
                    "valuation_date": asset_data.get("valuation_date"),
                    "valuation_method": asset_data.get("valuation_method"),
                    "legal_entity": asset_data.get("legal_entity"),
                    "compliance_status": asset_data.get("compliance_status", "pending")
                },
                status="pending"
            )
            
            # Save to database
            result = await self.tokenizations_collection.insert_one(tokenization.dict())
            
            return {
                "success": True,
                "tokenization_id": tokenization.id,
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
            tokenization_doc = await self.tokenizations_collection.find_one({"id": tokenization_id})
            if not tokenization_doc:
                return {"success": False, "error": "Tokenization not found"}
            
            tokenization = AssetTokenization(**tokenization_doc)
            
            # Create XUMM sign request for trustline
            xumm_result = await xumm_service.create_trustline_request(
                user_account=user_address,
                token_currency=tokenization.token_symbol,
                issuer=tokenization.issuer_address,
                limit=str(tokenization.token_supply)
            )
            
            if not xumm_result["success"]:
                return xumm_result
            
            # Create transaction record
            transaction = TokenTransaction(
                transaction_type="trustline",
                token_symbol=tokenization.token_symbol,
                issuer_address=tokenization.issuer_address,
                to_address=user_address,
                amount=0,  # Trustline doesn't transfer amount
                xumm_payload_uuid=xumm_result["payload_uuid"],
                status="pending"
            )
            
            await self.transactions_collection.insert_one(transaction.dict())
            
            return {
                "success": True,
                "transaction_id": transaction.id,
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
            tokenization_doc = await self.tokenizations_collection.find_one({"id": tokenization_id})
            if not tokenization_doc:
                return {"success": False, "error": "Tokenization not found"}
            
            tokenization = AssetTokenization(**tokenization_doc)
            
            # Check if tokenization is ready for issuing
            if tokenization.status != "trustline_created":
                return {"success": False, "error": "Trustline must be created first"}
            
            # Create payment transaction (token issuance)
            xumm_result = await xumm_service.create_payment_request(
                from_account=tokenization.issuer_address,
                to_account=recipient_address,
                amount=str(amount),
                currency=tokenization.token_symbol,
                issuer=tokenization.issuer_address
            )
            
            if not xumm_result["success"]:
                return xumm_result
            
            # Create transaction record
            transaction = TokenTransaction(
                transaction_type="issue",
                token_symbol=tokenization.token_symbol,
                issuer_address=tokenization.issuer_address,
                from_address=tokenization.issuer_address,
                to_address=recipient_address,
                amount=float(amount),
                xumm_payload_uuid=xumm_result["payload_uuid"],
                status="pending"
            )
            
            await self.transactions_collection.insert_one(transaction.dict())
            
            return {
                "success": True,
                "transaction_id": transaction.id,
                "payload_uuid": xumm_result["payload_uuid"],
                "qr_url": xumm_result["qr_url"],
                "deep_link": xumm_result["deep_link"],
                "expires_at": xumm_result["expires_at"],
                "amount": amount,
                "token_symbol": tokenization.token_symbol,
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
            transaction = TokenTransaction(
                transaction_type="transfer",
                token_symbol=token_symbol,
                issuer_address=issuer_address,
                from_address=from_address,
                to_address=to_address,
                amount=amount,
                xumm_payload_uuid=xumm_result["payload_uuid"],
                status="pending"
            )
            
            await self.transactions_collection.insert_one(transaction.dict())
            
            return {
                "success": True,
                "transaction_id": transaction.id,
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
            transaction_doc = await self.transactions_collection.find_one({"id": transaction_id})
            if not transaction_doc:
                return {"success": False, "error": "Transaction not found"}
            
            transaction = TokenTransaction(**transaction_doc)
            
            if not transaction.xumm_payload_uuid:
                return {"success": False, "error": "No XUMM payload found"}
            
            # Check XUMM status
            xumm_status = await xumm_service.get_payload_status(transaction.xumm_payload_uuid)
            if not xumm_status["success"]:
                return xumm_status
            
            # Update transaction status
            new_status = "pending"
            if xumm_status["signed"] and xumm_status["submitted"]:
                new_status = "validated"
                # Update with transaction hash if available
                if "tx_id" in xumm_status:
                    await self.transactions_collection.update_one(
                        {"id": transaction_id},
                        {"$set": {"txn_hash": xumm_status["tx_id"], "status": new_status, "updated_at": datetime.utcnow()}}
                    )
            elif xumm_status["cancelled"]:
                new_status = "failed"
            elif xumm_status["expired"]:
                new_status = "failed"
            
            if new_status != transaction.status:
                await self.transactions_collection.update_one(
                    {"id": transaction_id},
                    {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
                )
            
            return {
                "success": True,
                "transaction_id": transaction_id,
                "status": new_status,
                "xumm_status": xumm_status,
                "txn_hash": xumm_status.get("tx_id")
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
                tokenization_doc = await self.tokenizations_collection.find_one({
                    "token_symbol": token["currency"],
                    "issuer_address": token["issuer"]
                })
                
                token_info = {
                    "currency": token["currency"],
                    "issuer": token["issuer"],
                    "balance": token["balance"],
                    "limit": token["limit"]
                }
                
                if tokenization_doc:
                    tokenization = AssetTokenization(**tokenization_doc)
                    token_info.update({
                        "asset_name": tokenization.asset_name,
                        "asset_type": tokenization.asset_type,
                        "asset_value_usd": tokenization.asset_value_usd,
                        "tokenization_id": tokenization.id
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
            tokenization_doc = await self.tokenizations_collection.find_one({"id": tokenization_id})
            if not tokenization_doc:
                return {"success": False, "error": "Tokenization not found"}
            
            tokenization = AssetTokenization(**tokenization_doc)
            
            # Get token metrics from XRPL
            metrics = await xrpl_service.get_token_metrics(
                tokenization.token_symbol,
                tokenization.issuer_address
            )
            
            # Get related transactions
            transactions = await self.transactions_collection.find({
                "token_symbol": tokenization.token_symbol,
                "issuer_address": tokenization.issuer_address
            }).sort("created_at", -1).limit(10).to_list(10)
            
            result = tokenization.dict()
            if metrics["success"]:
                result["metrics"] = metrics
            result["recent_transactions"] = transactions
            
            return {"success": True, "tokenization": result}
        except Exception as e:
            logger.error(f"Error getting tokenization details: {str(e)}")
            return {"success": False, "error": str(e)}