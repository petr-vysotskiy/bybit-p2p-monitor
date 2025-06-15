#!/bin/bash

# Start Bybit P2P Monitor - Development Mode
echo "🚀 Starting Bybit P2P Monitor Development Environment..."

# Function to cleanup background processes
cleanup() {
    echo "🛑 Stopping development servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set cleanup function for script exit
trap cleanup SIGINT SIGTERM

# Start backend server
echo "📊 Starting backend server on http://localhost:9000..."
deno run --allow-read --allow-write --allow-net --allow-env --allow-ffi --node-modules-dir=auto --watch app.ts &

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server on http://localhost:5173..."
cd frontend
deno run dev &

# Wait for both processes
wait 