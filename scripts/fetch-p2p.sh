#!/bin/bash

# Bybit P2P Data Fetcher Script
# Fetches USDT/USD listings for both buy and sell sides using curl

API_URL="${API_URL:-http://deno-rest:9000}"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

echo "$LOG_PREFIX Starting P2P data fetch..."

# Function to make API call
fetch_p2p_data() {
    local side=$1
    local side_name=$2
    
    echo "$LOG_PREFIX Fetching $side_name orders (side=$side)..."
    
    response=$(curl -s -X POST "$API_URL/api/p2p/fetch" \
        -H "Content-Type: application/json" \
        -d '{
            "tokenId": "USDT",
            "currencyId": "USD",
            "side": '$side',
            "payment": ["165"],
            "size": 10,
            "page": 1
        }' \
        -w "HTTP_CODE:%{http_code}")
    
    http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')
    
    if [ "$http_code" = "200" ]; then
        echo "$LOG_PREFIX ✅ Successfully fetched $side_name orders"
        echo "$LOG_PREFIX Response: $body"
    else
        echo "$LOG_PREFIX ❌ Failed to fetch $side_name orders (HTTP $http_code)"
        echo "$LOG_PREFIX Error response: $body"
    fi
    
    return $http_code
}

# Fetch buy orders (Bybit side=1)
fetch_p2p_data 1 "BUY"

# Small delay between requests
sleep 1

# Fetch sell orders (Bybit side=0) 
fetch_p2p_data 0 "SELL"

echo "$LOG_PREFIX P2P data fetch completed" 