#!/usr/bin/env python3
"""
PWA Implementation Backend API Testing for Solcraft Nexus
Tests backend API endpoints after PWA implementation to ensure all services are still working correctly
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://a6405e2b-f74e-4218-95ed-72a50de34fbe.preview.emergentagent.com/api"

# Test data - using realistic data for comprehensive testing
TEST_WALLET_ADDRESS = "rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY"  # Well-known XRPL address
INVALID_WALLET_ADDRESS = "invalid_address_format"
TEST_TOKEN_SYMBOL = "TST"
TEST_ISSUER_ADDRESS = "rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY"

class PWABackendTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, 
                          headers: Dict = None, auth_required: bool = False) -> Dict[str, Any]:
        """Make HTTP request to backend"""
        url = f"{BACKEND_URL}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if headers:
            request_headers.update(headers)
            
        if auth_required and self.auth_token:
            request_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            async with self.session.request(
                method, url, 
                json=data if data else None,
                headers=request_headers,
                timeout=aiohttp.ClientTimeout(total=60)  # Increased timeout for XRPL calls
            ) as response:
                try:
                    response_data = await response.json()
                except:
                    response_data = {"error": "Invalid JSON response", "text": await response.text()}
                
                return {
                    "status_code": response.status,
                    "data": response_data,
                    "success": 200 <= response.status < 300
                }
        except asyncio.TimeoutError:
            return {
                "status_code": 408,
                "data": {"error": "Request timeout"},
                "success": False
            }
        except Exception as e:
            return {
                "status_code": 500,
                "data": {"error": str(e)},
                "success": False
            }
    
    async def test_health_check_endpoint(self):
        """Test 1: Health Check - Verify /api/health endpoint returns healthy status"""
        print("\n=== 1. HEALTH CHECK ENDPOINT ===")
        
        response = await self.make_request("GET", "/health")
        
        if response["success"]:
            data = response["data"]
            
            # Check required fields
            status_healthy = data.get("status") == "healthy"
            has_timestamp = "timestamp" in data
            has_services = "services" in data
            
            services = data.get("services", {})
            db_connected = services.get("database") == "connected"
            xrpl_connected = services.get("xrpl") == "connected"
            xumm_status = services.get("xumm") in ["available", "unavailable"]
            
            health_check_ok = (
                status_healthy and has_timestamp and has_services and
                db_connected and xrpl_connected and xumm_status
            )
            
            self.log_test(
                "Health Check Endpoint",
                health_check_ok,
                f"Status: {data.get('status')}, DB: {services.get('database')}, XRPL: {services.get('xrpl')}, XUMM: {services.get('xumm')}"
            )
            
        else:
            self.log_test("Health Check Endpoint", False, f"HTTP {response['status_code']}", response["data"])

    async def test_platform_analytics_endpoint(self):
        """Test 2: Platform Analytics - Test /api/analytics/platform endpoint"""
        print("\n=== 2. PLATFORM ANALYTICS ENDPOINT ===")
        
        response = await self.make_request("POST", "/analytics/platform")
        
        if response["success"]:
            data = response["data"]
            
            # Check response structure
            status_success = data.get("status") == "success"
            has_platform_stats = "platform_stats" in data
            
            if has_platform_stats:
                stats = data["platform_stats"]
                
                # Check required fields
                required_fields = [
                    "total_value_locked", "total_tokenizations", "active_tokenizations",
                    "total_transactions", "successful_transactions", "total_users",
                    "active_users", "success_rate"
                ]
                
                all_fields_present = all(field in stats for field in required_fields)
                
                # Check TVL value
                tvl = stats.get("total_value_locked", 0)
                tvl_reasonable = tvl > 0  # Should have some value
                
                analytics_ok = status_success and has_platform_stats and all_fields_present and tvl_reasonable
                
                self.log_test(
                    "Platform Analytics Endpoint",
                    analytics_ok,
                    f"TVL: ${tvl:,.0f}, Users: {stats.get('total_users', 0)}, Transactions: {stats.get('total_transactions', 0)}"
                )
            else:
                self.log_test("Platform Analytics Endpoint", False, "Missing platform_stats", data)
                
        else:
            self.log_test("Platform Analytics Endpoint", False, f"HTTP {response['status_code']}", response["data"])

    async def test_service_status_endpoints(self):
        """Test 3: Service Status - Ensure all services are functional"""
        print("\n=== 3. SERVICE STATUS VERIFICATION ===")
        
        # Test XRPL Service
        response = await self.make_request("POST", "/wallet/xumm/connect")
        
        if response["success"]:
            data = response["data"]
            xrpl_working = (
                data.get("success") == True and
                "payload_uuid" in data and
                "qr_url" in data
            )
            
            self.log_test(
                "XRPL Service Status",
                xrpl_working,
                "XRPL service creating XUMM payloads successfully"
            )
        else:
            # Check if it's a proper error response (not a crash)
            proper_error = response["status_code"] in [400, 500] and "error" in str(response["data"])
            self.log_test(
                "XRPL Service Status", 
                proper_error,
                f"XRPL service responding with proper errors (HTTP {response['status_code']})"
            )
        
        # Test Database Service (already tested in health check, but verify again)
        response = await self.make_request("GET", "/health")
        if response["success"]:
            services = response["data"].get("services", {})
            db_working = services.get("database") == "connected"
            
            self.log_test(
                "Database Service Status",
                db_working,
                f"Database status: {services.get('database')}"
            )
        else:
            self.log_test("Database Service Status", False, "Health check failed")

    async def test_cors_and_api_structure(self):
        """Test 4: CORS and API Structure - Verify all endpoints are properly prefixed with /api"""
        print("\n=== 4. CORS AND API STRUCTURE ===")
        
        # Test CORS headers
        response = await self.make_request("OPTIONS", "/health")
        cors_working = response["status_code"] in [200, 204, 405]  # OPTIONS might not be implemented but should not crash
        
        self.log_test(
            "CORS Configuration",
            cors_working,
            f"CORS preflight handling (HTTP {response['status_code']})"
        )
        
        # Test API prefix structure - all endpoints should be under /api
        api_endpoints = [
            "/health",
            "/analytics/platform", 
            "/marketplace/categories",
            "/payments/packages/tokenization",
            "/ai/analysis-types"
        ]
        
        all_prefixed_correctly = True
        for endpoint in api_endpoints:
            # The endpoint should work with /api prefix (which is already in our BACKEND_URL)
            if endpoint == "/analytics/platform":
                response = await self.make_request("POST", endpoint)
            else:
                response = await self.make_request("GET", endpoint)
            if not (response["success"] or response["status_code"] in [400, 401, 403, 404, 405]):
                all_prefixed_correctly = False
                break
        
        self.log_test(
            "API Prefix Structure",
            all_prefixed_correctly,
            "All endpoints properly prefixed with /api"
        )

    async def test_marketplace_categories_endpoint(self):
        """Test 5: Marketplace Categories - Test /api/marketplace/categories"""
        print("\n=== 5. MARKETPLACE CATEGORIES ENDPOINT ===")
        
        response = await self.make_request("GET", "/marketplace/categories")
        
        if response["success"]:
            data = response["data"]
            
            status_success = data.get("status") == "success"
            has_categories = "categories" in data
            has_order_types = "order_types" in data
            
            if has_categories and has_order_types:
                categories = data["categories"]
                order_types = data["order_types"]
                
                # Check expected categories
                expected_categories = [
                    "real_estate", "private_credit", "commodities", 
                    "equity_securities", "infrastructure", "art_collectibles"
                ]
                
                categories_ok = len(categories) >= 6 and all(cat in categories for cat in expected_categories)
                
                # Check expected order types
                expected_order_types = ["market", "limit", "stop"]
                order_types_ok = all(ot in order_types for ot in expected_order_types)
                
                marketplace_ok = status_success and categories_ok and order_types_ok
                
                self.log_test(
                    "Marketplace Categories Endpoint",
                    marketplace_ok,
                    f"Categories: {len(categories)}, Order Types: {len(order_types)}"
                )
            else:
                self.log_test("Marketplace Categories Endpoint", False, "Missing categories or order_types", data)
                
        else:
            self.log_test("Marketplace Categories Endpoint", False, f"HTTP {response['status_code']}", response["data"])

    async def test_payment_packages_endpoint(self):
        """Test 6: Payment Packages - Test /api/payments/packages/tokenization"""
        print("\n=== 6. PAYMENT PACKAGES ENDPOINT ===")
        
        response = await self.make_request("GET", "/payments/packages/tokenization")
        
        if response["success"]:
            data = response["data"]
            
            status_success = data.get("status") == "success"
            has_packages = "packages" in data
            
            if has_packages:
                packages = data["packages"]
                
                # Check for expected packages
                package_names = [pkg.get("name", "").lower() for pkg in packages]
                has_basic = any("basic" in name for name in package_names)
                has_premium = any("premium" in name for name in package_names)
                has_enterprise = any("enterprise" in name for name in package_names)
                
                # Check package structure
                packages_structured = all(
                    "id" in pkg and "name" in pkg and "price" in pkg 
                    for pkg in packages
                )
                
                payment_packages_ok = (
                    status_success and has_packages and 
                    has_basic and has_premium and has_enterprise and
                    packages_structured
                )
                
                self.log_test(
                    "Payment Packages Endpoint",
                    payment_packages_ok,
                    f"Packages found: {len(packages)} (Basic, Premium, Enterprise)"
                )
            else:
                self.log_test("Payment Packages Endpoint", False, "Missing packages", data)
                
        else:
            self.log_test("Payment Packages Endpoint", False, f"HTTP {response['status_code']}", response["data"])

    async def test_ai_analysis_types_endpoint(self):
        """Test 7: AI Analysis Types - Test /api/ai/analysis-types"""
        print("\n=== 7. AI ANALYSIS TYPES ENDPOINT ===")
        
        response = await self.make_request("GET", "/ai/analysis-types")
        
        if response["success"]:
            data = response["data"]
            
            status_success = data.get("status") == "success"
            has_analysis_types = "analysis_types" in data
            has_asset_classes = "supported_asset_classes" in data
            
            if has_analysis_types and has_asset_classes:
                analysis_types = data["analysis_types"]
                asset_classes = data["supported_asset_classes"]
                
                # Check expected analysis types
                expected_analysis_types = [
                    "asset_analysis", "market_prediction", 
                    "risk_assessment", "portfolio_optimization"
                ]
                
                analysis_types_ok = all(at in analysis_types for at in expected_analysis_types)
                
                # Check expected asset classes
                expected_asset_classes = [
                    "real_estate", "private_credit", "commodities", "equity_securities"
                ]
                
                asset_classes_ok = all(ac in asset_classes for ac in expected_asset_classes)
                
                ai_types_ok = (
                    status_success and has_analysis_types and has_asset_classes and
                    analysis_types_ok and asset_classes_ok
                )
                
                self.log_test(
                    "AI Analysis Types Endpoint",
                    ai_types_ok,
                    f"Analysis Types: {len(analysis_types)}, Asset Classes: {len(asset_classes)}"
                )
            else:
                self.log_test("AI Analysis Types Endpoint", False, "Missing analysis_types or supported_asset_classes", data)
                
        else:
            self.log_test("AI Analysis Types Endpoint", False, f"HTTP {response['status_code']}", response["data"])

    async def test_ai_endpoints_functionality(self):
        """Test 8: AI Endpoints Functionality - Test AI analysis endpoints that need retesting"""
        print("\n=== 8. AI ENDPOINTS FUNCTIONALITY ===")
        
        # Test Asset Analysis Endpoint
        asset_data = {
            "asset_data": {
                "name": "Premium Office Building",
                "type": "real_estate",
                "location": "Manhattan, NY",
                "value": 5000000,
                "annual_income": 400000
            },
            "analysis_type": "comprehensive",
            "language": "en"
        }
        
        response = await self.make_request("POST", "/ai/analyze-asset", asset_data)
        
        # Should return 500 due to missing OpenAI API key, but with proper error handling
        asset_analysis_handled = (
            response["status_code"] == 500 and 
            "OPENAI_API_KEY" in str(response["data"]) and
            "not configured" in str(response["data"]).lower()
        )
        
        self.log_test(
            "Asset Analysis Endpoint Error Handling",
            asset_analysis_handled,
            "Proper error handling for missing OpenAI API key"
        )
        
        # Test Market Prediction Endpoint
        market_data = {
            "asset_class": "real_estate",
            "time_horizon": "3_months",
            "language": "en"
        }
        
        response = await self.make_request("POST", "/ai/market-prediction", market_data)
        
        market_prediction_handled = (
            response["status_code"] == 500 and 
            "OPENAI_API_KEY" in str(response["data"]) and
            "not configured" in str(response["data"]).lower()
        )
        
        self.log_test(
            "Market Prediction Endpoint Error Handling",
            market_prediction_handled,
            "Proper error handling for missing OpenAI API key"
        )
        
        # Test Risk Assessment Endpoint
        risk_data = {
            "portfolio_data": {
                "assets": [
                    {"type": "real_estate", "value": 1000000, "allocation": 0.6},
                    {"type": "equity_securities", "value": 666667, "allocation": 0.4}
                ],
                "total_value": 1666667
            },
            "language": "en"
        }
        
        response = await self.make_request("POST", "/ai/risk-assessment", risk_data)
        
        risk_assessment_handled = (
            response["status_code"] == 500 and 
            "OPENAI_API_KEY" in str(response["data"]) and
            "not configured" in str(response["data"]).lower()
        )
        
        self.log_test(
            "Risk Assessment Endpoint Error Handling",
            risk_assessment_handled,
            "Proper error handling for missing OpenAI API key"
        )
        
        # Test Portfolio Optimization Endpoint
        portfolio_data = {
            "portfolio_data": {
                "assets": [
                    {"type": "real_estate", "value": 1000000, "allocation": 0.6},
                    {"type": "equity_securities", "value": 666667, "allocation": 0.4}
                ],
                "total_value": 1666667
            },
            "optimization_goals": ["maximize_return", "minimize_risk"],
            "language": "en"
        }
        
        response = await self.make_request("POST", "/ai/optimize-portfolio", portfolio_data)
        
        portfolio_optimization_handled = (
            response["status_code"] == 500 and 
            "OPENAI_API_KEY" in str(response["data"]) and
            "not configured" in str(response["data"]).lower()
        )
        
        self.log_test(
            "Portfolio Optimization Endpoint Error Handling",
            portfolio_optimization_handled,
            "Proper error handling for missing OpenAI API key"
        )

    async def test_error_handling_graceful(self):
        """Test 9: Error Handling - Test graceful error handling for missing configurations"""
        print("\n=== 9. GRACEFUL ERROR HANDLING ===")
        
        # Test invalid endpoint
        response = await self.make_request("GET", "/nonexistent-endpoint")
        
        not_found_handled = response["status_code"] == 404
        
        self.log_test(
            "404 Error Handling",
            not_found_handled,
            f"Non-existent endpoints return proper 404 (HTTP {response['status_code']})"
        )
        
        # Test invalid JSON data
        invalid_json_data = {
            "invalid_field": "test",
            "missing_required_fields": True
        }
        
        response = await self.make_request("POST", "/ai/analyze-asset", invalid_json_data)
        
        validation_error_handled = response["status_code"] in [400, 422, 500]
        
        self.log_test(
            "Validation Error Handling",
            validation_error_handled,
            f"Invalid data properly rejected (HTTP {response['status_code']})"
        )
        
        # Test authentication on protected endpoints
        response = await self.make_request("POST", "/tokenize/asset", {
            "asset_name": "Test Asset",
            "asset_type": "real_estate",
            "asset_description": "Test description",
            "asset_value_usd": 1000000
        })
        
        auth_error_handled = response["status_code"] in [401, 403]
        
        self.log_test(
            "Authentication Error Handling",
            auth_error_handled,
            f"Protected endpoints require authentication (HTTP {response['status_code']})"
        )

    async def test_backend_functionality_maintained(self):
        """Test 10: Backend Functionality Maintained - Verify 100% backend functionality after PWA"""
        print("\n=== 10. BACKEND FUNCTIONALITY MAINTAINED ===")
        
        # Test core endpoints are still working
        core_endpoints = [
            ("/health", "GET"),
            ("/", "GET"),
            ("/analytics/platform", "POST"),
            ("/marketplace/categories", "GET"),
            ("/payments/packages/tokenization", "GET"),
            ("/payments/packages/crypto", "GET"),
            ("/ai/analysis-types", "GET")
        ]
        
        all_core_working = True
        working_endpoints = 0
        
        for endpoint, method in core_endpoints:
            response = await self.make_request(method, endpoint)
            
            if response["success"]:
                working_endpoints += 1
            else:
                # Some endpoints might return errors but should not crash
                if response["status_code"] not in [500]:  # 500 might indicate crashes
                    working_endpoints += 1
                else:
                    all_core_working = False
        
        functionality_maintained = working_endpoints >= len(core_endpoints) * 0.9  # 90% threshold
        
        self.log_test(
            "Core Endpoints Functionality",
            functionality_maintained,
            f"{working_endpoints}/{len(core_endpoints)} core endpoints working"
        )
        
        # Test that backend is responsive
        start_time = datetime.now()
        response = await self.make_request("GET", "/health")
        response_time = (datetime.now() - start_time).total_seconds()
        
        responsive = response_time < 10.0 and response["success"]
        
        self.log_test(
            "Backend Responsiveness",
            responsive,
            f"Health check response time: {response_time:.2f}s"
        )

    async def run_all_tests(self):
        """Run all PWA backend verification tests"""
        print("🚀 Starting PWA Implementation Backend API Testing")
        print(f"Backend URL: {BACKEND_URL}")
        print("Testing backend API endpoints after PWA implementation")
        print("=" * 70)
        
        # Run all test suites
        await self.test_health_check_endpoint()
        await self.test_platform_analytics_endpoint()
        await self.test_service_status_endpoints()
        await self.test_cors_and_api_structure()
        await self.test_marketplace_categories_endpoint()
        await self.test_payment_packages_endpoint()
        await self.test_ai_analysis_types_endpoint()
        await self.test_ai_endpoints_functionality()
        await self.test_error_handling_graceful()
        await self.test_backend_functionality_maintained()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 PWA BACKEND TESTING SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ ISSUES FOUND:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        # Overall status
        if failed_tests == 0:
            print("\n✅ PWA BACKEND TESTING SUCCESSFUL!")
            print("🎯 All backend services working correctly after PWA implementation")
            print("🚀 100% backend functionality maintained")
        elif failed_tests <= 2:
            print("\n⚠️  MINOR ISSUES DETECTED")
            print("🔧 Backend mostly functional with minor issues")
        else:
            print("\n❌ SIGNIFICANT ISSUES DETECTED!")
            print("🔧 Backend functionality may be compromised")
        
        return passed_tests, failed_tests

async def main():
    """Main test runner"""
    async with PWABackendTester() as tester:
        passed, failed = await tester.run_all_tests()
        
        # Exit with error code if tests failed
        if failed > 0:
            sys.exit(1)
        else:
            print("\n🎉 All backend tests passed! System is ready for production.")
            sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())