#!/bin/bash

# Get your localhost URL - adjust port if needed
BASE_URL="http://localhost:3000"

echo "===================================================="
echo "PRODUCT SEARCH API TEST SCRIPT"
echo "===================================================="
echo "Before running this test:"
echo "1. Make sure your server is running locally"
echo "2. You can optionally log in for authenticated tests"
echo "3. This endpoint now works with or without authentication"
echo "4. You can also specify a merchantId in the query parameters"
echo "===================================================="
echo ""

# Ask for a merchant ID to test with
echo "Please enter a valid merchant ID to test specific merchant searches (or press Enter to skip):"
read -p "Merchant ID: " TEST_MERCHANT_ID

# First run tests without authentication
echo -e "\n\nRUNNING UNAUTHENTICATED TESTS"
echo "===================================================="

echo -e "\n\nTEST 1: Product search endpoint with valid query (unauthenticated)"
echo "Request: GET $BASE_URL/api/product/search?query=shirt"
curl -s -X GET "$BASE_URL/api/product/search?query=shirt" | jq .

echo -e "\n\nTEST 2: Product search with a query that might match an out-of-stock product (unauthenticated)"
echo "Request: GET $BASE_URL/api/product/search?query=jacket" 
curl -s -X GET "$BASE_URL/api/product/search?query=jacket" | jq .

echo -e "\n\nTEST 3: Product search with a non-existent product (unauthenticated)"
echo "Request: GET $BASE_URL/api/product/search?query=nonexistentproduct123"
curl -s -X GET "$BASE_URL/api/product/search?query=nonexistentproduct123" | jq .

echo -e "\n\nTEST 4: Product search with no query parameter (unauthenticated)"
echo "Request: GET $BASE_URL/api/product/search"
curl -s -X GET "$BASE_URL/api/product/search" | jq .

# Run tests with merchantId if provided
if [ -n "$TEST_MERCHANT_ID" ]; then
  echo -e "\n\n===================================================="
  echo "RUNNING TESTS WITH MERCHANT ID: $TEST_MERCHANT_ID"
  echo "===================================================="

  echo -e "\n\nTEST 5: Product search with specific merchant ID"
  echo "Request: GET $BASE_URL/api/product/search?query=shirt&merchantId=$TEST_MERCHANT_ID"
  curl -s -X GET "$BASE_URL/api/product/search?query=shirt&merchantId=$TEST_MERCHANT_ID" | jq .

  echo -e "\n\nTEST 6: Product search for out-of-stock with specific merchant ID"
  echo "Request: GET $BASE_URL/api/product/search?query=jacket&merchantId=$TEST_MERCHANT_ID"
  curl -s -X GET "$BASE_URL/api/product/search?query=jacket&merchantId=$TEST_MERCHANT_ID" | jq .
  
  echo -e "\n\nTEST 7: Product search with invalid query but valid merchant ID"
  echo "Request: GET $BASE_URL/api/product/search?query=nonexistentproduct123&merchantId=$TEST_MERCHANT_ID"
  curl -s -X GET "$BASE_URL/api/product/search?query=nonexistentproduct123&merchantId=$TEST_MERCHANT_ID" | jq .
else
  echo -e "\n\nSkipping merchantId-specific tests."
fi

# Then run authenticated tests if a cookie is provided
echo -e "\n\n===================================================="
echo "RUNNING AUTHENTICATED TESTS (OPTIONAL)"
echo "If you want to skip these tests, just press Enter without entering a cookie value"
echo "===================================================="
echo ""
echo "Please enter your .auth.session-token cookie value (or press Enter to skip):"
read -p "Cookie value: " COOKIE_VALUE

if [ -n "$COOKIE_VALUE" ]; then
  # Debug info
  echo -e "\n\nUsing cookie value: ${COOKIE_VALUE:0:10}..."
  echo "Base URL: $BASE_URL"
  echo "Testing endpoint: $BASE_URL/api/product/search"
  echo "===================================================="

  echo -e "\n\nTEST 8: Product search endpoint with valid query (authenticated)"
  echo "Request: GET $BASE_URL/api/product/search?query=shirt"
  curl -s -X GET "$BASE_URL/api/product/search?query=shirt" \
    -H "Cookie: .auth.session-token=$COOKIE_VALUE" | jq .

  echo -e "\n\nTEST 9: Product search with a query that might match an out-of-stock product (authenticated)"
  echo "Request: GET $BASE_URL/api/product/search?query=jacket" 
  curl -s -X GET "$BASE_URL/api/product/search?query=jacket" \
    -H "Cookie: .auth.session-token=$COOKIE_VALUE" | jq .

  echo -e "\n\nTEST 10: Product search with a non-existent product (authenticated)"
  echo "Request: GET $BASE_URL/api/product/search?query=nonexistentproduct123"
  curl -s -X GET "$BASE_URL/api/product/search?query=nonexistentproduct123" \
    -H "Cookie: .auth.session-token=$COOKIE_VALUE" | jq .

  echo -e "\n\nTEST 11: Product search with no query parameter (authenticated)"
  echo "Request: GET $BASE_URL/api/product/search"
  curl -s -X GET "$BASE_URL/api/product/search" \
    -H "Cookie: .auth.session-token=$COOKIE_VALUE" | jq .
  
  # Test with both authentication and merchantId, which should prioritize the auth merchant
  if [ -n "$TEST_MERCHANT_ID" ]; then
    echo -e "\n\nTEST 12: Product search with both authentication and merchantId parameter"
    echo "Request: GET $BASE_URL/api/product/search?query=shirt&merchantId=$TEST_MERCHANT_ID"
    echo "Note: This should prioritize the merchant from your authentication, not the merchantId parameter"
    curl -s -X GET "$BASE_URL/api/product/search?query=shirt&merchantId=$TEST_MERCHANT_ID" \
      -H "Cookie: .auth.session-token=$COOKIE_VALUE" | jq .
  fi
else
  echo "Skipping authenticated tests."
fi

echo -e "\n\nTests completed!" 