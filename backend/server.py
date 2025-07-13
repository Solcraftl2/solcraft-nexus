from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt

# Import services
from services.xrpl_service import xrpl_service
from services.xumm_service import xumm_service
from services.tokenization_service import TokenizationService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Solcraft Nexus API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-here")

# Initialize services
tokenization_service = TokenizationService(db)

# Pydantic models
class WalletConnection(BaseModel):
    wallet_type: str  # xumm, crossmark, web3auth
    address: str
    network: str = "mainnet"

class AssetTokenizationRequest(BaseModel):
    asset_name: str
    asset_type: str  # real_estate, art, insurance, carbon_credits, commodities
    asset_description: str
    asset_value_usd: float
    token_symbol: Optional[str] = None
    token_supply: Optional[int] = 1000000
    location: Optional[str] = None
    documents: Optional[List[str]] = []
    valuation_method: Optional[str] = None

class TokenTransferRequest(BaseModel):
    from_address: str
    to_address: str
    token_symbol: str
    issuer_address: str
    amount: float

class TokenTrustlineRequest(BaseModel):
    user_address: str
    token_symbol: str
    issuer_address: str
    limit: Optional[str] = "1000000"

class TradingOfferRequest(BaseModel):
    account: str
    taker_gets: Dict[str, Any]
    taker_pays: Dict[str, Any]

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Basic endpoints
@api_router.get("/")
async def root():
    return {
        "message": "Solcraft Nexus - Advanced Web3 Tokenization Platform",
        "version": "1.0.0",
        "network": "XRPL Mainnet",
        "services": {
            "xrpl": xrpl_service.network,
            "xumm": xumm_service.is_available(),
            "tokenization": True
        }
    }

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": "connected",
            "xrpl": "connected",
            "xumm": "available" if xumm_service.is_available() else "unavailable"
        }
    }

# Wallet endpoints
@api_router.post("/wallet/connect")
async def connect_wallet(wallet_data: WalletConnection):
    """Connect wallet and validate address"""
    try:
        # Validate XRPL address
        validation = await xrpl_service.validate_address(wallet_data.address)
        if not validation["success"] or not validation["valid"]:
            raise HTTPException(status_code=400, detail="Invalid XRPL address")
        
        # Get account info
        account_info = await xrpl_service.get_account_info(wallet_data.address)
        if not account_info["success"]:
            raise HTTPException(status_code=400, detail="Account not found on XRPL")
        
        # Store wallet connection in database
        wallet_doc = {
            "id": str(uuid.uuid4()),
            "address": wallet_data.address,
            "wallet_type": wallet_data.wallet_type,
            "network": wallet_data.network,
            "balance_xrp": account_info["balance_xrp"],
            "connected_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        }
        
        await db.wallets.update_one(
            {"address": wallet_data.address},
            {"$set": wallet_doc},
            upsert=True
        )
        
        # Generate JWT token
        token_payload = {
            "address": wallet_data.address,
            "wallet_type": wallet_data.wallet_type,
            "exp": datetime.utcnow().timestamp() + 86400  # 24 hours
        }
        token = jwt.encode(token_payload, JWT_SECRET, algorithm="HS256")
        
        return {
            "success": True,
            "address": wallet_data.address,
            "wallet_type": wallet_data.wallet_type,
            "balance_xrp": account_info["balance_xrp"],
            "network": wallet_data.network,
            "token": token,
            "message": "Wallet connected successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/wallet/{address}/balance")
async def get_wallet_balance(address: str):
    """Get wallet XRP and token balances"""
    try:
        # Get XRP balance
        account_info = await xrpl_service.get_account_info(address)
        if not account_info["success"]:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Get token balances
        tokens = await xrpl_service.get_account_tokens(address)
        if not tokens["success"]:
            tokens = {"tokens": [], "count": 0}
        
        # Get user's tokenized assets
        user_tokens = await tokenization_service.get_user_tokens(address)
        
        return {
            "success": True,
            "address": address,
            "xrp_balance": account_info["balance_xrp"],
            "tokens": user_tokens["tokens"] if user_tokens["success"] else [],
            "total_tokens": len(user_tokens["tokens"]) if user_tokens["success"] else 0
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/wallet/{address}/transactions")
async def get_wallet_transactions(address: str, limit: int = 20):
    """Get wallet transaction history"""
    try:
        transactions = await xrpl_service.get_transaction_history(address, limit)
        if not transactions["success"]:
            raise HTTPException(status_code=500, detail="Failed to get transactions")
        
        return {
            "success": True,
            "address": address,
            "transactions": transactions["transactions"],
            "count": transactions["count"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Tokenization endpoints
@api_router.post("/tokenize/asset")
async def tokenize_asset(request: AssetTokenizationRequest, user=Depends(get_current_user)):
    """Create new asset tokenization"""
    try:
        result = await tokenization_service.create_asset_tokenization(
            request.dict(),
            user["address"]
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/tokenize/{tokenization_id}/trustline")
async def create_token_trustline(tokenization_id: str, request: TokenTrustlineRequest):
    """Create trustline for token"""
    try:
        result = await tokenization_service.create_trustline_for_token(
            tokenization_id,
            request.user_address
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/tokenize/{tokenization_id}/issue")
async def issue_tokens(tokenization_id: str, recipient_address: str, amount: int, user=Depends(get_current_user)):
    """Issue tokens to recipient"""
    try:
        result = await tokenization_service.issue_tokens(
            tokenization_id,
            recipient_address,
            amount
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/tokenize/{tokenization_id}")
async def get_tokenization_details(tokenization_id: str):
    """Get tokenization details"""
    try:
        result = await tokenization_service.get_tokenization_details(tokenization_id)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Token transfer endpoints
@api_router.post("/tokens/transfer")
async def transfer_tokens(request: TokenTransferRequest, user=Depends(get_current_user)):
    """Transfer tokens between addresses"""
    try:
        result = await tokenization_service.transfer_tokens(
            request.from_address,
            request.to_address,
            request.token_symbol,
            request.issuer_address,
            request.amount
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/tokens/xrp/transfer")
async def transfer_xrp(from_address: str, to_address: str, amount_xrp: float, user=Depends(get_current_user)):
    """Transfer XRP between addresses"""
    try:
        result = await xrpl_service.create_xrp_payment_transaction(
            from_address,
            to_address,
            amount_xrp
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        # Create XUMM sign request
        xumm_result = await xumm_service.create_sign_request(result["transaction"])
        
        if not xumm_result["success"]:
            raise HTTPException(status_code=500, detail=xumm_result["error"])
        
        return {
            "success": True,
            "transaction": result,
            "xumm": xumm_result,
            "message": "XRP transfer ready for signing"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Trading endpoints
@api_router.post("/trading/offer")
async def create_trading_offer(request: TradingOfferRequest, user=Depends(get_current_user)):
    """Create trading offer"""
    try:
        result = await xrpl_service.create_token_offer_transaction(
            request.account,
            request.taker_gets,
            request.taker_pays
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        # Create XUMM sign request
        xumm_result = await xumm_service.create_sign_request(result["transaction"])
        
        if not xumm_result["success"]:
            raise HTTPException(status_code=500, detail=xumm_result["error"])
        
        return {
            "success": True,
            "transaction": result,
            "xumm": xumm_result,
            "message": "Trading offer ready for signing"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/trading/orderbook")
async def get_orderbook(taker_gets_currency: str, taker_gets_issuer: str,
                       taker_pays_currency: str, taker_pays_issuer: str):
    """Get orderbook for token pair"""
    try:
        taker_gets = {"currency": taker_gets_currency, "issuer": taker_gets_issuer}
        taker_pays = {"currency": taker_pays_currency, "issuer": taker_pays_issuer}
        
        result = await xrpl_service.get_orderbook(taker_gets, taker_pays)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Transaction status endpoints
@api_router.get("/transactions/{transaction_id}/status")
async def get_transaction_status(transaction_id: str):
    """Get transaction status"""
    try:
        result = await tokenization_service.check_transaction_status(transaction_id)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/xumm/{payload_uuid}/status")
async def get_xumm_payload_status(payload_uuid: str):
    """Get XUMM payload status"""
    try:
        result = await xumm_service.get_payload_status(payload_uuid)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Analytics endpoints
@api_router.get("/analytics/platform")
async def get_platform_analytics():
    """Get platform analytics and statistics"""
    try:
        # Get tokenization statistics
        total_tokenizations = await db.tokenizations.count_documents({})
        active_tokenizations = await db.tokenizations.count_documents({"status": "active"})
        
        # Get transaction statistics
        total_transactions = await db.token_transactions.count_documents({})
        successful_transactions = await db.token_transactions.count_documents({"status": "validated"})
        
        # Get user statistics
        total_wallets = await db.wallets.count_documents({})
        active_wallets = await db.wallets.count_documents({
            "last_active": {"$gte": datetime.utcnow() - timedelta(days=30)}
        })
        
        # Calculate total value locked (mock data for now)
        tvl_usd = 245200000  # This would be calculated from real data
        
        return {
            "success": True,
            "platform_stats": {
                "total_value_locked": tvl_usd,
                "total_tokenizations": total_tokenizations,
                "active_tokenizations": active_tokenizations,
                "total_transactions": total_transactions,
                "successful_transactions": successful_transactions,
                "total_users": total_wallets,
                "active_users": active_wallets,
                "success_rate": (successful_transactions / total_transactions * 100) if total_transactions > 0 else 0
            },
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("Solcraft Nexus API started")
    logger.info(f"XRPL Network: {xrpl_service.network}")
    logger.info(f"XUMM Available: {xumm_service.is_available()}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
