"""
Solcraft Nexus - Marketplace Service
Handles trading, order book, and marketplace operations for tokenized assets
"""

import os
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException
from .supabase_service import get_supabase_client

class MarketplaceService:
    def __init__(self):
        # Order types
        self.ORDER_TYPES = {
            "market": "Market Order",
            "limit": "Limit Order", 
            "stop": "Stop Order"
        }
        
        # Order sides
        self.ORDER_SIDES = {
            "buy": "Buy",
            "sell": "Sell"
        }
        
        # Order status
        self.ORDER_STATUS = {
            "pending": "Pending",
            "partial": "Partially Filled",
            "filled": "Filled",
            "cancelled": "Cancelled",
            "expired": "Expired"
        }
        
        # Asset categories for marketplace
        self.MARKETPLACE_CATEGORIES = {
            "real_estate": "Real Estate",
            "private_credit": "Private Credit",
            "commodities": "Commodities", 
            "equity_securities": "Equity Securities",
            "infrastructure": "Infrastructure",
            "art_collectibles": "Art & Collectibles"
        }

    async def list_marketplace_assets(
        self,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get list of assets available in marketplace"""
        
        supabase = get_supabase_client()
        
        try:
            # Build query
            query = supabase.table("marketplace_assets").select("""
                *,
                asset_info:tokenizations(*)
            """)
            
            # Apply filters
            if category and category in self.MARKETPLACE_CATEGORIES:
                query = query.eq("category", category)
            
            if min_price is not None:
                query = query.gte("token_price", min_price)
                
            if max_price is not None:
                query = query.lte("token_price", max_price)
            
            # Apply sorting
            if sort_order == "desc":
                query = query.order(sort_by, desc=True)
            else:
                query = query.order(sort_by)
                
            # Apply pagination
            query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            
            return {
                "success": True,
                "assets": result.data,
                "total": len(result.data),
                "offset": offset,
                "limit": limit
            }
            
        except Exception as e:
            # Return mock marketplace data if table doesn't exist
            mock_assets = self._get_mock_marketplace_assets()
            
            # Apply filters to mock data
            filtered_assets = mock_assets
            
            if category:
                filtered_assets = [a for a in filtered_assets if a.get("category") == category]
            
            if min_price is not None:
                filtered_assets = [a for a in filtered_assets if a.get("token_price", 0) >= min_price]
                
            if max_price is not None:
                filtered_assets = [a for a in filtered_assets if a.get("token_price", 0) <= max_price]
            
            # Apply pagination
            paginated_assets = filtered_assets[offset:offset + limit]
            
            return {
                "success": True,
                "assets": paginated_assets,
                "total": len(filtered_assets),
                "offset": offset,
                "limit": limit,
                "mock": True
            }

    async def get_asset_details(self, asset_id: str) -> Dict[str, Any]:
        """Get detailed information about a marketplace asset"""
        
        supabase = get_supabase_client()
        
        try:
            result = supabase.table("marketplace_assets").select("""
                *,
                asset_info:tokenizations(*),
                recent_trades:trades(*),
                order_book:orders(*)
            """).eq("id", asset_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Asset not found")
            
            asset = result.data[0]
            
            # Get price history
            price_history = await self._get_price_history(asset_id)
            
            # Get order book
            order_book = await self._get_order_book(asset_id)
            
            return {
                "success": True,
                "asset": asset,
                "price_history": price_history,
                "order_book": order_book
            }
            
        except Exception as e:
            # Return mock asset details
            mock_asset = self._get_mock_asset_details(asset_id)
            
            return {
                "success": True,
                "asset": mock_asset,
                "price_history": self._get_mock_price_history(),
                "order_book": self._get_mock_order_book(),
                "mock": True
            }

    async def create_order(
        self,
        asset_id: str,
        user_id: str,
        wallet_address: str,
        order_type: str,
        side: str,
        quantity: int,
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """Create a new trading order"""
        
        # Validate inputs
        if order_type not in self.ORDER_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid order type: {order_type}")
        
        if side not in self.ORDER_SIDES:
            raise HTTPException(status_code=400, detail=f"Invalid order side: {side}")
        
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")
        
        if order_type == "limit" and (price is None or price <= 0):
            raise HTTPException(status_code=400, detail="Limit orders require a positive price")
        
        # Get current market price for market orders
        if order_type == "market":
            price = await self._get_current_market_price(asset_id)
        
        order_id = str(uuid.uuid4())
        
        order_data = {
            "id": order_id,
            "asset_id": asset_id,
            "user_id": user_id,
            "wallet_address": wallet_address,
            "order_type": order_type,
            "side": side,
            "quantity": quantity,
            "price": price,
            "filled_quantity": 0,
            "remaining_quantity": quantity,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=30)).isoformat()  # 30 day expiry
        }
        
        supabase = get_supabase_client()
        
        try:
            # Store order in database
            result = supabase.table("orders").insert(order_data).execute()
            
            # Try to match order immediately
            matches = await self._match_order(order_data)
            
            return {
                "success": True,
                "order": order_data,
                "matches": matches,
                "order_id": order_id
            }
            
        except Exception as e:
            # Mock order creation if database not available
            return {
                "success": True,
                "order": order_data,
                "matches": [],
                "order_id": order_id,
                "mock": True,
                "message": "Order created successfully (mock mode)"
            }

    async def get_user_orders(
        self,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get user's trading orders"""
        
        supabase = get_supabase_client()
        
        try:
            query = supabase.table("orders").select("*").eq("user_id", user_id)
            
            if status and status in self.ORDER_STATUS:
                query = query.eq("status", status)
            
            query = query.order("created_at", desc=True).limit(limit)
            
            result = query.execute()
            
            return {
                "success": True,
                "orders": result.data
            }
            
        except Exception as e:
            # Return mock user orders
            mock_orders = self._get_mock_user_orders(user_id)
            
            if status:
                mock_orders = [o for o in mock_orders if o.get("status") == status]
            
            return {
                "success": True,
                "orders": mock_orders[:limit],
                "mock": True
            }

    async def cancel_order(self, order_id: str, user_id: str) -> Dict[str, Any]:
        """Cancel a pending order"""
        
        supabase = get_supabase_client()
        
        try:
            # Check if order exists and belongs to user
            order_result = supabase.table("orders").select("*").eq("id", order_id).eq("user_id", user_id).execute()
            
            if not order_result.data:
                raise HTTPException(status_code=404, detail="Order not found")
            
            order = order_result.data[0]
            
            if order["status"] != "pending":
                raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")
            
            # Update order status
            update_result = supabase.table("orders").update({
                "status": "cancelled",
                "cancelled_at": datetime.now().isoformat()
            }).eq("id", order_id).execute()
            
            return {
                "success": True,
                "message": "Order cancelled successfully",
                "order_id": order_id
            }
            
        except HTTPException:
            raise
        except Exception as e:
            # Mock cancellation
            return {
                "success": True,
                "message": "Order cancelled successfully (mock mode)",
                "order_id": order_id,
                "mock": True
            }

    async def get_trading_history(
        self,
        user_id: Optional[str] = None,
        asset_id: Optional[str] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """Get trading history"""
        
        supabase = get_supabase_client()
        
        try:
            query = supabase.table("trades").select("""
                *,
                asset_info:marketplace_assets(name, token_symbol),
                buyer_info:profiles(wallet_address),
                seller_info:profiles(wallet_address)
            """)
            
            if user_id:
                query = query.or_(f"buyer_id.eq.{user_id},seller_id.eq.{user_id}")
            
            if asset_id:
                query = query.eq("asset_id", asset_id)
            
            query = query.order("created_at", desc=True).limit(limit)
            
            result = query.execute()
            
            return {
                "success": True,
                "trades": result.data
            }
            
        except Exception as e:
            # Return mock trading history
            mock_trades = self._get_mock_trading_history(user_id, asset_id)
            
            return {
                "success": True,
                "trades": mock_trades[:limit],
                "mock": True
            }

    async def _match_order(self, order: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Match order with existing orders in order book"""
        
        # Simple matching logic for demo
        matches = []
        
        # For market orders, try to find immediate matches
        if order["order_type"] == "market":
            # Mock matching for demonstration
            if order["side"] == "buy":
                # Find best sell orders
                matches.append({
                    "matched_quantity": min(order["quantity"], 50),
                    "matched_price": order["price"],
                    "trade_id": str(uuid.uuid4())
                })
        
        return matches

    async def _get_current_market_price(self, asset_id: str) -> float:
        """Get current market price for an asset"""
        
        # Mock pricing logic
        base_prices = {
            "asset_1": 250.0,
            "asset_2": 100.0,
            "asset_3": 150.0
        }
        
        base_price = base_prices.get(asset_id, 200.0)
        
        # Add some random variation (-5% to +5%)
        import random
        variation = random.uniform(-0.05, 0.05)
        
        return round(base_price * (1 + variation), 2)

    async def _get_price_history(self, asset_id: str) -> List[Dict[str, Any]]:
        """Get price history for an asset"""
        
        # Mock price history
        history = []
        base_price = 250.0
        
        for i in range(30):  # 30 days of history
            date = datetime.now() - timedelta(days=i)
            # Simulate price movement
            import random
            price_change = random.uniform(-0.03, 0.03)
            base_price *= (1 + price_change)
            
            history.append({
                "date": date.isoformat(),
                "price": round(base_price, 2),
                "volume": random.randint(100, 1000)
            })
        
        return list(reversed(history))

    async def _get_order_book(self, asset_id: str) -> Dict[str, Any]:
        """Get order book for an asset"""
        
        # Mock order book
        return {
            "bids": [  # Buy orders
                {"price": 248.50, "quantity": 150, "orders": 3},
                {"price": 248.00, "quantity": 200, "orders": 2},
                {"price": 247.50, "quantity": 100, "orders": 1}
            ],
            "asks": [  # Sell orders
                {"price": 251.50, "quantity": 100, "orders": 1},
                {"price": 252.00, "quantity": 180, "orders": 2},
                {"price": 252.50, "quantity": 220, "orders": 4}
            ],
            "spread": 3.0,
            "last_price": 250.0
        }

    def _get_mock_marketplace_assets(self) -> List[Dict[str, Any]]:
        """Get mock marketplace assets for demo"""
        
        return [
            {
                "id": "asset_1",
                "name": "Manhattan Premium Office",
                "category": "real_estate",
                "token_symbol": "MPO",
                "token_price": 250.0,
                "total_supply": 10000,
                "available_tokens": 3500,
                "market_cap": 2500000,
                "apy": 8.5,
                "location": "Manhattan, NY",
                "description": "Class A office building with 95% occupancy",
                "image_url": "/api/placeholder/400/300",
                "created_at": "2024-01-15T10:00:00Z",
                "volume_24h": 125000,
                "price_change_24h": 2.5
            },
            {
                "id": "asset_2", 
                "name": "European Credit Fund III",
                "category": "private_credit",
                "token_symbol": "ECF3",
                "token_price": 100.0,
                "total_supply": 50000,
                "available_tokens": 12000,
                "market_cap": 5000000,
                "apy": 12.3,
                "location": "Europe",
                "description": "Diversified private credit fund focusing on SME lending",
                "image_url": "/api/placeholder/400/300",
                "created_at": "2024-02-01T09:00:00Z",
                "volume_24h": 87500,
                "price_change_24h": -1.2
            },
            {
                "id": "asset_3",
                "name": "Gold Reserve Tokens",
                "category": "commodities",
                "token_symbol": "GRT",
                "token_price": 150.0,
                "total_supply": 25000,
                "available_tokens": 8000,
                "market_cap": 3750000,
                "apy": 6.7,
                "location": "Global",
                "description": "Physical gold backed tokens with vault storage",
                "image_url": "/api/placeholder/400/300",
                "created_at": "2024-01-20T14:00:00Z",
                "volume_24h": 67500,
                "price_change_24h": 1.8
            },
            {
                "id": "asset_4",
                "name": "Tech Startup Portfolio",
                "category": "equity_securities", 
                "token_symbol": "TSP",
                "token_price": 75.0,
                "total_supply": 40000,
                "available_tokens": 15000,
                "market_cap": 3000000,
                "apy": 18.7,
                "location": "Silicon Valley",
                "description": "Diversified portfolio of early-stage tech startups",
                "image_url": "/api/placeholder/400/300",
                "created_at": "2024-02-10T11:00:00Z",
                "volume_24h": 156000,
                "price_change_24h": 4.2
            },
            {
                "id": "asset_5",
                "name": "Renewable Energy Infrastructure",
                "category": "infrastructure",
                "token_symbol": "REI",
                "token_price": 200.0,
                "total_supply": 15000,
                "available_tokens": 5500,
                "market_cap": 3000000,
                "apy": 9.8,
                "location": "Northern Europe",
                "description": "Solar and wind farm infrastructure projects",
                "image_url": "/api/placeholder/400/300",
                "created_at": "2024-01-25T16:00:00Z",
                "volume_24h": 98000,
                "price_change_24h": 0.8
            },
            {
                "id": "asset_6",
                "name": "Contemporary Art Collection",
                "category": "art_collectibles",
                "token_symbol": "CAC",
                "token_price": 500.0,
                "total_supply": 5000,
                "available_tokens": 1200,
                "market_cap": 2500000,
                "apy": 15.2,
                "location": "International",
                "description": "Curated collection of contemporary artworks",
                "image_url": "/api/placeholder/400/300",
                "created_at": "2024-02-05T13:00:00Z",
                "volume_24h": 45000,
                "price_change_24h": 3.1
            }
        ]

    def _get_mock_asset_details(self, asset_id: str) -> Dict[str, Any]:
        """Get mock asset details"""
        
        assets = self._get_mock_marketplace_assets()
        asset = next((a for a in assets if a["id"] == asset_id), assets[0])
        
        # Add additional details
        asset.update({
            "detailed_description": "Comprehensive asset analysis and investment opportunity details...",
            "risk_factors": ["Market volatility", "Liquidity constraints", "Regulatory changes"],
            "investment_highlights": ["Strong historical performance", "Experienced management", "Diversified exposure"],
            "financial_metrics": {
                "nav_per_token": asset["token_price"],
                "total_assets": asset["market_cap"],
                "management_fee": "1.5% annually",
                "performance_fee": "20% above hurdle rate"
            }
        })
        
        return asset

    def _get_mock_price_history(self) -> List[Dict[str, Any]]:
        """Get mock price history"""
        
        history = []
        base_price = 250.0
        
        for i in range(30):
            date = datetime.now() - timedelta(days=i)
            import random
            price_change = random.uniform(-0.02, 0.02)
            base_price *= (1 + price_change)
            
            history.append({
                "date": date.isoformat(),
                "price": round(base_price, 2),
                "volume": random.randint(50, 500)
            })
        
        return list(reversed(history))

    def _get_mock_order_book(self) -> Dict[str, Any]:
        """Get mock order book"""
        
        return {
            "bids": [
                {"price": 248.50, "quantity": 150, "orders": 3},
                {"price": 248.00, "quantity": 200, "orders": 2},
                {"price": 247.50, "quantity": 100, "orders": 1},
                {"price": 247.00, "quantity": 180, "orders": 2}
            ],
            "asks": [
                {"price": 251.50, "quantity": 100, "orders": 1},
                {"price": 252.00, "quantity": 180, "orders": 2},
                {"price": 252.50, "quantity": 220, "orders": 4},
                {"price": 253.00, "quantity": 150, "orders": 2}
            ],
            "spread": 3.0,
            "last_price": 250.0,
            "daily_volume": 125000,
            "daily_high": 253.5,
            "daily_low": 247.8
        }

    def _get_mock_user_orders(self, user_id: str) -> List[Dict[str, Any]]:
        """Get mock user orders"""
        
        return [
            {
                "id": "order_1",
                "asset_id": "asset_1",
                "asset_name": "Manhattan Premium Office",
                "order_type": "limit",
                "side": "buy",
                "quantity": 100,
                "price": 248.0,
                "filled_quantity": 0,
                "remaining_quantity": 100,
                "status": "pending",
                "created_at": "2024-12-01T10:30:00Z",
                "expires_at": "2024-12-31T10:30:00Z"
            },
            {
                "id": "order_2",
                "asset_id": "asset_2",
                "asset_name": "European Credit Fund III",
                "order_type": "market",
                "side": "sell",
                "quantity": 50,
                "price": 100.5,
                "filled_quantity": 50,
                "remaining_quantity": 0,
                "status": "filled",
                "created_at": "2024-11-28T14:15:00Z",
                "filled_at": "2024-11-28T14:15:30Z"
            }
        ]

    def _get_mock_trading_history(self, user_id: Optional[str] = None, asset_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get mock trading history"""
        
        return [
            {
                "id": "trade_1",
                "asset_id": "asset_1",
                "asset_name": "Manhattan Premium Office",
                "buyer_id": "user_1",
                "seller_id": "user_2",
                "quantity": 75,
                "price": 249.5,
                "total_value": 18712.5,
                "created_at": "2024-12-01T09:45:00Z",
                "trade_type": "market"
            },
            {
                "id": "trade_2",
                "asset_id": "asset_2",
                "asset_name": "European Credit Fund III",
                "buyer_id": "user_3",
                "seller_id": "user_1",
                "quantity": 200,
                "price": 99.8,
                "total_value": 19960.0,
                "created_at": "2024-11-30T16:20:00Z",
                "trade_type": "limit"
            }
        ]

    def get_marketplace_categories(self) -> Dict[str, str]:
        """Get available marketplace categories"""
        return self.MARKETPLACE_CATEGORIES

    def get_order_types(self) -> Dict[str, str]:
        """Get available order types"""
        return self.ORDER_TYPES

    def get_order_status_types(self) -> Dict[str, str]:
        """Get order status types"""
        return self.ORDER_STATUS

# Global service instance
marketplace_service = MarketplaceService()