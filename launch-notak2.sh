#!/bin/bash
# launch-notak2.sh - Notak2 Desktop Launcher

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

# Check if server is already running on port 8080
if ! curl -s http://localhost:8080/ > /dev/null; then
    echo "Starting Notak2 Local Server..."
    # Start the server in the background
    npm start > ~/.notak2/server.log 2>&1 &
    
    # Wait for server to boot
    sleep 2
fi

# Try to open in App Mode using Chrome or Edge, fallback to default browser
if command -v google-chrome &> /dev/null; then
    google-chrome --app=http://localhost:8080/app
elif command -v microsoft-edge &> /dev/null; then
    microsoft-edge --app=http://localhost:8080/app
else
    xdg-open http://localhost:8080/app
fi
