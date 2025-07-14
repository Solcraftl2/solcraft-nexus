"""
Solcraft Nexus - Payment Service
Handles all payment processing including Stripe and crypto payments
"""

import os
import asyncio
from typing import Dict, Any, Optional
from fastapi import HTTPException
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from .supabase_service import get_supabase_client

class PaymentService:
    def __init__(self):
        self.stripe_api_key = os.getenv('STRIPE_API_KEY')
        if not self.stripe_api_key:
            raise ValueError("STRIPE_API_KEY not found in environment variables")
        
        # Payment packages for tokenization (fixed server-side prices)
        self.TOKENIZATION_PACKAGES = {
            "basic": {"amount": 100.0, "currency": "usd", "name": "Basic Tokenization"},
            "premium": {"amount": 250.0, "currency": "usd", "name": "Premium Tokenization"},
            "enterprise": {"amount": 500.0, "currency": "usd", "name": "Enterprise Tokenization"}
        }
        
        # Crypto purchase packages
        self.CRYPTO_PACKAGES = {
            "starter": {"amount": 50.0, "currency": "usd", "name": "Starter Crypto Package"},
            "growth": {"amount": 150.0, "currency": "usd", "name": "Growth Crypto Package"},
            "pro": {"amount": 300.0, "currency": "usd", "name": "Pro Crypto Package"},
            "institutional": {"amount": 1000.0, "currency": "usd", "name": "Institutional Package"}
        }
        
        # Supported cryptocurrencies for conversion
        self.SUPPORTED_CRYPTO = {
            "XRP": {"symbol": "XRP", "name": "Ripple"},
            "USDT": {"symbol": "USDT", "name": "Tether USD"},
            "USDC": {"symbol": "USDC", "name": "USD Coin"},
            "ETH": {"symbol": "ETH", "name": "Ethereum"},
            "SOL": {"symbol": "SOL", "name": "Solana"},
            "BTC": {"symbol": "BTC", "name": "Bitcoin"}
        }

    def _get_stripe_checkout(self, host_url: str) -> StripeCheckout:
        """Initialize Stripe checkout with webhook URL"""
        webhook_url = f"{host_url}/api/webhook/stripe"
        return StripeCheckout(api_key=self.stripe_api_key, webhook_url=webhook_url)

    async def create_tokenization_payment(
        self, 
        package_id: str, 
        host_url: str, 
        user_id: Optional[str] = None,
        wallet_address: Optional[str] = None
    ) -> CheckoutSessionResponse:
        """Create payment session for asset tokenization"""
        
        # Validate package
        if package_id not in self.TOKENIZATION_PACKAGES:
            raise HTTPException(status_code=400, detail=f"Invalid tokenization package: {package_id}")
        
        package = self.TOKENIZATION_PACKAGES[package_id]
        
        # Create Stripe checkout session
        stripe_checkout = self._get_stripe_checkout(host_url)
        
        # Build URLs
        success_url = f"{host_url}/dashboard/tokenization/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{host_url}/dashboard/tokenization"
        
        # Metadata for tracking
        metadata = {
            "type": "tokenization",
            "package_id": package_id,
            "package_name": package["name"],
            "user_id": user_id or "anonymous",
            "wallet_address": wallet_address or "",
            "platform": "solcraft_nexus"
        }
        
        # Create checkout request
        checkout_request = CheckoutSessionRequest(
            amount=package["amount"],
            currency=package["currency"],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        # Create session
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store payment transaction in database
        await self._store_payment_transaction(
            session_id=session.session_id,
            amount=package["amount"],
            currency=package["currency"],
            metadata=metadata,
            payment_type="tokenization",
            status="pending"
        )
        
        return session

    async def create_crypto_purchase_payment(
        self, 
        package_id: str, 
        crypto_type: str,
        host_url: str, 
        user_id: Optional[str] = None,
        wallet_address: Optional[str] = None
    ) -> CheckoutSessionResponse:
        """Create payment session for crypto purchase"""
        
        # Validate package
        if package_id not in self.CRYPTO_PACKAGES:
            raise HTTPException(status_code=400, detail=f"Invalid crypto package: {package_id}")
        
        # Validate crypto type
        if crypto_type not in self.SUPPORTED_CRYPTO:
            raise HTTPException(status_code=400, detail=f"Unsupported cryptocurrency: {crypto_type}")
        
        package = self.CRYPTO_PACKAGES[package_id]
        crypto_info = self.SUPPORTED_CRYPTO[crypto_type]
        
        # Create Stripe checkout session
        stripe_checkout = self._get_stripe_checkout(host_url)
        
        # Build URLs
        success_url = f"{host_url}/dashboard/crypto/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{host_url}/dashboard/crypto"
        
        # Metadata for tracking
        metadata = {
            "type": "crypto_purchase",
            "package_id": package_id,
            "package_name": package["name"],
            "crypto_type": crypto_type,
            "crypto_name": crypto_info["name"],
            "user_id": user_id or "anonymous",
            "wallet_address": wallet_address or "",
            "platform": "solcraft_nexus"
        }
        
        # Create checkout request
        checkout_request = CheckoutSessionRequest(
            amount=package["amount"],
            currency=package["currency"],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        # Create session
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store payment transaction in database
        await self._store_payment_transaction(
            session_id=session.session_id,
            amount=package["amount"],
            currency=package["currency"],
            metadata=metadata,
            payment_type="crypto_purchase",
            status="pending"
        )
        
        return session

    async def get_payment_status(self, session_id: str, host_url: str) -> Dict[str, Any]:
        """Get payment status and update database"""
        
        stripe_checkout = self._get_stripe_checkout(host_url)
        
        # Get status from Stripe
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update database with current status
        await self._update_payment_status(
            session_id=session_id,
            status=checkout_status.status,
            payment_status=checkout_status.payment_status
        )
        
        # Get updated transaction from database
        transaction = await self._get_payment_transaction(session_id)
        
        return {
            "session_id": session_id,
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total,
            "currency": checkout_status.currency,
            "metadata": checkout_status.metadata,
            "transaction": transaction
        }

    async def handle_webhook(self, webhook_body: bytes, stripe_signature: str, host_url: str) -> Dict[str, Any]:
        """Handle Stripe webhook events"""
        
        stripe_checkout = self._get_stripe_checkout(host_url)
        
        # Process webhook
        webhook_response = await stripe_checkout.handle_webhook(webhook_body, stripe_signature)
        
        # Update database based on webhook event
        if webhook_response.session_id:
            await self._update_payment_status(
                session_id=webhook_response.session_id,
                status=webhook_response.event_type,
                payment_status=webhook_response.payment_status
            )
            
            # If payment completed, trigger post-payment processing
            if webhook_response.payment_status == "paid":
                await self._process_successful_payment(webhook_response.session_id, webhook_response.metadata)
        
        return {
            "event_type": webhook_response.event_type,
            "event_id": webhook_response.event_id,
            "session_id": webhook_response.session_id,
            "payment_status": webhook_response.payment_status,
            "metadata": webhook_response.metadata
        }

    async def _store_payment_transaction(
        self, 
        session_id: str, 
        amount: float, 
        currency: str, 
        metadata: Dict[str, Any],
        payment_type: str,
        status: str
    ):
        """Store payment transaction in Supabase"""
        
        supabase = get_supabase_client()
        
        transaction_data = {
            "session_id": session_id,
            "amount": amount,
            "currency": currency,
            "metadata": metadata,
            "payment_type": payment_type,
            "status": status,
            "payment_status": "pending",
            "created_at": "now()"
        }
        
        try:
            result = supabase.table("payment_transactions").insert(transaction_data).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to store payment transaction")
            
            return result.data[0]
        except Exception as e:
            # If table doesn't exist, log the error but don't fail the payment creation
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Could not store payment transaction (table may not exist): {str(e)}")
            # Return a mock response to allow payment flow to continue
            return {
                "session_id": session_id,
                "amount": amount,
                "currency": currency,
                "payment_type": payment_type,
                "status": status
            }

    async def _update_payment_status(self, session_id: str, status: str, payment_status: str):
        """Update payment status in database"""
        
        supabase = get_supabase_client()
        
        try:
            # Check if already processed to prevent duplicate processing
            existing = supabase.table("payment_transactions").select("*").eq("session_id", session_id).execute()
            
            if existing.data and existing.data[0]["payment_status"] == "paid":
                # Already processed, don't update again
                return existing.data[0]
            
            update_data = {
                "status": status,
                "payment_status": payment_status,
                "updated_at": "now()"
            }
            
            result = supabase.table("payment_transactions").update(update_data).eq("session_id", session_id).execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Could not update payment status (table may not exist): {str(e)}")
            return None

    async def _get_payment_transaction(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get payment transaction from database"""
        
        supabase = get_supabase_client()
        
        try:
            result = supabase.table("payment_transactions").select("*").eq("session_id", session_id).execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Could not get payment transaction (table may not exist): {str(e)}")
            return None

    async def _process_successful_payment(self, session_id: str, metadata: Dict[str, Any]):
        """Process successful payment - tokenization or crypto purchase"""
        
        payment_type = metadata.get("type")
        
        if payment_type == "tokenization":
            await self._process_tokenization_payment(session_id, metadata)
        elif payment_type == "crypto_purchase":
            await self._process_crypto_purchase_payment(session_id, metadata)

    async def _process_tokenization_payment(self, session_id: str, metadata: Dict[str, Any]):
        """Process successful tokenization payment"""
        
        supabase = get_supabase_client()
        
        # Create tokenization credit/permission for user
        tokenization_data = {
            "session_id": session_id,
            "user_id": metadata.get("user_id"),
            "wallet_address": metadata.get("wallet_address"),
            "package_id": metadata.get("package_id"),
            "package_name": metadata.get("package_name"),
            "status": "active",
            "created_at": "now()"
        }
        
        result = supabase.table("tokenization_credits").insert(tokenization_data).execute()
        
        return result.data[0] if result.data else None

    async def _process_crypto_purchase_payment(self, session_id: str, metadata: Dict[str, Any]):
        """Process successful crypto purchase payment"""
        
        supabase = get_supabase_client()
        
        # Create crypto purchase record
        crypto_purchase_data = {
            "session_id": session_id,
            "user_id": metadata.get("user_id"),
            "wallet_address": metadata.get("wallet_address"),
            "package_id": metadata.get("package_id"),
            "package_name": metadata.get("package_name"),
            "crypto_type": metadata.get("crypto_type"),
            "crypto_name": metadata.get("crypto_name"),
            "status": "processing",
            "created_at": "now()"
        }
        
        result = supabase.table("crypto_purchases").insert(crypto_purchase_data).execute()
        
        return result.data[0] if result.data else None

    def get_tokenization_packages(self) -> Dict[str, Any]:
        """Get available tokenization packages"""
        return self.TOKENIZATION_PACKAGES

    def get_crypto_packages(self) -> Dict[str, Any]:
        """Get available crypto packages"""
        return self.CRYPTO_PACKAGES

    def get_supported_crypto(self) -> Dict[str, Any]:
        """Get supported cryptocurrencies"""
        return self.SUPPORTED_CRYPTO

# Global service instance
payment_service = PaymentService()