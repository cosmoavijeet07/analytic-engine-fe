#!/usr/bin/env python3
"""
Blue Sherpa Analytics Engine - API Diagnostic Script
Tests all endpoints for JSON serialization and CORS issues
Logs all errors and results to files
"""

import requests
import json
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000/api"
TEST_USER_EMAIL = "test@bluesherpa.com"
TEST_USER_PASSWORD = "testpassword123"

# Logging Configuration
LOG_DIR = "api_diagnostic_logs"
ERROR_LOG_FILE = "error_log.txt"
RESULTS_LOG_FILE = "test_results.txt"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.session_id = None
        self.setup_logging()
        
    def setup_logging(self):
        """Create logging directory and files"""
        if not os.path.exists(LOG_DIR):
            os.makedirs(LOG_DIR)
            print(f"📁 Created logging directory: {LOG_DIR}")
        
        self.error_log_path = os.path.join(LOG_DIR, ERROR_LOG_FILE)
        self.results_log_path = os.path.join(LOG_DIR, RESULTS_LOG_FILE)
        
        # Initialize log files with headers
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        with open(self.error_log_path, 'w') as f:
            f.write(f"Blue Sherpa API Diagnostic - Error Log\n")
            f.write(f"Started: {timestamp}\n")
            f.write("=" * 60 + "\n\n")
        
        with open(self.results_log_path, 'w') as f:
            f.write(f"Blue Sherpa API Diagnostic - Test Results Log\n")
            f.write(f"Started: {timestamp}\n")
            f.write("=" * 60 + "\n\n")
    
    def log_error(self, test_name, error_details, exception=None):
        """Log error to error log file"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        with open(self.error_log_path, 'a') as f:
            f.write(f"[{timestamp}] ERROR in {test_name}\n")
            f.write(f"Details: {error_details}\n")
            if exception:
                f.write(f"Exception: {str(exception)}\n")
                f.write(f"Exception Type: {type(exception).__name__}\n")
            f.write("-" * 40 + "\n")
    
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result to results file"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        with open(self.results_log_path, 'a') as f:
            status = "PASS" if success else "FAIL"
            f.write(f"[{timestamp}] {status} - {test_name}\n")
            f.write(f"Details: {details}\n")
            if response_data:
                f.write(f"Response Data: {json.dumps(response_data, indent=2)}\n")
            f.write("-" * 40 + "\n")
        
    def log_test(self, test_name, success, details="", response_data=None, exception=None):
        """Enhanced logging for both console and files"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
        # Log to results file
        self.log_result(test_name, success, details, response_data)
        
        # Log errors to error file if test failed
        if not success:
            self.log_error(test_name, details, exception)
    
    def test_health_check(self):
        """Test basic health check endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/../api/health")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check", True, 
                            f"Status: {data.get('status')}", 
                            response_data=data)
                return True
            else:
                self.log_test("Health Check", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Health Check", False, 
                        f"Request Exception: {str(e)}", exception=e)
            return False
        except json.JSONDecodeError as e:
            self.log_test("Health Check", False, 
                        f"JSON Decode Error: {str(e)}", exception=e)
            return False
        except Exception as e:
            self.log_test("Health Check", False, 
                        f"Unexpected Exception: {str(e)}", exception=e)
            return False
    
    def test_cors_preflight(self):
        """Test CORS preflight request"""
        try:
            headers = {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            response = self.session.options(f"{BASE_URL}/auth/login", headers=headers)
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }
            
            if response.status_code in [200, 204] and cors_headers['Access-Control-Allow-Origin']:
                self.log_test("CORS Preflight", True, 
                            f"CORS headers present", 
                            response_data=cors_headers)
                return True
            else:
                self.log_test("CORS Preflight", False, 
                            f"HTTP {response.status_code}, missing CORS headers. Headers: {cors_headers}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("CORS Preflight", False, 
                        f"Request Exception: {str(e)}", exception=e)
            return False
        except Exception as e:
            self.log_test("CORS Preflight", False, 
                        f"Unexpected Exception: {str(e)}", exception=e)
            return False
    
    def test_login(self):
        """Test login endpoint - THIS WAS THE MAIN BUG"""
        try:
            payload = {
                'email': TEST_USER_EMAIL,
                'password': TEST_USER_PASSWORD
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", 
                                       json=payload,
                                       headers={'Origin': 'http://localhost:3000'})
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get('success') and data.get('data', {}).get('user'):
                        self.log_test("Login Endpoint", True, 
                                    f"User: {data['data']['user']['name']}", 
                                    response_data=data)
                        return True
                    else:
                        self.log_test("Login Endpoint", False, 
                                    f"Invalid response structure: {data}")
                        return False
                        
                except json.JSONDecodeError as e:
                    self.log_test("Login Endpoint", False, 
                                f"JSON decode error: {str(e)}. Raw response: {response.text}", 
                                exception=e)
                    return False
            else:
                self.log_test("Login Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Login Endpoint", False, 
                        f"Request Exception: {str(e)}", exception=e)
            return False
        except Exception as e:
            self.log_test("Login Endpoint", False, 
                        f"Unexpected Exception: {str(e)}", exception=e)
            return False
    
    def test_sessions_list(self):
        """Test sessions list endpoint - REPORTED BUG LOCATION"""
        try:
            response = self.session.get(f"{BASE_URL}/sessions/list",
                                      headers={'Origin': 'http://localhost:3000'})
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get('success') and 'sessions' in data.get('data', {}):
                        sessions_count = len(data['data']['sessions'])
                        self.log_test("Sessions List", True, 
                                    f"Retrieved {sessions_count} sessions", 
                                    response_data=data)
                        return True
                    else:
                        self.log_test("Sessions List", False, 
                                    f"Invalid response structure: {data}")
                        return False
                        
                except json.JSONDecodeError as e:
                    self.log_test("Sessions List", False, 
                                f"JSON decode error: {str(e)}. Raw response: {response.text}", 
                                exception=e)
                    return False
            else:
                self.log_test("Sessions List", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Sessions List", False, 
                        f"Request Exception: {str(e)}", exception=e)
            return False
        except Exception as e:
            self.log_test("Sessions List", False, 
                        f"Unexpected Exception: {str(e)}", exception=e)
            return False
    
    def test_session_create(self):
        """Test session creation endpoint"""
        try:
            payload = {
                'title': 'Test Analytics Session',
                'domain': 'Finance'
            }
            
            response = self.session.post(f"{BASE_URL}/sessions/create", 
                                       json=payload,
                                       headers={'Origin': 'http://localhost:3000'})
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get('success') and data.get('data', {}).get('session'):
                        session_data = data['data']['session']
                        self.session_id = session_data['id']
                        self.log_test("Session Create", True, 
                                    f"Created session: {session_data['id']}", 
                                    response_data=data)
                        return True
                    else:
                        self.log_test("Session Create", False, 
                                    f"Invalid response structure: {data}")
                        return False
                        
                except json.JSONDecodeError as e:
                    self.log_test("Session Create", False, 
                                f"JSON decode error: {str(e)}. Raw response: {response.text}", 
                                exception=e)
                    return False
            else:
                self.log_test("Session Create", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Session Create", False, 
                        f"Request Exception: {str(e)}", exception=e)
            return False
        except Exception as e:
            self.log_test("Session Create", False, 
                        f"Unexpected Exception: {str(e)}", exception=e)
            return False
    
    def test_domains_endpoint(self):
        """Test domains configuration endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/config/domains",
                                      headers={'Origin': 'http://localhost:3000'})
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get('success') and 'domains' in data.get('data', {}):
                        domains_count = len(data['data']['domains'])
                        self.log_test("Domains Config", True, 
                                    f"Retrieved {domains_count} domains", 
                                    response_data=data)
                        return True
                    else:
                        self.log_test("Domains Config", False, 
                                    f"Invalid response structure: {data}")
                        return False
                        
                except json.JSONDecodeError as e:
                    self.log_test("Domains Config", False, 
                                f"JSON decode error: {str(e)}. Raw response: {response.text}", 
                                exception=e)
                    return False
            else:
                self.log_test("Domains Config", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Domains Config", False, 
                        f"Request Exception: {str(e)}", exception=e)
            return False
        except Exception as e:
            self.log_test("Domains Config", False, 
                        f"Unexpected Exception: {str(e)}", exception=e)
            return False
    
    def test_response_serialization(self):
        """Test that all responses are properly JSON serializable"""
        endpoints_to_test = [
            ("GET", "/config/models"),
            ("GET", "/auth/profile"),
        ]
        
        all_passed = True
        for method, endpoint in endpoints_to_test:
            try:
                if method == "GET":
                    response = self.session.get(f"{BASE_URL}{endpoint}",
                                              headers={'Origin': 'http://localhost:3000'})
                
                # Check if response is valid JSON
                try:
                    data = response.json()
                    self.log_test(f"JSON Serialization {endpoint}", True, 
                                f"Valid JSON response", 
                                response_data=data)
                except json.JSONDecodeError as e:
                    self.log_test(f"JSON Serialization {endpoint}", False, 
                                f"Invalid JSON response. Raw: {response.text}", 
                                exception=e)
                    all_passed = False
                    
            except requests.exceptions.RequestException as e:
                self.log_test(f"JSON Serialization {endpoint}", False, 
                            f"Request Exception: {str(e)}", exception=e)
                all_passed = False
            except Exception as e:
                self.log_test(f"JSON Serialization {endpoint}", False, 
                            f"Unexpected Exception: {str(e)}", exception=e)
                all_passed = False
        
        return all_passed
    
    def write_final_summary(self):
        """Write final summary to log files"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        summary = f"""
{timestamp} - TEST EXECUTION COMPLETED
Total Tests: {total}
Passed: {passed}
Failed: {total - passed}
Success Rate: {(passed/total)*100:.1f}%

DETAILED RESULTS:
"""
        
        for result in self.test_results:
            status = "PASS" if result['success'] else "FAIL"
            summary += f"{status} - {result['test']}: {result['details']}\n"
        
        # Write to both log files
        with open(self.results_log_path, 'a') as f:
            f.write("\n" + "=" * 60 + "\n")
            f.write("FINAL SUMMARY")
            f.write(summary)
        
        # Write summary to error log if there were failures
        if passed < total:
            with open(self.error_log_path, 'a') as f:
                f.write("\n" + "=" * 60 + "\n")
                f.write("FINAL SUMMARY - FAILURES DETECTED")
                f.write(summary)
    
    def run_all_tests(self):
        """Run the complete test suite"""
        print("🚀 Starting Blue Sherpa Analytics API Diagnostic Tests")
        print(f"📁 Logging to directory: {LOG_DIR}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_health_check,
            self.test_cors_preflight,
            self.test_login,  # This was the main bug
            self.test_sessions_list,  # This was the reported bug
            self.test_session_create,
            self.test_domains_endpoint,
            self.test_response_serialization,
        ]
        
        for test in tests:
            test()
            time.sleep(0.5)  # Small delay between tests
        
        # Write final summary to log files
        self.write_final_summary()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! The API is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Review the failures above.")
        
        # File locations
        print(f"\n📄 LOG FILES:")
        print(f"   Error Log: {self.error_log_path}")
        print(f"   Results Log: {self.results_log_path}")
        
        # Detailed results
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['details']}")

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()