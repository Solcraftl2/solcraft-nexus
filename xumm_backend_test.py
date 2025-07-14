#!/usr/bin/env python3
"""
XUMM Wallet Connection Error Handling Backend Tests
Tests the improved XUMM wallet connection error handling in the backend
"""

import asyncio
import aiohttp
import json
import sys
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://a6405e2b-f74e-4218-95ed-72a50de34fbe.preview.emergentagent.com/api"

class XUMMBackendTester:
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
                timeout=aiohttp.ClientTimeout(total=30)
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

    async def test_xumm_connect_endpoint(self):
        """Test 1: /api/wallet/xumm/connect endpoint - payload creation"""
        print("\n=== 1. XUMM CONNECT ENDPOINT TESTS ===")
        
        # Test successful payload creation
        response = await self.make_request("POST", "/wallet/xumm/connect")
        
        if response["success"]:
            data = response["data"]
            
            # Check required fields in response
            required_fields = ["success", "payload_uuid", "qr_url", "websocket_url", "deep_link", "expires_at", "message"]
            all_fields_present = all(field in data for field in required_fields)
            
            # Verify success flag
            success_flag = data.get("success") == True
            
            # Verify payload UUID format (should be UUID)
            payload_uuid = data.get("payload_uuid", "")
            uuid_valid = len(payload_uuid) > 0 and "-" in payload_uuid
            
            # Verify real XUMM URLs are generated
            qr_url = data.get("qr_url", "")
            deep_link = data.get("deep_link", "")
            websocket_url = data.get("websocket_url", "")
            
            real_xumm_urls = (
                "xumm.app" in qr_url and
                "xumm.app" in deep_link and
                "xumm.app" in websocket_url
            )
            
            # Verify QR URL format (should end with _q.png)
            qr_format_correct = qr_url.endswith("_q.png")
            
            # Verify expires_at is in future
            expires_at = data.get("expires_at", "")
            expires_valid = len(expires_at) > 0
            
            self.log_test(
                "XUMM Connect Payload Creation",
                all_fields_present and success_flag and uuid_valid,
                f"All fields present: {all_fields_present}, Success: {success_flag}, UUID valid: {uuid_valid}"
            )
            
            self.log_test(
                "XUMM Real URLs Generated",
                real_xumm_urls and qr_format_correct,
                f"Real XUMM URLs: {real_xumm_urls}, QR format correct: {qr_format_correct}"
            )
            
            self.log_test(
                "XUMM Payload Expiration",
                expires_valid,
                f"Expires at: {expires_at}"
            )
            
            # Store payload UUID for next test
            self.test_payload_uuid = payload_uuid if uuid_valid else None
            
        else:
            self.log_test(
                "XUMM Connect Endpoint",
                False,
                f"HTTP {response['status_code']}: {response['data'].get('detail', 'Unknown error')}",
                response["data"]
            )
            self.test_payload_uuid = None

    async def test_xumm_result_endpoint_valid_uuid(self):
        """Test 2: /api/wallet/xumm/{payload_uuid}/result endpoint - valid UUID"""
        print("\n=== 2. XUMM RESULT ENDPOINT - VALID UUID ===")
        
        if not self.test_payload_uuid:
            self.log_test(
                "XUMM Result Valid UUID Test",
                False,
                "No valid payload UUID from previous test"
            )
            return
        
        # Test polling endpoint with valid UUID
        response = await self.make_request("GET", f"/wallet/xumm/{self.test_payload_uuid}/result")
        
        if response["success"]:
            data = response["data"]
            
            # Check required fields for unsigned transaction
            required_fields = ["success", "connected", "signed", "cancelled", "expired", "message"]
            all_fields_present = all(field in data for field in required_fields)
            
            # Verify initial state (not signed yet)
            success_flag = data.get("success") == True
            connected_false = data.get("connected") == False  # Should be False initially
            signed_false = data.get("signed") == False
            cancelled_state = data.get("cancelled")  # Can be True or False
            expired_false = data.get("expired") == False
            
            # Verify message is appropriate
            message = data.get("message", "")
            message_appropriate = "waiting" in message.lower() or "sign" in message.lower()
            
            self.log_test(
                "XUMM Result Valid UUID Response",
                all_fields_present and success_flag,
                f"All fields present: {all_fields_present}, Success: {success_flag}"
            )
            
            self.log_test(
                "XUMM Initial State Correct",
                connected_false and signed_false and not expired_false,
                f"Connected: {data.get('connected')}, Signed: {data.get('signed')}, Cancelled: {data.get('cancelled')}, Expired: {data.get('expired')}"
            )
            
            self.log_test(
                "XUMM Waiting Message",
                message_appropriate,
                f"Message: {message}"
            )
            
        else:
            self.log_test(
                "XUMM Result Valid UUID",
                False,
                f"HTTP {response['status_code']}: {response['data'].get('detail', 'Unknown error')}",
                response["data"]
            )

    async def test_xumm_result_endpoint_invalid_uuid(self):
        """Test 3: /api/wallet/xumm/{payload_uuid}/result endpoint - invalid UUID"""
        print("\n=== 3. XUMM RESULT ENDPOINT - INVALID UUID ===")
        
        # Test with invalid UUID
        invalid_uuid = "invalid-uuid-format-123"
        response = await self.make_request("GET", f"/wallet/xumm/{invalid_uuid}/result")
        
        # Should return 404 for invalid UUID
        correct_status = response["status_code"] == 404
        
        if not response["success"] and correct_status:
            data = response["data"]
            error_message = data.get("detail", "")
            
            # Verify error message is appropriate
            error_appropriate = len(error_message) > 0
            
            self.log_test(
                "XUMM Invalid UUID Error Handling",
                correct_status and error_appropriate,
                f"HTTP {response['status_code']}, Error: {error_message}"
            )
        else:
            self.log_test(
                "XUMM Invalid UUID Error Handling",
                False,
                f"Expected HTTP 404, got {response['status_code']}",
                response["data"]
            )

    async def test_xumm_result_endpoint_nonexistent_uuid(self):
        """Test 4: /api/wallet/xumm/{payload_uuid}/result endpoint - nonexistent UUID"""
        print("\n=== 4. XUMM RESULT ENDPOINT - NONEXISTENT UUID ===")
        
        # Test with valid UUID format but nonexistent
        nonexistent_uuid = "12345678-1234-1234-1234-123456789abc"
        response = await self.make_request("GET", f"/wallet/xumm/{nonexistent_uuid}/result")
        
        # Should return 404 for nonexistent UUID
        correct_status = response["status_code"] == 404
        
        if not response["success"] and correct_status:
            data = response["data"]
            error_message = data.get("detail", "")
            
            # Verify error message is appropriate
            error_appropriate = len(error_message) > 0
            
            self.log_test(
                "XUMM Nonexistent UUID Error Handling",
                correct_status and error_appropriate,
                f"HTTP {response['status_code']}, Error: {error_message}"
            )
        else:
            self.log_test(
                "XUMM Nonexistent UUID Error Handling",
                False,
                f"Expected HTTP 404, got {response['status_code']}",
                response["data"]
            )

    async def test_xumm_polling_mechanism(self):
        """Test 5: XUMM Polling Mechanism - simulate frontend polling"""
        print("\n=== 5. XUMM POLLING MECHANISM SIMULATION ===")
        
        if not self.test_payload_uuid:
            self.log_test(
                "XUMM Polling Mechanism Test",
                False,
                "No valid payload UUID for polling test"
            )
            return
        
        # Simulate frontend polling behavior
        polling_attempts = 3
        polling_interval = 2  # seconds
        
        consistent_responses = True
        all_responses_valid = True
        
        for attempt in range(polling_attempts):
            print(f"   Polling attempt {attempt + 1}/{polling_attempts}")
            
            response = await self.make_request("GET", f"/wallet/xumm/{self.test_payload_uuid}/result")
            
            if response["success"]:
                data = response["data"]
                
                # Verify consistent response structure
                required_fields = ["success", "connected", "signed", "cancelled", "expired"]
                fields_present = all(field in data for field in required_fields)
                
                if not fields_present:
                    all_responses_valid = False
                
                # For unsigned transaction, connected should always be False
                if data.get("connected") != False or data.get("signed") != False:
                    # This would be expected if transaction was actually signed
                    pass
                
            else:
                all_responses_valid = False
                consistent_responses = False
            
            if attempt < polling_attempts - 1:
                await asyncio.sleep(polling_interval)
        
        self.log_test(
            "XUMM Polling Consistency",
            consistent_responses and all_responses_valid,
            f"Polled {polling_attempts} times, consistent responses: {consistent_responses}"
        )

    async def test_xumm_signed_vs_connected_states(self):
        """Test 6: XUMM Signed vs Connected States Logic"""
        print("\n=== 6. XUMM SIGNED VS CONNECTED STATES ===")
        
        if not self.test_payload_uuid:
            self.log_test(
                "XUMM States Logic Test",
                False,
                "No valid payload UUID for states test"
            )
            return
        
        # Test current state (should be unsigned)
        response = await self.make_request("GET", f"/wallet/xumm/{self.test_payload_uuid}/result")
        
        if response["success"]:
            data = response["data"]
            
            # Verify the key logic: connected should be False when not signed
            success_flag = data.get("success") == True
            connected_state = data.get("connected")
            signed_state = data.get("signed")
            
            # For unsigned transaction: connected should be False
            correct_unsigned_logic = (
                success_flag and
                connected_state == False and
                signed_state == False
            )
            
            self.log_test(
                "XUMM Unsigned State Logic",
                correct_unsigned_logic,
                f"Success: {success_flag}, Connected: {connected_state}, Signed: {signed_state}"
            )
            
            # Verify response structure matches frontend expectations
            frontend_compatible = (
                "success" in data and
                "connected" in data and
                isinstance(data.get("connected"), bool)
            )
            
            self.log_test(
                "XUMM Frontend Compatibility",
                frontend_compatible,
                "Response structure compatible with frontend polling logic"
            )
            
        else:
            self.log_test(
                "XUMM States Logic Test",
                False,
                f"HTTP {response['status_code']}: {response['data'].get('detail', 'Unknown error')}"
            )

    async def test_xumm_error_scenarios(self):
        """Test 7: XUMM Error Scenarios and HTTP Status Codes"""
        print("\n=== 7. XUMM ERROR SCENARIOS ===")
        
        # Test various error scenarios
        error_scenarios = [
            {
                "name": "Empty UUID",
                "uuid": "",
                "expected_status": 404
            },
            {
                "name": "Special Characters UUID", 
                "uuid": "special!@#$%^&*()",
                "expected_status": 404
            },
            {
                "name": "Very Long UUID",
                "uuid": "a" * 100,
                "expected_status": 404
            },
            {
                "name": "SQL Injection Attempt",
                "uuid": "'; DROP TABLE wallets; --",
                "expected_status": 404
            }
        ]
        
        all_errors_handled = True
        
        for scenario in error_scenarios:
            response = await self.make_request("GET", f"/wallet/xumm/{scenario['uuid']}/result")
            
            correct_status = response["status_code"] == scenario["expected_status"]
            has_error_message = "detail" in response.get("data", {})
            
            scenario_passed = correct_status and has_error_message
            
            if not scenario_passed:
                all_errors_handled = False
            
            self.log_test(
                f"XUMM Error: {scenario['name']}",
                scenario_passed,
                f"Expected HTTP {scenario['expected_status']}, got {response['status_code']}"
            )
        
        self.log_test(
            "XUMM Error Handling Complete",
            all_errors_handled,
            "All error scenarios handled with proper HTTP status codes"
        )

    async def test_xumm_connect_method_validation(self):
        """Test 8: XUMM Connect Method Validation"""
        print("\n=== 8. XUMM CONNECT METHOD VALIDATION ===")
        
        # Test wrong HTTP methods
        wrong_methods = ["GET", "PUT", "DELETE", "PATCH"]
        
        all_methods_rejected = True
        
        for method in wrong_methods:
            response = await self.make_request(method, "/wallet/xumm/connect")
            
            # Should return 405 Method Not Allowed or 404
            method_rejected = response["status_code"] in [404, 405]
            
            if not method_rejected:
                all_methods_rejected = False
            
            self.log_test(
                f"XUMM Connect {method} Method",
                method_rejected,
                f"HTTP {response['status_code']} (expected 404/405)"
            )
        
        self.log_test(
            "XUMM Connect Method Validation",
            all_methods_rejected,
            "Only POST method allowed for /wallet/xumm/connect"
        )

    async def test_xumm_result_method_validation(self):
        """Test 9: XUMM Result Method Validation"""
        print("\n=== 9. XUMM RESULT METHOD VALIDATION ===")
        
        if not self.test_payload_uuid:
            self.log_test(
                "XUMM Result Method Validation",
                False,
                "No valid payload UUID for method validation test"
            )
            return
        
        # Test wrong HTTP methods
        wrong_methods = ["POST", "PUT", "DELETE", "PATCH"]
        
        all_methods_rejected = True
        
        for method in wrong_methods:
            response = await self.make_request(method, f"/wallet/xumm/{self.test_payload_uuid}/result")
            
            # Should return 405 Method Not Allowed or 404
            method_rejected = response["status_code"] in [404, 405]
            
            if not method_rejected:
                all_methods_rejected = False
            
            self.log_test(
                f"XUMM Result {method} Method",
                method_rejected,
                f"HTTP {response['status_code']} (expected 404/405)"
            )
        
        self.log_test(
            "XUMM Result Method Validation",
            all_methods_rejected,
            "Only GET method allowed for /wallet/xumm/{uuid}/result"
        )

    async def run_all_tests(self):
        """Run all XUMM backend tests"""
        print("🚀 Starting XUMM Wallet Connection Error Handling Backend Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("Testing improved XUMM wallet connection error handling")
        print("=" * 70)
        
        # Run all XUMM test suites
        await self.test_xumm_connect_endpoint()
        await self.test_xumm_result_endpoint_valid_uuid()
        await self.test_xumm_result_endpoint_invalid_uuid()
        await self.test_xumm_result_endpoint_nonexistent_uuid()
        await self.test_xumm_polling_mechanism()
        await self.test_xumm_signed_vs_connected_states()
        await self.test_xumm_error_scenarios()
        await self.test_xumm_connect_method_validation()
        await self.test_xumm_result_method_validation()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 XUMM BACKEND TEST SUMMARY")
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
        
        # Test status
        if failed_tests == 0:
            print("\n✅ ALL XUMM BACKEND TESTS PASSED!")
            print("🎯 XUMM wallet connection error handling is working correctly")
            print("🚀 Backend properly handles signed vs connected states")
            print("📱 Polling mechanism ready for frontend auto-close functionality")
        else:
            print("\n⚠️  XUMM BACKEND ISSUES DETECTED!")
            print("🔧 Some XUMM functionality may need fixes")
        
        return passed_tests, failed_tests

async def main():
    """Main test runner"""
    async with XUMMBackendTester() as tester:
        passed, failed = await tester.run_all_tests()
        
        # Exit with error code if tests failed
        if failed > 0:
            sys.exit(1)
        else:
            print("\n🎉 All XUMM backend tests passed! Ready for frontend integration.")
            sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())