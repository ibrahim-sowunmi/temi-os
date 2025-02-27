#!/bin/bash
# Script to test the Knowledge Base API

# Base URL
BASE_URL="http://localhost:3000/api/knowledge"

# Authentication cookie
AUTH_COOKIE="authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiNm5KNjJrVDFQbU9uS0NrZ0xqRm9HTDI1dHBrSnpTbWoybHN5V3dsd05mSmNGd1hTcVRGYnlIeG1qOGdtNnhLWkJFUlJUcnJJTVp2Z2hzTU5vM2dVQ2cifQ..PiILs0ejoINJpVHSsQ0WNw.JwyXj0GNZJmJ1bXoX0YANq6IUKtW59iRoK5u86nP-_TBgewZgQaFNl4RkaApxbgNvXtdC6vP34YAHOGerSCElAVQIdX3I-LImzHr8_1_Z5k-IH1nLXbtMiNJSRbJBmEyOGLW3iLPGbyWCXOuzqie5mVaE7bNABqn99Yi6O7XuKJULKjTU1k63whAUlBETEh4SM94CmJhsuweSBVhUA50WIh6Yh2aCUGPgfoGafn2-Z2eAP0KCOw8-9BsOT06JF7hpzM6KeoYh_CQ8MXneoS82OIvlK_ezFSdbnPwi9O-tS1Wgskl9pbxZGTi6J39QUtca_LMGlQJiKd9zfq4so3TE5xtLnHr44RDbGv6ClKD8Gwu8g81u_1rb7hJ2NPtCU8P.YLMiS07qY5vlOo40zMlLuRLINinBGlnWYIsDNZgaJXI"

# Specific merchant ID to test with
MERCHANT_ID="cm7mfyop80001x4uneoh0vv9p"

# Set text colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Knowledge Base API for Merchant ID: $MERCHANT_ID${NC}\n"

# Test 1: Create a Knowledge Base (GLOBAL scope)
echo -e "${YELLOW}1. Creating a Knowledge Base with GLOBAL scope${NC}"
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIE" \
  -d '{
    "title": "General Company Policies",
    "content": "This knowledge base contains information about company policies and procedures.",
    "tags": ["policy", "company", "general"],
    "scope": "GLOBAL"
  }')

# Check if we got a successful response (has an ID)
KB_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')

# Verify the merchant ID in the response
RESPONSE_MERCHANT_ID=$(echo $CREATE_RESPONSE | grep -o '"merchant":{[^}]*"id":"[^"]*' | grep -o '"id":"[^"]*' | sed 's/"id":"//')

if [ -n "$KB_ID" ]; then
  echo -e "${GREEN}✓ Successfully created knowledge base with ID: $KB_ID${NC}"
  
  if [ "$RESPONSE_MERCHANT_ID" = "$MERCHANT_ID" ]; then
    echo -e "${GREEN}✓ Knowledge base correctly associated with merchant ID: $MERCHANT_ID${NC}"
  else
    echo -e "${RED}✗ Knowledge base associated with unexpected merchant ID: $RESPONSE_MERCHANT_ID${NC}"
  fi
else
  echo -e "${RED}✗ Failed to create knowledge base. Response: $CREATE_RESPONSE${NC}"
  exit 1
fi

# Test 2: Get the Knowledge Base by ID
echo -e "\n${YELLOW}2. Getting the Knowledge Base by ID${NC}"
GET_RESPONSE=$(curl -s -X GET "$BASE_URL?id=$KB_ID" \
  -H "Cookie: $AUTH_COOKIE")

if echo $GET_RESPONSE | grep -q "$KB_ID"; then
  echo -e "${GREEN}✓ Successfully retrieved knowledge base${NC}"
  
  RESPONSE_MERCHANT_ID=$(echo $GET_RESPONSE | grep -o '"merchant":{[^}]*"id":"[^"]*' | grep -o '"id":"[^"]*' | sed 's/"id":"//')
  if [ "$RESPONSE_MERCHANT_ID" = "$MERCHANT_ID" ]; then
    echo -e "${GREEN}✓ Retrieved knowledge base correctly associated with merchant ID: $MERCHANT_ID${NC}"
  else
    echo -e "${RED}✗ Retrieved knowledge base has unexpected merchant ID: $RESPONSE_MERCHANT_ID${NC}"
  fi
else
  echo -e "${RED}✗ Failed to retrieve knowledge base. Response: $GET_RESPONSE${NC}"
fi

# Test 3: Create a Knowledge Base with PRODUCT scope
echo -e "\n${YELLOW}3. Creating a Knowledge Base with PRODUCT scope${NC}"
PRODUCT_KB_RESPONSE=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIE" \
  -d '{
    "title": "Product Information",
    "content": "This knowledge base contains information about our products.",
    "tags": ["product", "info"],
    "scope": "PRODUCT"
  }')

PRODUCT_KB_ID=$(echo $PRODUCT_KB_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')
RESPONSE_MERCHANT_ID=$(echo $PRODUCT_KB_RESPONSE | grep -o '"merchant":{[^}]*"id":"[^"]*' | grep -o '"id":"[^"]*' | sed 's/"id":"//')

if [ -n "$PRODUCT_KB_ID" ]; then
  echo -e "${GREEN}✓ Successfully created product knowledge base with ID: $PRODUCT_KB_ID${NC}"
  
  if [ "$RESPONSE_MERCHANT_ID" = "$MERCHANT_ID" ]; then
    echo -e "${GREEN}✓ Product knowledge base correctly associated with merchant ID: $MERCHANT_ID${NC}"
  else
    echo -e "${RED}✗ Product knowledge base associated with unexpected merchant ID: $RESPONSE_MERCHANT_ID${NC}"
  fi
else
  echo -e "${RED}✗ Failed to create product knowledge base. Response: $PRODUCT_KB_RESPONSE${NC}"
fi

# Test 4: Update the Knowledge Base
echo -e "\n${YELLOW}4. Updating the Knowledge Base${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL?id=$KB_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIE" \
  -d '{
    "title": "Updated Company Policies",
    "content": "This knowledge base contains updated information about company policies and procedures.",
    "tags": ["policy", "company", "general", "updated"]
  }')

if echo $UPDATE_RESPONSE | grep -q "Updated Company Policies"; then
  echo -e "${GREEN}✓ Successfully updated knowledge base${NC}"
  
  RESPONSE_MERCHANT_ID=$(echo $UPDATE_RESPONSE | grep -o '"merchant":{[^}]*"id":"[^"]*' | grep -o '"id":"[^"]*' | sed 's/"id":"//')
  if [ "$RESPONSE_MERCHANT_ID" = "$MERCHANT_ID" ]; then
    echo -e "${GREEN}✓ Updated knowledge base correctly associated with merchant ID: $MERCHANT_ID${NC}"
  else
    echo -e "${RED}✗ Updated knowledge base has unexpected merchant ID: $RESPONSE_MERCHANT_ID${NC}"
  fi
else
  echo -e "${RED}✗ Failed to update knowledge base. Response: $UPDATE_RESPONSE${NC}"
fi

# Test 5: Get all Knowledge Bases
echo -e "\n${YELLOW}5. Getting all Knowledge Bases${NC}"
ALL_KB_RESPONSE=$(curl -s -X GET "$BASE_URL" \
  -H "Cookie: $AUTH_COOKIE")

KB_COUNT=$(echo $ALL_KB_RESPONSE | grep -o '"id"' | wc -l)
MERCHANT_COUNT=$(echo $ALL_KB_RESPONSE | grep -o "\"merchantId\":\"$MERCHANT_ID\"" | wc -l)

if [ $KB_COUNT -ge 2 ]; then
  echo -e "${GREEN}✓ Successfully retrieved all knowledge bases (found $KB_COUNT)${NC}"
  
  if [ $MERCHANT_COUNT -eq $KB_COUNT ]; then
    echo -e "${GREEN}✓ All knowledge bases are correctly associated with merchant ID: $MERCHANT_ID${NC}"
  else
    echo -e "${RED}✗ Not all knowledge bases are associated with the expected merchant ID. Found $MERCHANT_COUNT/$KB_COUNT.${NC}"
  fi
else
  echo -e "${RED}✗ Failed to retrieve all knowledge bases. Response: $ALL_KB_RESPONSE${NC}"
fi

# Test 6: Get Knowledge Bases by scope
echo -e "\n${YELLOW}6. Getting Knowledge Bases by scope (GLOBAL)${NC}"
SCOPE_RESPONSE=$(curl -s -X GET "$BASE_URL?scope=GLOBAL" \
  -H "Cookie: $AUTH_COOKIE")

if echo $SCOPE_RESPONSE | grep -q "$KB_ID"; then
  echo -e "${GREEN}✓ Successfully retrieved GLOBAL knowledge bases${NC}"
  
  MERCHANT_CHECK=$(echo $SCOPE_RESPONSE | grep -o "\"merchantId\":\"$MERCHANT_ID\"")
  if [ -n "$MERCHANT_CHECK" ]; then
    echo -e "${GREEN}✓ GLOBAL knowledge bases are correctly associated with merchant ID: $MERCHANT_ID${NC}"
  else
    echo -e "${RED}✗ GLOBAL knowledge bases are not associated with the expected merchant ID.${NC}"
  fi
else
  echo -e "${RED}✗ Failed to retrieve knowledge bases by scope. Response: $SCOPE_RESPONSE${NC}"
fi

# Only run deletion tests if explicitly confirmed
if [ "$1" = "--delete" ]; then
  # Test 7: Delete the Knowledge Base
  echo -e "\n${YELLOW}7. Deleting the Knowledge Base${NC}"
  DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL?id=$KB_ID" \
    -H "Cookie: $AUTH_COOKIE")
  
  if echo $DELETE_RESPONSE | grep -q "success"; then
    echo -e "${GREEN}✓ Successfully deleted knowledge base${NC}"
  else
    echo -e "${RED}✗ Failed to delete knowledge base. Response: $DELETE_RESPONSE${NC}"
  fi
  
  # Test 8: Verify deletion by trying to get the deleted knowledge base
  echo -e "\n${YELLOW}8. Verifying deletion${NC}"
  VERIFY_DELETE=$(curl -s -X GET "$BASE_URL?id=$KB_ID" \
    -H "Cookie: $AUTH_COOKIE")
  
  if echo $VERIFY_DELETE | grep -q "not found"; then
    echo -e "${GREEN}✓ Knowledge base was properly deleted${NC}"
  else
    echo -e "${RED}✗ Knowledge base may still exist. Response: $VERIFY_DELETE${NC}"
  fi
  
  # Also clean up the product KB
  echo -e "\n${YELLOW}9. Cleaning up - Deleting the Product Knowledge Base${NC}"
  curl -s -X DELETE "$BASE_URL?id=$PRODUCT_KB_ID" \
    -H "Cookie: $AUTH_COOKIE" > /dev/null
  echo -e "${GREEN}✓ Cleanup complete${NC}"
else
  echo -e "\n${YELLOW}Note: To run deletion tests, rerun with --delete flag${NC}"
  echo -e "${YELLOW}Knowledge Base IDs for manual testing:${NC}"
  echo -e "  GLOBAL KB: $KB_ID"
  echo -e "  PRODUCT KB: $PRODUCT_KB_ID"
  echo -e "  Merchant ID: $MERCHANT_ID"
fi

echo -e "\n${GREEN}Testing complete!${NC}" 