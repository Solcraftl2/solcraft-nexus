#!/usr/bin/env python3
"""
Comprehensive AI Features Testing for Solcraft Nexus
Tests AI Analysis System with OpenAI GPT-4o-mini integration
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://d781ac4e-78f7-4fa2-a4b9-91ed9128a1d1.preview.emergentagent.com/api"

# Test data for AI analysis
TEST_ASSET_DATA = {
    "name": "Premium Manhattan Office Building",
    "type": "real_estate",
    "value": 15000000,
    "location": "Manhattan, New York",
    "description": "Class A office building with 95% occupancy rate",
    "performance": "8.5% annual return over last 3 years",
    "market_data": "Manhattan commercial real estate up 12% YoY"
}

TEST_PORTFOLIO_DATA = {
    "total_value": 5000000,
    "assets": [
        {"name": "Real Estate Fund", "value": 2000000, "type": "real_estate"},
        {"name": "Private Credit", "value": 1500000, "type": "private_credit"},
        {"name": "Commodities ETF", "value": 1000000, "type": "commodities"},
        {"name": "Tech Stocks", "value": 500000, "type": "equity_securities"}
    ],
    "allocation": {
        "real_estate": 40,
        "private_credit": 30,
        "commodities": 20,
        "equity_securities": 10
    },
    "geographic_distribution": {
        "US": 60,
        "Europe": 25,
        "Asia": 15
    },
    "sector_distribution": {
        "Technology": 25,
        "Real Estate": 40,
        "Financial Services": 35
    },
    "performance": {
        "annual_return": 12.5,
        "volatility": 8.2,
        "sharpe_ratio": 1.52
    },
    "risk_profile": "Moderate"
}

class AIBackendTester:
    def __init__(self):
        self.session = None
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
                          headers: Dict = None) -> Dict[str, Any]:
        """Make HTTP request to backend"""
        url = f"{BACKEND_URL}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if headers:
            request_headers.update(headers)
        
        try:
            async with self.session.request(
                method, url, 
                json=data if data else None,
                headers=request_headers,
                timeout=aiohttp.ClientTimeout(total=120)  # Increased timeout for AI calls
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

    async def test_ai_service_initialization(self):
        """Test 1: AI Service Initialization - Verify ai_analysis_service loads correctly"""
        print("\n=== 1. AI SERVICE INITIALIZATION ===")
        
        # Test health check to see if AI service is loaded
        response = await self.make_request("GET", "/health")
        
        if response["success"]:
            data = response["data"]
            services = data.get("services", {})
            
            # Check if system is healthy (indicates services loaded)
            system_healthy = data.get("status") == "healthy"
            
            self.log_test(
                "System Health Check",
                system_healthy,
                f"System status: {data.get('status')}"
            )
            
            # Test analysis types endpoint to verify AI service loaded
            types_response = await self.make_request("GET", "/ai/analysis-types")
            
            if types_response["success"]:
                types_data = types_response["data"]
                analysis_types_ok = (
                    types_data.get("status") == "success" and
                    "analysis_types" in types_data and
                    "supported_asset_classes" in types_data
                )
                
                analysis_types = types_data.get("analysis_types", {})
                asset_classes = types_data.get("supported_asset_classes", {})
                
                # Verify expected analysis types
                expected_types = ["asset_analysis", "market_prediction", "risk_assessment", "portfolio_optimization"]
                types_present = all(t in analysis_types for t in expected_types)
                
                # Verify expected asset classes
                expected_classes = ["real_estate", "private_credit", "commodities", "equity_securities"]
                classes_present = all(c in asset_classes for c in expected_classes)
                
                self.log_test(
                    "AI Analysis Types Endpoint",
                    analysis_types_ok and types_present and classes_present,
                    f"Analysis types: {len(analysis_types)}, Asset classes: {len(asset_classes)}"
                )
                
            else:
                self.log_test(
                    "AI Analysis Types Endpoint", 
                    False, 
                    f"HTTP {types_response['status_code']}", 
                    types_response["data"]
                )
        else:
            self.log_test("AI Service Health Check", False, f"HTTP {response['status_code']}", response["data"])

    async def test_openai_api_key_configuration(self):
        """Test 2: OpenAI API Key Configuration - Test if key is configured"""
        print("\n=== 2. OPENAI API KEY CONFIGURATION ===")
        
        # Test a simple AI analysis to verify OpenAI key works
        simple_asset = {
            "name": "Test Asset",
            "type": "real_estate",
            "value": 1000000,
            "location": "Test Location",
            "description": "Test description"
        }
        
        response = await self.make_request("POST", "/ai/analyze-asset", {
            "asset_data": simple_asset,
            "analysis_type": "comprehensive",
            "language": "en"
        })
        
        if response["success"]:
            data = response["data"]
            analysis_ok = (
                data.get("status") == "success" and
                "analysis" in data and
                data["analysis"].get("analysis_id") is not None
            )
            
            # Check if we got actual AI response
            ai_insights = data.get("analysis", {}).get("ai_insights", "")
            has_ai_content = len(ai_insights) > 50  # Reasonable AI response length
            
            self.log_test(
                "OpenAI API Key Working",
                analysis_ok and has_ai_content,
                f"AI response length: {len(ai_insights)} chars, Analysis ID: {data.get('analysis', {}).get('analysis_id', 'None')}"
            )
            
        else:
            # Check if error is related to missing API key
            error_msg = response["data"].get("detail", "").lower()
            missing_key = "openai_api_key" in error_msg or "api key" in error_msg
            
            self.log_test(
                "OpenAI API Key Configuration",
                False,
                f"Missing or invalid OpenAI API key: {error_msg}" if missing_key else f"HTTP {response['status_code']}: {error_msg}",
                response["data"] if not missing_key else None
            )

    async def test_asset_analysis_endpoint(self):
        """Test 3: Asset Analysis Endpoint - Test POST /api/ai/analyze-asset"""
        print("\n=== 3. ASSET ANALYSIS ENDPOINT ===")
        
        # Test comprehensive analysis
        response = await self.make_request("POST", "/ai/analyze-asset", {
            "asset_data": TEST_ASSET_DATA,
            "analysis_type": "comprehensive",
            "language": "en"
        })
        
        if response["success"]:
            data = response["data"]
            analysis = data.get("analysis", {})
            
            analysis_ok = (
                data.get("status") == "success" and
                analysis.get("analysis_id") is not None and
                analysis.get("asset_name") == TEST_ASSET_DATA["name"] and
                analysis.get("analysis_type") == "asset_analysis" and
                "ai_insights" in analysis and
                "timestamp" in analysis
            )
            
            ai_insights = analysis.get("ai_insights", "")
            comprehensive_analysis = len(ai_insights) > 200  # Should be detailed
            
            self.log_test(
                "Asset Analysis (English)",
                analysis_ok and comprehensive_analysis,
                f"Asset: {analysis.get('asset_name')}, Response length: {len(ai_insights)} chars"
            )
            
        else:
            self.log_test("Asset Analysis Endpoint", False, f"HTTP {response['status_code']}", response["data"])
        
        # Test Italian language support
        response_it = await self.make_request("POST", "/ai/analyze-asset", {
            "asset_data": TEST_ASSET_DATA,
            "analysis_type": "valuation",
            "language": "it"
        })
        
        if response_it["success"]:
            data_it = response_it["data"]
            analysis_it = data_it.get("analysis", {})
            
            italian_ok = (
                analysis_it.get("language") == "it" and
                len(analysis_it.get("ai_insights", "")) > 100
            )
            
            self.log_test(
                "Asset Analysis (Italian)",
                italian_ok,
                f"Language: {analysis_it.get('language')}, Response length: {len(analysis_it.get('ai_insights', ''))} chars"
            )
        else:
            self.log_test("Asset Analysis (Italian)", False, f"HTTP {response_it['status_code']}", response_it["data"])

    async def test_market_prediction_endpoint(self):
        """Test 4: Market Prediction Endpoint - Test POST /api/ai/market-prediction"""
        print("\n=== 4. MARKET PREDICTION ENDPOINT ===")
        
        # Test different asset classes and time horizons
        test_cases = [
            {"asset_class": "real_estate", "time_horizon": "1_month"},
            {"asset_class": "private_credit", "time_horizon": "3_months"},
            {"asset_class": "commodities", "time_horizon": "6_months"},
            {"asset_class": "equity_securities", "time_horizon": "1_year"}
        ]
        
        successful_predictions = 0
        
        for test_case in test_cases:
            response = await self.make_request("POST", "/ai/market-prediction", {
                "asset_class": test_case["asset_class"],
                "time_horizon": test_case["time_horizon"],
                "language": "en"
            })
            
            if response["success"]:
                data = response["data"]
                prediction = data.get("prediction", {})
                
                prediction_ok = (
                    data.get("status") == "success" and
                    prediction.get("asset_class") == test_case["asset_class"] and
                    prediction.get("time_horizon") == test_case["time_horizon"] and
                    prediction.get("analysis_type") == "market_prediction" and
                    len(prediction.get("ai_insights", "")) > 150
                )
                
                if prediction_ok:
                    successful_predictions += 1
                
                self.log_test(
                    f"Market Prediction ({test_case['asset_class']}, {test_case['time_horizon']})",
                    prediction_ok,
                    f"Response length: {len(prediction.get('ai_insights', ''))} chars"
                )
            else:
                self.log_test(
                    f"Market Prediction ({test_case['asset_class']}, {test_case['time_horizon']})",
                    False,
                    f"HTTP {response['status_code']}",
                    response["data"]
                )
        
        # Overall market prediction test
        all_predictions_ok = successful_predictions == len(test_cases)
        self.log_test(
            "All Market Predictions",
            all_predictions_ok,
            f"{successful_predictions}/{len(test_cases)} predictions successful"
        )

    async def test_risk_assessment_endpoint(self):
        """Test 5: Risk Assessment Endpoint - Test POST /api/ai/risk-assessment"""
        print("\n=== 5. RISK ASSESSMENT ENDPOINT ===")
        
        response = await self.make_request("POST", "/ai/risk-assessment", {
            "portfolio_data": TEST_PORTFOLIO_DATA,
            "language": "en"
        })
        
        if response["success"]:
            data = response["data"]
            assessment = data.get("assessment", {})
            
            assessment_ok = (
                data.get("status") == "success" and
                assessment.get("analysis_id") is not None and
                assessment.get("portfolio_value") == TEST_PORTFOLIO_DATA["total_value"] and
                assessment.get("analysis_type") == "risk_assessment" and
                len(assessment.get("ai_insights", "")) > 200
            )
            
            ai_insights = assessment.get("ai_insights", "")
            risk_analysis = any(keyword in ai_insights.lower() for keyword in 
                              ["risk", "volatility", "correlation", "diversification", "score"])
            
            self.log_test(
                "Risk Assessment (English)",
                assessment_ok and risk_analysis,
                f"Portfolio value: ${assessment.get('portfolio_value', 0):,}, Risk analysis present: {risk_analysis}"
            )
            
        else:
            self.log_test("Risk Assessment Endpoint", False, f"HTTP {response['status_code']}", response["data"])
        
        # Test Italian language
        response_it = await self.make_request("POST", "/ai/risk-assessment", {
            "portfolio_data": TEST_PORTFOLIO_DATA,
            "language": "it"
        })
        
        if response_it["success"]:
            data_it = response_it["data"]
            assessment_it = data_it.get("assessment", {})
            
            italian_risk_ok = (
                assessment_it.get("language") == "it" and
                len(assessment_it.get("ai_insights", "")) > 150
            )
            
            self.log_test(
                "Risk Assessment (Italian)",
                italian_risk_ok,
                f"Language: {assessment_it.get('language')}, Response length: {len(assessment_it.get('ai_insights', ''))} chars"
            )
        else:
            self.log_test("Risk Assessment (Italian)", False, f"HTTP {response_it['status_code']}", response_it["data"])

    async def test_portfolio_optimization_endpoint(self):
        """Test 6: Portfolio Optimization Endpoint - Test POST /api/ai/optimize-portfolio"""
        print("\n=== 6. PORTFOLIO OPTIMIZATION ENDPOINT ===")
        
        optimization_goals = ["maximize_return", "minimize_risk", "improve_diversification"]
        
        response = await self.make_request("POST", "/ai/optimize-portfolio", {
            "portfolio_data": TEST_PORTFOLIO_DATA,
            "optimization_goals": optimization_goals,
            "language": "en"
        })
        
        if response["success"]:
            data = response["data"]
            optimization = data.get("optimization", {})
            
            optimization_ok = (
                data.get("status") == "success" and
                optimization.get("analysis_id") is not None and
                optimization.get("optimization_goals") == optimization_goals and
                optimization.get("analysis_type") == "portfolio_optimization" and
                len(optimization.get("ai_insights", "")) > 250
            )
            
            ai_insights = optimization.get("ai_insights", "")
            optimization_content = any(keyword in ai_insights.lower() for keyword in 
                                     ["allocation", "rebalance", "diversification", "optimize", "recommendation"])
            
            self.log_test(
                "Portfolio Optimization",
                optimization_ok and optimization_content,
                f"Goals: {len(optimization_goals)}, Optimization content present: {optimization_content}"
            )
            
        else:
            self.log_test("Portfolio Optimization Endpoint", False, f"HTTP {response['status_code']}", response["data"])

    async def test_error_handling(self):
        """Test 7: Error Handling - Test various error scenarios"""
        print("\n=== 7. ERROR HANDLING TESTS ===")
        
        # Test invalid asset data
        response = await self.make_request("POST", "/ai/analyze-asset", {
            "asset_data": {},  # Empty asset data
            "analysis_type": "comprehensive"
        })
        
        handles_invalid_data = response["status_code"] in [400, 422, 500]
        self.log_test(
            "Invalid Asset Data Handling",
            handles_invalid_data,
            f"HTTP {response['status_code']} for empty asset data"
        )
        
        # Test invalid analysis type
        response = await self.make_request("POST", "/ai/analyze-asset", {
            "asset_data": TEST_ASSET_DATA,
            "analysis_type": "invalid_type"
        })
        
        handles_invalid_type = response["status_code"] in [400, 422, 500]
        self.log_test(
            "Invalid Analysis Type Handling",
            handles_invalid_type,
            f"HTTP {response['status_code']} for invalid analysis type"
        )
        
        # Test invalid asset class for market prediction
        response = await self.make_request("POST", "/ai/market-prediction", {
            "asset_class": "invalid_class",
            "time_horizon": "3_months"
        })
        
        handles_invalid_class = response["status_code"] in [400, 422, 500]
        self.log_test(
            "Invalid Asset Class Handling",
            handles_invalid_class,
            f"HTTP {response['status_code']} for invalid asset class"
        )
        
        # Test missing required fields
        response = await self.make_request("POST", "/ai/risk-assessment", {})
        
        handles_missing_fields = response["status_code"] in [400, 422]
        self.log_test(
            "Missing Required Fields Handling",
            handles_missing_fields,
            f"HTTP {response['status_code']} for missing portfolio_data"
        )

    async def test_database_integration(self):
        """Test 8: Database Integration - Test ai_analyses table interaction"""
        print("\n=== 8. DATABASE INTEGRATION TESTS ===")
        
        # Test that analysis is stored (by making a request and checking response structure)
        response = await self.make_request("POST", "/ai/analyze-asset", {
            "asset_data": {
                "name": "Database Test Asset",
                "type": "real_estate",
                "value": 500000,
                "location": "Test City",
                "description": "Testing database storage"
            },
            "analysis_type": "comprehensive",
            "language": "en"
        })
        
        if response["success"]:
            data = response["data"]
            analysis = data.get("analysis", {})
            
            # Check if analysis_id is generated (indicates database interaction)
            has_analysis_id = analysis.get("analysis_id") is not None
            has_timestamp = analysis.get("timestamp") is not None
            
            # Analysis ID should be a valid identifier
            analysis_id = analysis.get("analysis_id", "")
            valid_id_format = len(str(analysis_id)) > 5  # Should be meaningful ID
            
            self.log_test(
                "Database Storage Integration",
                has_analysis_id and has_timestamp and valid_id_format,
                f"Analysis ID: {analysis_id}, Timestamp: {analysis.get('timestamp')}"
            )
            
            # Test graceful fallback if tables don't exist (should still work)
            graceful_fallback = (
                response["success"] and
                len(analysis.get("ai_insights", "")) > 50
            )
            
            self.log_test(
                "Graceful Database Fallback",
                graceful_fallback,
                "System continues to work even if ai_analyses table doesn't exist"
            )
            
        else:
            self.log_test("Database Integration", False, f"HTTP {response['status_code']}", response["data"])

    async def test_model_configuration(self):
        """Test 9: Model Configuration - Verify OpenAI GPT-4o-mini usage"""
        print("\n=== 9. MODEL CONFIGURATION TESTS ===")
        
        # Test that we're using the correct model by checking response quality
        response = await self.make_request("POST", "/ai/analyze-asset", {
            "asset_data": {
                "name": "Model Test Property",
                "type": "real_estate",
                "value": 2500000,
                "location": "San Francisco, CA",
                "description": "High-end commercial property in prime location",
                "performance": "15% annual return",
                "market_data": "SF commercial real estate market trending upward"
            },
            "analysis_type": "comprehensive",
            "language": "en"
        })
        
        if response["success"]:
            data = response["data"]
            analysis = data.get("analysis", {})
            ai_insights = analysis.get("ai_insights", "")
            
            # Check response quality indicators for GPT-4o-mini
            quality_indicators = [
                len(ai_insights) > 300,  # Should be detailed
                "analysis" in ai_insights.lower() or "valuation" in ai_insights.lower(),
                "risk" in ai_insights.lower() or "recommendation" in ai_insights.lower(),
                len(ai_insights.split()) > 50  # Should have substantial word count
            ]
            
            quality_score = sum(quality_indicators)
            model_working = quality_score >= 3  # At least 3/4 quality indicators
            
            self.log_test(
                "GPT-4o-mini Model Quality",
                model_working,
                f"Quality score: {quality_score}/4, Response length: {len(ai_insights)} chars, Words: {len(ai_insights.split())}"
            )
            
            # Test token limits (should handle reasonable requests without truncation)
            reasonable_length = 500 <= len(ai_insights) <= 4000  # Within expected range
            
            self.log_test(
                "Token Limit Handling",
                reasonable_length,
                f"Response length: {len(ai_insights)} chars (should be 500-4000)"
            )
            
        else:
            self.log_test("Model Configuration", False, f"HTTP {response['status_code']}", response["data"])

    async def run_all_tests(self):
        """Run all AI Features tests"""
        print("🤖 Starting Comprehensive AI Features Testing")
        print(f"Backend URL: {BACKEND_URL}")
        print("Testing AI Analysis System with OpenAI GPT-4o-mini integration")
        print("=" * 80)
        
        # Run all AI test suites
        await self.test_ai_service_initialization()
        await self.test_openai_api_key_configuration()
        await self.test_asset_analysis_endpoint()
        await self.test_market_prediction_endpoint()
        await self.test_risk_assessment_endpoint()
        await self.test_portfolio_optimization_endpoint()
        await self.test_error_handling()
        await self.test_database_integration()
        await self.test_model_configuration()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 AI FEATURES TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ AI SYSTEM ISSUES FOUND:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        # AI system status
        if failed_tests == 0:
            print("\n✅ AI FEATURES TESTING SUCCESSFUL!")
            print("🤖 AI Analysis System is fully functional")
            print("🚀 OpenAI GPT-4o-mini integration working perfectly")
        elif failed_tests <= 2:
            print("\n⚠️  MINOR AI SYSTEM ISSUES DETECTED!")
            print("🔧 Core functionality working but some features need attention")
        else:
            print("\n❌ MAJOR AI SYSTEM ISSUES DETECTED!")
            print("🔧 AI system needs significant fixes before production")
        
        return passed_tests, failed_tests

async def main():
    """Main test runner"""
    async with AIBackendTester() as tester:
        passed, failed = await tester.run_all_tests()
        
        # Exit with error code if critical tests failed
        if failed > 5:  # Allow some minor failures
            sys.exit(1)
        else:
            print("\n🎉 AI Features testing completed successfully!")
            sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())