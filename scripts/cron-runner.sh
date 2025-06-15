#!/bin/bash

# Continuous P2P Data Fetcher
# Runs the fetch script every 5 seconds

INTERVAL="${FETCH_INTERVAL:-5}"
SCRIPT_DIR="$(dirname "$0")"
FETCH_SCRIPT="$SCRIPT_DIR/fetch-p2p.sh"

echo "🚀 Starting P2P cron runner..."
echo "📊 Fetch interval: $INTERVAL seconds"
echo "🔄 Target: USDT/USD on TBC Bank (both sides)"
echo "📜 Script: $FETCH_SCRIPT"
echo ""

# Make sure the fetch script is executable
chmod +x "$FETCH_SCRIPT"

# Check if the fetch script exists
if [ ! -f "$FETCH_SCRIPT" ]; then
    echo "❌ Error: Fetch script not found at $FETCH_SCRIPT"
    exit 1
fi

# Function to handle shutdown gracefully
cleanup() {
    echo ""
    echo "📨 Received shutdown signal"
    echo "🛑 Stopping P2P cron runner..."
    echo "👋 Goodbye!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main loop
iteration=0
while true; do
    iteration=$((iteration + 1))
    
    echo "🔄 =================================="
    echo "🔄 Iteration #$iteration - $(date)"
    echo "🔄 =================================="
    
    # Run the fetch script
    if "$FETCH_SCRIPT"; then
        echo "✅ Iteration #$iteration completed successfully"
    else
        echo "❌ Iteration #$iteration failed"
    fi
    
    echo ""
    echo "⏱️ Waiting $INTERVAL seconds until next fetch..."
    sleep "$INTERVAL"
done 