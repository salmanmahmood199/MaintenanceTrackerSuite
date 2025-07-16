#!/bin/bash
echo "🚀 Starting Maintenance System - Web & Mobile"
echo "=============================================="
echo ""

# Start web server in background
echo "📱 Starting Web Server..."
npm run dev &
WEB_PID=$!

echo "Web server started with PID: $WEB_PID"
echo "Web app running at: http://localhost:5000"
echo ""

# Instructions for mobile
echo "📱 To start Mobile App:"
echo "1. Open a new terminal"
echo "2. Run: cd apps/mobile"
echo "3. Run: npm install"
echo "4. Run: npm start"
echo "5. Scan QR code with Expo Go app"
echo ""
echo "Press Ctrl+C to stop the web server"
echo "=============================================="

# Wait for web server
wait $WEB_PID