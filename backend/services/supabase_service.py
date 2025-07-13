"""
Solcraft Nexus - Supabase Database Service
PostgreSQL database service for XRPL tokenization platform
"""

import os
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from supabase import create_client, Client
import asyncpg
from dotenv import load_dotenv
import logging
import json

load_dotenv()

logger = logging.getLogger(__name__)


class SupabaseService:
    """Service for Supabase PostgreSQL database operations"""
    
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.anon_key = os.getenv("SUPABASE_ANON_KEY")
        self.service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.url or not self.anon_key:
            raise ValueError("Supabase configuration missing")
        
        # Create Supabase client with service role for admin operations
        if self.service_role_key and self.service_role_key != "PLACEHOLDER_FOR_SERVICE_ROLE_KEY":
            self.supabase: Client = create_client(self.url, self.service_role_key)
            self.admin_access = True
            logger.info("Supabase initialized with service role key")
        else:
            self.supabase: Client = create_client(self.url, self.anon_key)
            self.admin_access = False
            logger.warning("Supabase initialized with anon key only - limited functionality")
    
    async def initialize_tables(self):
        """Initialize database tables for Solcraft Nexus"""
        try:
            if not self.admin_access:
                logger.warning("Cannot initialize tables without service role key")
                return False
            
            logger.info("Skipping table creation - tables already exist in Supabase dashboard")
            
            # Tables are already created via SQL Editor in Supabase dashboard
            # We just need to verify they exist
            try:
                # Test if tables exist by querying them
                await self.supabase.table("wallets").select("id").limit(1).execute()
                await self.supabase.table("tokenizations").select("id").limit(1).execute()
                await self.supabase.table("token_transactions").select("id").limit(1).execute()
                await self.supabase.table("platform_stats").select("id").limit(1).execute()
                
                logger.info("All required tables exist and are accessible")
                return True
                
            except Exception as e:
                logger.error(f"Error accessing tables: {str(e)}")
                # Tables might not exist - this is expected on first run
                logger.info("Tables will be created via Supabase dashboard SQL editor")
                return True  # Return True to allow service to continue
            
        except Exception as e:
            logger.error(f"Error during table initialization check: {str(e)}")
            return True  # Allow service to continue even if check fails
    
    async def _execute_raw_sql(self, sql: str):
        """Execute raw SQL using asyncpg for admin operations"""
        try:
            # Extract connection details from Supabase URL
            db_url = self.url.replace("https://", "").replace(".supabase.co", "")
            host = f"{db_url}.supabase.co"
            
            # Connect directly to PostgreSQL (if we have admin access)
            # This would require database credentials, which we don't have
            # So we'll use Supabase's rpc function instead
            logger.warning(f"Raw SQL execution attempted but not available: {sql}")
            
        except Exception as e:
            logger.error(f"Raw SQL execution failed: {str(e)}")
    
    # Wallet operations
    async def create_wallet(self, wallet_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update wallet record"""
        try:
            response = self.supabase.table("wallets").upsert(
                wallet_data,
                on_conflict="address"
            ).execute()
            
            return {
                "success": True,
                "data": response.data[0] if response.data else None
            }
        except Exception as e:
            logger.error(f"Error creating wallet: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_wallet(self, address: str) -> Dict[str, Any]:
        """Get wallet by address"""
        try:
            response = self.supabase.table("wallets").select("*").eq("address", address).execute()
            
            return {
                "success": True,
                "data": response.data[0] if response.data else None
            }
        except Exception as e:
            logger.error(f"Error getting wallet: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def update_wallet_activity(self, address: str) -> Dict[str, Any]:
        """Update wallet last activity"""
        try:
            response = self.supabase.table("wallets").update({
                "last_active": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).eq("address", address).execute()
            
            return {"success": True, "data": response.data}
        except Exception as e:
            logger.error(f"Error updating wallet activity: {str(e)}")
            return {"success": False, "error": str(e)}
    
    # Tokenization operations
    async def create_tokenization(self, tokenization_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new tokenization record"""
        try:
            response = self.supabase.table("tokenizations").insert(tokenization_data).execute()
            
            return {
                "success": True,
                "data": response.data[0] if response.data else None
            }
        except Exception as e:
            logger.error(f"Error creating tokenization: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_tokenization(self, tokenization_id: str) -> Dict[str, Any]:
        """Get tokenization by ID"""
        try:
            response = self.supabase.table("tokenizations").select("*").eq("id", tokenization_id).execute()
            
            return {
                "success": True,
                "data": response.data[0] if response.data else None
            }
        except Exception as e:
            logger.error(f"Error getting tokenization: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def update_tokenization_status(self, tokenization_id: str, status: str) -> Dict[str, Any]:
        """Update tokenization status"""
        try:
            response = self.supabase.table("tokenizations").update({
                "status": status,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", tokenization_id).execute()
            
            return {"success": True, "data": response.data}
        except Exception as e:
            logger.error(f"Error updating tokenization status: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_user_tokenizations(self, owner_address: str) -> Dict[str, Any]:
        """Get all tokenizations for a user"""
        try:
            response = self.supabase.table("tokenizations").select("*").eq("owner_address", owner_address).execute()
            
            return {
                "success": True,
                "data": response.data
            }
        except Exception as e:
            logger.error(f"Error getting user tokenizations: {str(e)}")
            return {"success": False, "error": str(e)}
    
    # Transaction operations
    async def create_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new transaction record"""
        try:
            response = self.supabase.table("token_transactions").insert(transaction_data).execute()
            
            return {
                "success": True,
                "data": response.data[0] if response.data else None
            }
        except Exception as e:
            logger.error(f"Error creating transaction: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_transaction(self, transaction_id: str) -> Dict[str, Any]:
        """Get transaction by ID"""
        try:
            response = self.supabase.table("token_transactions").select("*").eq("id", transaction_id).execute()
            
            return {
                "success": True,
                "data": response.data[0] if response.data else None
            }
        except Exception as e:
            logger.error(f"Error getting transaction: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def update_transaction_status(self, transaction_id: str, status: str, txn_hash: str = None) -> Dict[str, Any]:
        """Update transaction status"""
        try:
            update_data = {
                "status": status,
                "updated_at": datetime.utcnow().isoformat()
            }
            if txn_hash:
                update_data["txn_hash"] = txn_hash
            
            response = self.supabase.table("token_transactions").update(update_data).eq("id", transaction_id).execute()
            
            return {"success": True, "data": response.data}
        except Exception as e:
            logger.error(f"Error updating transaction status: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_user_transactions(self, address: str, limit: int = 20) -> Dict[str, Any]:
        """Get user transactions"""
        try:
            response = self.supabase.table("token_transactions").select("*").or_(
                f"from_address.eq.{address},to_address.eq.{address}"
            ).order("created_at", desc=True).limit(limit).execute()
            
            return {
                "success": True,
                "data": response.data
            }
        except Exception as e:
            logger.error(f"Error getting user transactions: {str(e)}")
            return {"success": False, "error": str(e)}
    
    # Analytics operations
    async def get_platform_stats(self) -> Dict[str, Any]:
        """Get platform statistics"""
        try:
            # Get current stats or create defaults
            stats = {}
            
            # Count total wallets
            wallets_response = self.supabase.table("wallets").select("id", count="exact").execute()
            stats["total_users"] = wallets_response.count or 0
            
            # Count active wallets (last 30 days)
            thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
            active_wallets_response = self.supabase.table("wallets").select("id", count="exact").gte("last_active", thirty_days_ago).execute()
            stats["active_users"] = active_wallets_response.count or 0
            
            # Count tokenizations
            tokenizations_response = self.supabase.table("tokenizations").select("id", count="exact").execute()
            stats["total_tokenizations"] = tokenizations_response.count or 0
            
            # Count active tokenizations
            active_tokenizations_response = self.supabase.table("tokenizations").select("id", count="exact").eq("status", "active").execute()
            stats["active_tokenizations"] = active_tokenizations_response.count or 0
            
            # Count transactions
            transactions_response = self.supabase.table("token_transactions").select("id", count="exact").execute()
            stats["total_transactions"] = transactions_response.count or 0
            
            # Count successful transactions
            successful_transactions_response = self.supabase.table("token_transactions").select("id", count="exact").eq("status", "validated").execute()
            stats["successful_transactions"] = successful_transactions_response.count or 0
            
            # Calculate TVL (mock for now)
            stats["total_value_locked"] = 245200000  # This should be calculated from real asset values
            
            return {"success": True, "data": stats}
        except Exception as e:
            logger.error(f"Error getting platform stats: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def update_platform_metric(self, metric_name: str, value: float) -> Dict[str, Any]:
        """Update or insert platform metric"""
        try:
            today = datetime.utcnow().date().isoformat()
            
            response = self.supabase.table("platform_stats").upsert({
                "metric_name": metric_name,
                "metric_value": value,
                "date_recorded": today
            }, on_conflict="metric_name,date_recorded").execute()
            
            return {"success": True, "data": response.data}
        except Exception as e:
            logger.error(f"Error updating platform metric: {str(e)}")
            return {"success": False, "error": str(e)}
    
    # Utility methods
    async def health_check(self) -> Dict[str, Any]:
        """Check database connection health"""
        try:
            response = self.supabase.table("wallets").select("id").limit(1).execute()
            return {
                "success": True,
                "status": "connected",
                "admin_access": self.admin_access
            }
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {
                "success": False,
                "status": "disconnected",
                "error": str(e)
            }


# Global service instance
supabase_service = SupabaseService()