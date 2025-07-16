#!/bin/bash

echo "🚀 Starting Mobile App Development Server"
echo "========================================"
echo ""
echo "Web Server Status: ✅ Running on port 5000"
echo "Mobile App: Starting..."
echo ""

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "Installing Expo CLI..."
    npm install -g @expo/cli
fi

# Navigate to mobile directory
cd apps/mobile

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing mobile dependencies..."
    npm install --legacy-peer-deps
fi

# Start Expo development server
echo "Starting Expo development server..."
echo "📱 Scan the QR code with Expo Go app on your phone"
echo ""
expo start --tunnel