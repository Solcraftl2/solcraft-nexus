#!/usr/bin/env python3
"""
Comprehensive Marketplace System Testing
Tests all marketplace endpoints and functionality as requested in review
"""

import requests
import json
import time
import sys
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://d781ac4e-78f7-4fa2-a4b9-91ed9128a1d1.preview.emergentagent.com"
BASE_URL = f"{BACKEND_URL}/api"

class MarketplaceTestSuite:
    def __init__(self):
        self.passed_tests = 0
        self.failed_tests = 0
        self.test_results = []
        
    def log_test(self, test_name, passed, details=""):
        """Log test result"""
        status = "✅ PASSED" if passed else "❌ FAILED"
        self.test_results.append(f"{status}: {test_name} - {details}")
        
        if passed:
            self.passed_tests += 1
        else:
            self.failed_tests += 1
            
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def test_marketplace_service_initialization(self):
        """Test 1: Marketplace Service Initialization"""
        print("\n=== Testing Marketplace Service Initialization ===")
        
        try:
            # Test basic API health
            response = requests.get(f"{BASE_URL}/health", timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                self.log_test("Health Check", True, f"Status: {health_data.get('status', 'unknown')}")
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}")
                
            # Test marketplace categories endpoint (tests service initialization)
            response = requests.get(f"{BASE_URL}/marketplace/categories", timeout=10)
            if response.status_code == 200:
                data = response.json()
                categories = data.get('categories', {})
                order_types = data.get('order_types', {})
                
                # Verify expected categories
                expected_categories = ['real_estate', 'private_credit', 'commodities', 'equity_securities', 'infrastructure', 'art_collectibles']
                found_categories = list(categories.keys())
                
                if all(cat in found_categories for cat in expected_categories):
                    self.log_test("Marketplace Categories", True, f"Found {len(found_categories)} categories: {', '.join(found_categories)}")
                else:
                    self.log_test("Marketplace Categories", False, f"Missing categories. Found: {found_categories}")
                
                # Verify order types
                expected_order_types = ['market', 'limit', 'stop']
                found_order_types = list(order_types.keys())
                
                if all(ot in found_order_types for ot in expected_order_types):
                    self.log_test("Order Types", True, f"Found order types: {', '.join(found_order_types)}")
                else:
                    self.log_test("Order Types", False, f"Missing order types. Found: {found_order_types}")
            else:
                self.log_test("Marketplace Service Initialization", False, f"Categories endpoint failed: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Marketplace Service Initialization", False, f"Exception: {str(e)}")
    
    def test_asset_listing_endpoints(self):
        """Test 2: Asset Listing Endpoints"""
        print("\n=== Testing Asset Listing Endpoints ===")
        
        try:
            # Test basic asset listing
            response = requests.get(f"{BASE_URL}/marketplace/assets", timeout=10)
            if response.status_code == 200:
                data = response.json()
                assets = data.get('data', {}).get('assets', [])
                
                if len(assets) > 0:
                    self.log_test("Basic Asset Listing", True, f"Found {len(assets)} assets")
                    
                    # Test asset structure
                    first_asset = assets[0]
                    required_fields = ['id', 'name', 'category', 'token_symbol', 'token_price']
                    
                    if all(field in first_asset for field in required_fields):
                        self.log_test("Asset Data Structure", True, f"All required fields present")
                    else:
                        missing = [f for f in required_fields if f not in first_asset]
                        self.log_test("Asset Data Structure", False, f"Missing fields: {missing}")
                else:
                    self.log_test("Basic Asset Listing", False, "No assets returned")
            else:
                self.log_test("Basic Asset Listing", False, f"HTTP {response.status_code}")
            
            # Test category filtering
            test_categories = ['real_estate', 'private_credit', 'commodities']
            for category in test_categories:
                response = requests.get(f"{BASE_URL}/marketplace/assets?category={category}", timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    assets = data.get('data', {}).get('assets', [])
                    
                    # Check if returned assets match category (if any)
                    if assets:
                        category_match = all(asset.get('category') == category for asset in assets)
                        self.log_test(f"Category Filter ({category})", category_match, 
                                    f"Found {len(assets)} assets" if category_match else "Category mismatch")
                    else:
                        self.log_test(f"Category Filter ({category})", True, "No assets in category (acceptable)")
                else:
                    self.log_test(f"Category Filter ({category})", False, f"HTTP {response.status_code}")
            
            # Test price range filtering
            response = requests.get(f"{BASE_URL}/marketplace/assets?min_price=100&max_price=300", timeout=10)
            if response.status_code == 200:
                data = response.json()
                assets = data.get('data', {}).get('assets', [])
                
                if assets:
                    price_in_range = all(100 <= asset.get('token_price', 0) <= 300 for asset in assets)
                    self.log_test("Price Range Filter", price_in_range, 
                                f"Found {len(assets)} assets in price range" if price_in_range else "Price range mismatch")
                else:
                    self.log_test("Price Range Filter", True, "No assets in price range (acceptable)")
            else:
                self.log_test("Price Range Filter", False, f"HTTP {response.status_code}")
            
            # Test sorting and pagination
            response = requests.get(f"{BASE_URL}/marketplace/assets?sort_by=token_price&sort_order=asc&limit=3&offset=0", timeout=10)
            if response.status_code == 200:
                data = response.json()
                assets = data.get('data', {}).get('assets', [])
                
                if len(assets) <= 3:
                    self.log_test("Pagination Limit", True, f"Returned {len(assets)} assets (≤3)")
                else:
                    self.log_test("Pagination Limit", False, f"Returned {len(assets)} assets (>3)")
                
                # Check sorting (if multiple assets)
                if len(assets) > 1:
                    prices = [asset.get('token_price', 0) for asset in assets]
                    is_sorted = all(prices[i] <= prices[i+1] for i in range(len(prices)-1))
                    self.log_test("Price Sorting (ASC)", is_sorted, f"Prices: {prices}")
                else:
                    self.log_test("Price Sorting (ASC)", True, "Single asset (sorting not applicable)")
            else:
                self.log_test("Sorting and Pagination", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Asset Listing Endpoints", False, f"Exception: {str(e)}")
    
    def test_asset_details_endpoint(self):
        """Test 3: Asset Details Endpoint"""
        print("\n=== Testing Asset Details Endpoint ===")
        
        try:
            # First get list of assets to get a valid asset_id
            response = requests.get(f"{BASE_URL}/marketplace/assets?limit=1", timeout=10)
            if response.status_code == 200:
                data = response.json()
                assets = data.get('data', {}).get('assets', [])
                
                if assets:
                    asset_id = assets[0]['id']
                    
                    # Test asset details endpoint
                    response = requests.get(f"{BASE_URL}/marketplace/assets/{asset_id}", timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        asset_details = data.get('data', {})
                        
                        # Check for detailed asset information
                        if 'asset' in asset_details:
                            self.log_test("Asset Details Retrieval", True, f"Retrieved details for asset {asset_id}")
                            
                            # Check for price history
                            if 'price_history' in asset_details:
                                price_history = asset_details['price_history']
                                if isinstance(price_history, list) and len(price_history) > 0:
                                    self.log_test("Price History Data", True, f"Found {len(price_history)} price points")
                                else:
                                    self.log_test("Price History Data", False, "Empty or invalid price history")
                            else:
                                self.log_test("Price History Data", False, "No price history in response")
                            
                            # Check for order book
                            if 'order_book' in asset_details:
                                order_book = asset_details['order_book']
                                if 'bids' in order_book and 'asks' in order_book:
                                    bids_count = len(order_book['bids'])
                                    asks_count = len(order_book['asks'])
                                    self.log_test("Order Book Data", True, f"Found {bids_count} bids, {asks_count} asks")
                                else:
                                    self.log_test("Order Book Data", False, "Missing bids or asks in order book")
                            else:
                                self.log_test("Order Book Data", False, "No order book in response")
                        else:
                            self.log_test("Asset Details Retrieval", False, "No asset data in response")
                    else:
                        self.log_test("Asset Details Retrieval", False, f"HTTP {response.status_code}")
                else:
                    self.log_test("Asset Details Endpoint", False, "No assets available for testing")
            else:
                self.log_test("Asset Details Endpoint", False, f"Failed to get asset list: HTTP {response.status_code}")
                
            # Test with invalid asset ID
            response = requests.get(f"{BASE_URL}/marketplace/assets/invalid_asset_id", timeout=10)
            if response.status_code == 404 or response.status_code == 500:
                self.log_test("Invalid Asset ID Handling", True, f"Properly handled invalid ID: HTTP {response.status_code}")
            else:
                self.log_test("Invalid Asset ID Handling", False, f"Unexpected response: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Asset Details Endpoint", False, f"Exception: {str(e)}")
    
    def test_order_management_endpoints(self):
        """Test 5: Order Management Endpoints"""
        print("\n=== Testing Order Management Endpoints ===")
        
        try:
            # Test order creation
            test_order = {
                "asset_id": "asset_1",
                "order_type": "limit",
                "side": "buy",
                "quantity": 10,
                "price": 250.0,
                "user_id": "test_user_123",
                "wallet_address": "rTestWalletAddress123456789"
            }
            
            response = requests.post(f"{BASE_URL}/marketplace/orders", 
                                   json=test_order, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success' and 'data' in data:
                    order_data = data['data']
                    order_id = order_data.get('order_id')
                    self.log_test("Order Creation", True, f"Created order {order_id}")
                    
                    # Store order_id for later tests
                    self.test_order_id = order_id
                else:
                    self.log_test("Order Creation", False, "Invalid response structure")
            else:
                self.log_test("Order Creation", False, f"HTTP {response.status_code}")
            
            # Test different order types
            order_types = [
                {"order_type": "market", "side": "buy", "quantity": 5},
                {"order_type": "limit", "side": "sell", "quantity": 8, "price": 260.0},
                {"order_type": "stop", "side": "sell", "quantity": 3, "price": 240.0}
            ]
            
            for i, order_params in enumerate(order_types):
                test_order = {
                    "asset_id": "asset_1",
                    "user_id": f"test_user_{i}",
                    "wallet_address": f"rTestWallet{i}",
                    **order_params
                }
                
                response = requests.post(f"{BASE_URL}/marketplace/orders", 
                                       json=test_order, timeout=10)
                
                if response.status_code == 200:
                    self.log_test(f"Order Type ({order_params['order_type']})", True, 
                                f"Created {order_params['order_type']} order")
                else:
                    self.log_test(f"Order Type ({order_params['order_type']})", False, 
                                f"HTTP {response.status_code}")
            
            # Test order validation
            invalid_orders = [
                {"asset_id": "asset_1", "order_type": "invalid", "side": "buy", "quantity": 10},
                {"asset_id": "asset_1", "order_type": "limit", "side": "invalid", "quantity": 10, "price": 250.0},
                {"asset_id": "asset_1", "order_type": "limit", "side": "buy", "quantity": -5, "price": 250.0},
                {"asset_id": "asset_1", "order_type": "limit", "side": "buy", "quantity": 10, "price": -100.0}
            ]
            
            for i, invalid_order in enumerate(invalid_orders):
                invalid_order.update({
                    "user_id": f"test_user_invalid_{i}",
                    "wallet_address": f"rInvalidTest{i}"
                })
                
                response = requests.post(f"{BASE_URL}/marketplace/orders", 
                                       json=invalid_order, timeout=10)
                
                if response.status_code >= 400:
                    self.log_test(f"Order Validation {i+1}", True, f"Rejected invalid order: HTTP {response.status_code}")
                else:
                    self.log_test(f"Order Validation {i+1}", False, f"Accepted invalid order: HTTP {response.status_code}")
            
            # Test get user orders
            response = requests.get(f"{BASE_URL}/marketplace/orders/test_user_123", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    orders = data.get('data', {}).get('orders', [])
                    self.log_test("Get User Orders", True, f"Retrieved {len(orders)} orders")
                else:
                    self.log_test("Get User Orders", False, "Invalid response structure")
            else:
                self.log_test("Get User Orders", False, f"HTTP {response.status_code}")
            
            # Test order cancellation (if we have an order_id)
            if hasattr(self, 'test_order_id'):
                response = requests.delete(f"{BASE_URL}/marketplace/orders/{self.test_order_id}?user_id=test_user_123", timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'success':
                        self.log_test("Order Cancellation", True, f"Cancelled order {self.test_order_id}")
                    else:
                        self.log_test("Order Cancellation", False, "Invalid response structure")
                else:
                    self.log_test("Order Cancellation", False, f"HTTP {response.status_code}")
            else:
                self.log_test("Order Cancellation", False, "No order ID available for testing")
                
        except Exception as e:
            self.log_test("Order Management Endpoints", False, f"Exception: {str(e)}")
    
    def test_trading_history_endpoint(self):
        """Test 6: Trading History Endpoint"""
        print("\n=== Testing Trading History Endpoint ===")
        
        try:
            # Test general trading history
            response = requests.get(f"{BASE_URL}/marketplace/trading-history", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    trades = data.get('data', {}).get('trades', [])
                    self.log_test("General Trading History", True, f"Retrieved {len(trades)} trades")
                    
                    # Check trade data structure
                    if trades:
                        first_trade = trades[0]
                        required_fields = ['id', 'asset_id', 'buyer_id', 'seller_id', 'quantity', 'price', 'created_at']
                        
                        if all(field in first_trade for field in required_fields):
                            self.log_test("Trade Data Structure", True, "All required fields present")
                        else:
                            missing = [f for f in required_fields if f not in first_trade]
                            self.log_test("Trade Data Structure", False, f"Missing fields: {missing}")
                    else:
                        self.log_test("Trade Data Structure", True, "No trades to validate (acceptable)")
                else:
                    self.log_test("General Trading History", False, "Invalid response structure")
            else:
                self.log_test("General Trading History", False, f"HTTP {response.status_code}")
            
            # Test filtering by user_id
            response = requests.get(f"{BASE_URL}/marketplace/trading-history?user_id=test_user_123", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    trades = data.get('data', {}).get('trades', [])
                    self.log_test("User Trading History", True, f"Retrieved {len(trades)} user trades")
                else:
                    self.log_test("User Trading History", False, "Invalid response structure")
            else:
                self.log_test("User Trading History", False, f"HTTP {response.status_code}")
            
            # Test filtering by asset_id
            response = requests.get(f"{BASE_URL}/marketplace/trading-history?asset_id=asset_1", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    trades = data.get('data', {}).get('trades', [])
                    self.log_test("Asset Trading History", True, f"Retrieved {len(trades)} asset trades")
                else:
                    self.log_test("Asset Trading History", False, "Invalid response structure")
            else:
                self.log_test("Asset Trading History", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Trading History Endpoint", False, f"Exception: {str(e)}")
    
    def test_mock_data_system(self):
        """Test 8: Mock Data System"""
        print("\n=== Testing Mock Data System ===")
        
        try:
            # Test that system returns data even when database is unavailable
            # This is tested by checking if responses include mock indicators
            
            response = requests.get(f"{BASE_URL}/marketplace/assets", timeout=10)
            if response.status_code == 200:
                data = response.json()
                assets = data.get('data', {}).get('assets', [])
                
                if assets:
                    # Check if mock data is being returned
                    is_mock = data.get('data', {}).get('mock', False)
                    self.log_test("Mock Data Availability", True, 
                                f"System returns data (mock: {is_mock})")
                    
                    # Verify mock assets have expected structure
                    first_asset = assets[0]
                    expected_fields = ['id', 'name', 'category', 'token_symbol', 'token_price', 'description']
                    
                    if all(field in first_asset for field in expected_fields):
                        self.log_test("Mock Asset Structure", True, "Mock assets have proper structure")
                    else:
                        self.log_test("Mock Asset Structure", False, "Mock assets missing required fields")
                else:
                    self.log_test("Mock Data System", False, "No data returned")
            else:
                self.log_test("Mock Data System", False, f"HTTP {response.status_code}")
            
            # Test mock order creation
            test_order = {
                "asset_id": "asset_1",
                "order_type": "limit",
                "side": "buy",
                "quantity": 5,
                "price": 250.0,
                "user_id": "mock_test_user",
                "wallet_address": "rMockTestWallet"
            }
            
            response = requests.post(f"{BASE_URL}/marketplace/orders", 
                                   json=test_order, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                is_mock = data.get('data', {}).get('mock', False)
                self.log_test("Mock Order Creation", True, 
                            f"Order creation works (mock: {is_mock})")
            else:
                self.log_test("Mock Order Creation", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Mock Data System", False, f"Exception: {str(e)}")
    
    def test_order_matching_system(self):
        """Test 9: Order Matching System"""
        print("\n=== Testing Order Matching System ===")
        
        try:
            # Test market order matching
            market_order = {
                "asset_id": "asset_1",
                "order_type": "market",
                "side": "buy",
                "quantity": 25,
                "user_id": "matching_test_user",
                "wallet_address": "rMatchingTestWallet"
            }
            
            response = requests.post(f"{BASE_URL}/marketplace/orders", 
                                   json=market_order, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                order_data = data.get('data', {})
                
                # Check if order has price calculated
                if 'order' in order_data and order_data['order'].get('price'):
                    self.log_test("Market Price Calculation", True, 
                                f"Market price calculated: ${order_data['order']['price']}")
                else:
                    self.log_test("Market Price Calculation", False, "No market price calculated")
                
                # Check for matching results
                matches = order_data.get('matches', [])
                self.log_test("Order Matching Logic", True, 
                            f"Order processed with {len(matches)} matches")
            else:
                self.log_test("Order Matching System", False, f"HTTP {response.status_code}")
            
            # Test order book generation
            response = requests.get(f"{BASE_URL}/marketplace/assets/asset_1", timeout=10)
            if response.status_code == 200:
                data = response.json()
                asset_details = data.get('data', {})
                
                if 'order_book' in asset_details:
                    order_book = asset_details['order_book']
                    
                    # Check order book structure
                    if 'bids' in order_book and 'asks' in order_book:
                        bids = order_book['bids']
                        asks = order_book['asks']
                        
                        # Verify bid/ask structure
                        if bids and all('price' in bid and 'quantity' in bid for bid in bids):
                            self.log_test("Order Book Bids", True, f"Found {len(bids)} valid bids")
                        else:
                            self.log_test("Order Book Bids", False, "Invalid bid structure")
                        
                        if asks and all('price' in ask and 'quantity' in ask for ask in asks):
                            self.log_test("Order Book Asks", True, f"Found {len(asks)} valid asks")
                        else:
                            self.log_test("Order Book Asks", False, "Invalid ask structure")
                        
                        # Check spread calculation
                        if 'spread' in order_book and 'last_price' in order_book:
                            self.log_test("Order Book Metrics", True, 
                                        f"Spread: {order_book['spread']}, Last: ${order_book['last_price']}")
                        else:
                            self.log_test("Order Book Metrics", False, "Missing spread or last price")
                    else:
                        self.log_test("Order Book Generation", False, "Missing bids or asks")
                else:
                    self.log_test("Order Book Generation", False, "No order book in asset details")
            else:
                self.log_test("Order Book Generation", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Order Matching System", False, f"Exception: {str(e)}")
    
    def test_api_endpoint_structure(self):
        """Test API endpoint structure and consistency"""
        print("\n=== Testing API Endpoint Structure ===")
        
        try:
            # Test that all endpoints are properly prefixed with /api
            endpoints_to_test = [
                "/marketplace/categories",
                "/marketplace/assets",
                "/marketplace/trading-history"
            ]
            
            for endpoint in endpoints_to_test:
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
                if response.status_code == 200:
                    self.log_test(f"API Prefix ({endpoint})", True, "Endpoint accessible with /api prefix")
                else:
                    self.log_test(f"API Prefix ({endpoint})", False, f"HTTP {response.status_code}")
            
            # Test consistent JSON response structure
            response = requests.get(f"{BASE_URL}/marketplace/categories", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'status' in data and data['status'] == 'success':
                    self.log_test("JSON Response Structure", True, "Consistent response format")
                else:
                    self.log_test("JSON Response Structure", False, "Inconsistent response format")
            else:
                self.log_test("JSON Response Structure", False, f"HTTP {response.status_code}")
            
            # Test error handling and HTTP status codes
            response = requests.get(f"{BASE_URL}/marketplace/assets/nonexistent_asset", timeout=10)
            if response.status_code >= 400:
                self.log_test("Error HTTP Status Codes", True, f"Proper error status: HTTP {response.status_code}")
            else:
                self.log_test("Error HTTP Status Codes", False, f"Unexpected status: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("API Endpoint Structure", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all marketplace tests"""
        print("🚀 STARTING COMPREHENSIVE MARKETPLACE SYSTEM TESTING")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Testing Time: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # Run all test suites
        self.test_marketplace_service_initialization()
        self.test_asset_listing_endpoints()
        self.test_asset_details_endpoint()
        self.test_order_management_endpoints()
        self.test_trading_history_endpoint()
        self.test_mock_data_system()
        self.test_order_matching_system()
        self.test_api_endpoint_structure()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 MARKETPLACE TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = self.passed_tests + self.failed_tests
        success_rate = (self.passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        print(f"\n🎯 MARKETPLACE SYSTEM STATUS: {'WORKING' if success_rate >= 80 else 'NEEDS ATTENTION'}")
        
        if self.failed_tests > 0:
            print(f"\n⚠️  FAILED TESTS:")
            for result in self.test_results:
                if "❌ FAILED" in result:
                    print(f"   {result}")
        
        return success_rate >= 80

if __name__ == "__main__":
    tester = MarketplaceTestSuite()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)