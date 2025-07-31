#!/bin/bash

# TaskScout - Start Both Web and Mobile Apps
echo "Starting TaskScout Web and Mobile Applications..."

# Kill existing processes
echo "Cleaning up existing processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true

# Start main web server in background
echo "Starting main web server on port 5000..."
npm run dev &
WEB_PID=$!

# Wait for web server to start
sleep 5

# Start mobile app web version
echo "Starting mobile app on port 19006..."
cd apps/mobile
npx expo start --web &
MOBILE_PID=$!

echo "🚀 Both servers starting up:"
echo "📱 Mobile App: http://localhost:19006"
echo "🌐 Web App: http://localhost:5000"

# Wait for user to stop
echo "Press Ctrl+C to stop both servers"
trap "kill $WEB_PID $MOBILE_PID 2>/dev/null; exit" INT

# Keep script running
wait