from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
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
from services.payment_service import payment_service
from services.ai_analysis_service import ai_analysis_service
from services.marketplace_service import marketplace_service

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

# Payment Models
class TokenizationPaymentRequest(BaseModel):
    package_id: str
    user_id: Optional[str] = None
    wallet_address: Optional[str] = None

class CryptoPurchaseRequest(BaseModel):
    package_id: str
    crypto_type: str
    user_id: Optional[str] = None
    wallet_address: Optional[str] = None

# AI Analysis Models
class AssetAnalysisRequest(BaseModel):
    asset_data: Dict[str, Any]
    analysis_type: Optional[str] = "comprehensive"
    language: Optional[str] = "en"

class MarketPredictionRequest(BaseModel):
    asset_class: str
    time_horizon: Optional[str] = "3_months"
    language: Optional[str] = "en"

class RiskAssessmentRequest(BaseModel):
    portfolio_data: Dict[str, Any]
    language: Optional[str] = "en"

class PortfolioOptimizationRequest(BaseModel):
    portfolio_data: Dict[str, Any]
    optimization_goals: List[str]
    language: Optional[str] = "en"

# Marketplace Models
class CreateOrderRequest(BaseModel):
    asset_id: str
    order_type: str  # "market", "limit", "stop"
    side: str        # "buy", "sell"
    quantity: int
    price: Optional[float] = None
    user_id: Optional[str] = None
    wallet_address: Optional[str] = None

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
@api_router.post("/analytics/platform")
async def get_platform_analytics():
    """Get platform analytics and statistics"""
    try:
        # Use tokenization service to get platform statistics
        stats = await tokenization_service.get_platform_statistics()
        
        return {
            "status": "success",
            "platform_stats": stats
        }
    except Exception as e:
        logger.error(f"Error fetching platform analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch platform analytics: {str(e)}")

# Payment Endpoints
@api_router.get("/payments/packages/tokenization")
async def get_tokenization_packages():
    """Get available tokenization packages"""
    try:
        packages = payment_service.get_tokenization_packages()
        return {
            "status": "success",
            "packages": packages
        }
    except Exception as e:
        logger.error(f"Error fetching tokenization packages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/packages/crypto")
async def get_crypto_packages():
    """Get available crypto purchase packages"""
    try:
        packages = payment_service.get_crypto_packages()
        supported_crypto = payment_service.get_supported_crypto()
        return {
            "status": "success",
            "packages": packages,
            "supported_crypto": supported_crypto
        }
    except Exception as e:
        logger.error(f"Error fetching crypto packages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payments/tokenization/checkout")
async def create_tokenization_payment(request: TokenizationPaymentRequest, http_request: Request):
    """Create Stripe checkout session for tokenization payment"""
    try:
        host_url = str(http_request.base_url).rstrip('/')
        
        session = await payment_service.create_tokenization_payment(
            package_id=request.package_id,
            host_url=host_url,
            user_id=request.user_id,
            wallet_address=request.wallet_address
        )
        
        return {
            "status": "success",
            "checkout_url": session.url,
            "session_id": session.session_id
        }
    except Exception as e:
        logger.error(f"Error creating tokenization payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payments/crypto/checkout")
async def create_crypto_purchase_payment(request: CryptoPurchaseRequest, http_request: Request):
    """Create Stripe checkout session for crypto purchase"""
    try:
        host_url = str(http_request.base_url).rstrip('/')
        
        session = await payment_service.create_crypto_purchase_payment(
            package_id=request.package_id,
            crypto_type=request.crypto_type,
            host_url=host_url,
            user_id=request.user_id,
            wallet_address=request.wallet_address
        )
        
        return {
            "status": "success",
            "checkout_url": session.url,
            "session_id": session.session_id
        }
    except Exception as e:
        logger.error(f"Error creating crypto purchase payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, http_request: Request):
    """Get payment status for a checkout session"""
    try:
        host_url = str(http_request.base_url).rstrip('/')
        
        status = await payment_service.get_payment_status(session_id, host_url)
        
        return {
            "status": "success",
            "payment_info": status
        }
    except Exception as e:
        logger.error(f"Error fetching payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(http_request: Request):
    """Handle Stripe webhook events"""
    try:
        webhook_body = await http_request.body()
        stripe_signature = http_request.headers.get("Stripe-Signature", "")
        host_url = str(http_request.base_url).rstrip('/')
        
        webhook_result = await payment_service.handle_webhook(
            webhook_body, stripe_signature, host_url
        )
        
        return {
            "status": "success",
            "webhook_result": webhook_result
        }
    except Exception as e:
        logger.error(f"Error processing Stripe webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# AI Analysis Endpoints
@api_router.get("/ai/analysis-types")
async def get_ai_analysis_types():
    """Get available AI analysis types"""
    try:
        analysis_types = ai_analysis_service.get_analysis_types()
        asset_classes = ai_analysis_service.get_supported_asset_classes()
        
        return {
            "status": "success",
            "analysis_types": analysis_types,
            "supported_asset_classes": asset_classes
        }
    except Exception as e:
        logger.error(f"Error fetching AI analysis types: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/analyze-asset")
async def analyze_asset(request: AssetAnalysisRequest):
    """Analyze a specific asset using AI"""
    try:
        analysis = await ai_analysis_service.analyze_asset(
            asset_data=request.asset_data,
            analysis_type=request.analysis_type,
            language=request.language
        )
        
        return {
            "status": "success",
            "analysis": analysis
        }
    except Exception as e:
        logger.error(f"Error analyzing asset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/market-prediction")
async def predict_market_trends(request: MarketPredictionRequest):
    """Generate market predictions for specific asset class"""
    try:
        prediction = await ai_analysis_service.predict_market_trends(
            asset_class=request.asset_class,
            time_horizon=request.time_horizon,
            language=request.language
        )
        
        return {
            "status": "success",
            "prediction": prediction
        }
    except Exception as e:
        logger.error(f"Error predicting market trends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/risk-assessment")
async def assess_portfolio_risk(request: RiskAssessmentRequest):
    """Assess portfolio risk using AI analysis"""
    try:
        assessment = await ai_analysis_service.assess_portfolio_risk(
            portfolio_data=request.portfolio_data,
            language=request.language
        )
        
        return {
            "status": "success",
            "assessment": assessment
        }
    except Exception as e:
        logger.error(f"Error assessing portfolio risk: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/optimize-portfolio")
async def optimize_portfolio(request: PortfolioOptimizationRequest):
    """Generate portfolio optimization recommendations"""
    try:
        optimization = await ai_analysis_service.optimize_portfolio(
            portfolio_data=request.portfolio_data,
            optimization_goals=request.optimization_goals,
            language=request.language
        )
        
        return {
            "status": "success",
            "optimization": optimization
        }
    except Exception as e:
        logger.error(f"Error optimizing portfolio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Marketplace Endpoints
@api_router.get("/marketplace/assets")
async def get_marketplace_assets(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    limit: int = 50,
    offset: int = 0
):
    """Get marketplace assets with optional filtering"""
    try:
        assets = await marketplace_service.list_marketplace_assets(
            category=category,
            min_price=min_price,
            max_price=max_price,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset
        )
        
        return {
            "status": "success",
            "data": assets
        }
    except Exception as e:
        logger.error(f"Error fetching marketplace assets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/marketplace/assets/{asset_id}")
async def get_asset_details(asset_id: str):
    """Get detailed information about a specific asset"""
    try:
        asset_details = await marketplace_service.get_asset_details(asset_id)
        
        return {
            "status": "success",
            "data": asset_details
        }
    except Exception as e:
        logger.error(f"Error fetching asset details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/marketplace/categories")
async def get_marketplace_categories():
    """Get available marketplace categories"""
    try:
        categories = marketplace_service.get_marketplace_categories()
        order_types = marketplace_service.get_order_types()
        
        return {
            "status": "success",
            "categories": categories,
            "order_types": order_types
        }
    except Exception as e:
        logger.error(f"Error fetching marketplace categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/marketplace/orders")
async def create_order(request: CreateOrderRequest):
    """Create a new trading order"""
    try:
        order_result = await marketplace_service.create_order(
            asset_id=request.asset_id,
            user_id=request.user_id or "anonymous",
            wallet_address=request.wallet_address or "",
            order_type=request.order_type,
            side=request.side,
            quantity=request.quantity,
            price=request.price
        )
        
        return {
            "status": "success",
            "data": order_result
        }
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/marketplace/orders/{user_id}")
async def get_user_orders(
    user_id: str,
    status: Optional[str] = None,
    limit: int = 50
):
    """Get user's trading orders"""
    try:
        orders = await marketplace_service.get_user_orders(
            user_id=user_id,
            status=status,
            limit=limit
        )
        
        return {
            "status": "success",
            "data": orders
        }
    except Exception as e:
        logger.error(f"Error fetching user orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/marketplace/orders/{order_id}")
async def cancel_order(order_id: str, user_id: str):
    """Cancel a pending order"""
    try:
        result = await marketplace_service.cancel_order(order_id, user_id)
        
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error cancelling order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/marketplace/trading-history")
async def get_trading_history(
    user_id: Optional[str] = None,
    asset_id: Optional[str] = None,
    limit: int = 100
):
    """Get trading history"""
    try:
        history = await marketplace_service.get_trading_history(
            user_id=user_id,
            asset_id=asset_id,
            limit=limit
        )
        
        return {
            "status": "success",
            "data": history
        }
    except Exception as e:
        logger.error(f"Error fetching trading history: {str(e)}")
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