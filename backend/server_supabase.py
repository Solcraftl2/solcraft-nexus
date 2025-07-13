from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
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
from services.tokenization_service import tokenization_service
from services.supabase_service import supabase_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI(title="Solcraft Nexus API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "solcraft-nexus-super-secret-jwt-key-2024")

# Pydantic models
class WalletConnection(BaseModel):
    wallet_type: str  # xumm, crossmark, web3auth
    address: str
    network: str = "testnet"

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
    db_health = await supabase_service.health_check()
    return {
        "message": "Solcraft Nexus - Advanced Web3 Tokenization Platform",
        "version": "1.0.0", 
        "network": "XRPL Testnet",
        "services": {
            "xrpl": xrpl_service.network,
            "xumm": xumm_service.is_available(),
            "tokenization": True,
            "database": "supabase",
            "db_status": db_health["status"]
        }
    }

@api_router.get("/health")
async def health_check():
    db_health = await supabase_service.health_check()
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": db_health["status"],
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
        
        # Store wallet connection in Supabase
        wallet_doc = {
            "id": str(uuid.uuid4()),
            "address": wallet_data.address,
            "wallet_type": wallet_data.wallet_type,
            "network": wallet_data.network,
            "balance_xrp": account_info["balance_xrp"],
            "connected_at": datetime.utcnow().isoformat(),
            "last_active": datetime.utcnow().isoformat()
        }
        
        result = await supabase_service.create_wallet(wallet_doc)
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
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

# XUMM Proxy endpoints
@api_router.post("/wallet/xumm/connect")
async def connect_xumm_wallet():
    """Initiate XUMM wallet connection"""
    try:
        # Create a simple SignIn payload for wallet connection
        transaction = {
            "TransactionType": "SignIn"
        }
        
        result = await xumm_service.create_sign_request(transaction)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "payload_uuid": result["payload_uuid"],
            "qr_url": result["qr_url"],
            "websocket_url": result["websocket_url"],
            "deep_link": result["deep_link"],
            "expires_at": result["expires_at"],
            "message": "Scan QR code with XUMM app to connect wallet"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/wallet/xumm/{payload_uuid}/result")
async def get_xumm_connection_result(payload_uuid: str):
    """Get XUMM wallet connection result"""
    try:
        result = await xumm_service.get_payload_status(payload_uuid)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["error"])
        
        # If signed, process the wallet connection
        if result.get("signed") and result.get("account"):
            # Validate and store the wallet connection
            wallet_data = WalletConnection(
                wallet_type="xumm",
                address=result["account"],
                network="testnet"
            )
            
            # Get account info
            account_info = await xrpl_service.get_account_info(result["account"])
            if not account_info["success"]:
                return {"success": False, "error": "Invalid account"}
            
            # Store wallet connection
            wallet_doc = {
                "id": str(uuid.uuid4()),
                "address": result["account"],
                "wallet_type": "xumm",
                "network": "testnet",
                "balance_xrp": account_info["balance_xrp"],
                "connected_at": datetime.utcnow().isoformat(),
                "last_active": datetime.utcnow().isoformat(),
                "xumm_user_token": result.get("user_token")
            }
            
            supabase_result = await supabase_service.create_wallet(wallet_doc)
            if not supabase_result["success"]:
                raise HTTPException(status_code=500, detail=supabase_result["error"])
            
            # Generate JWT token
            token_payload = {
                "address": result["account"],
                "wallet_type": "xumm",
                "exp": datetime.utcnow().timestamp() + 86400  # 24 hours
            }
            token = jwt.encode(token_payload, JWT_SECRET, algorithm="HS256")
            
            return {
                "success": True,
                "connected": True,
                "address": result["account"],
                "wallet_type": "xumm",
                "balance_xrp": account_info["balance_xrp"],
                "network": "testnet",
                "token": token,
                "message": "XUMM wallet connected successfully"
            }
        else:
            return {
                "success": True,
                "connected": False,
                "signed": result.get("signed", False),
                "cancelled": result.get("cancelled", False),
                "expired": result.get("expired", False),
                "message": "Waiting for user to sign with XUMM app"
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

# Analytics endpoints
@api_router.get("/analytics/platform")
async def get_platform_analytics():
    """Get platform analytics and statistics"""
    try:
        stats_result = await supabase_service.get_platform_stats()
        if not stats_result["success"]:
            raise HTTPException(status_code=500, detail=stats_result["error"])
        
        stats = stats_result["data"]
        
        return {
            "success": True,
            "platform_stats": {
                "total_value_locked": stats.get("total_value_locked", 245200000),
                "total_tokenizations": stats.get("total_tokenizations", 0),
                "active_tokenizations": stats.get("active_tokenizations", 0),
                "total_transactions": stats.get("total_transactions", 0),
                "successful_transactions": stats.get("successful_transactions", 0),
                "total_users": stats.get("total_users", 0),
                "active_users": stats.get("active_users", 0),
                "success_rate": (stats.get("successful_transactions", 0) / max(stats.get("total_transactions", 1), 1)) * 100
            },
            "last_updated": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
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
    logger.info("Solcraft Nexus API started with Supabase")
    logger.info(f"XRPL Network: {xrpl_service.network}")
    logger.info(f"XUMM Available: {xumm_service.is_available()}")
    
    # Initialize database tables
    await supabase_service.initialize_tables()
    
    db_health = await supabase_service.health_check()
    logger.info(f"Supabase Status: {db_health['status']}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Solcraft Nexus API shutting down")