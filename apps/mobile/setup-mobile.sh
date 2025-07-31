#!/bin/bash

echo "🚀 Setting up TaskScout Mobile App..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Please run this from the apps/mobile directory"
  echo "   cd apps/mobile"
  echo "   ./setup-mobile.sh"
  exit 1
fi

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Remove node_modules and package-lock.json if they exist
if [ -d "node_modules" ]; then
  echo "🗑️  Removing old node_modules..."
  rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
  echo "🗑️  Removing old package-lock.json..."
  rm -f package-lock.json
fi

# Install dependencies with legacy peer deps to avoid conflicts
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Check if Expo CLI is installed globally
if ! command -v expo &> /dev/null; then
  echo "⚡ Installing Expo CLI globally..."
  npm install -g @expo/cli
fi

echo ""
echo "✅ Setup complete! Now you can run:"
echo ""
echo "   npx expo start"
echo ""
echo "📱 Make sure to:"
echo "   1. Install Expo Go app on your phone"
echo "   2. Keep your main TaskScout server running (port 5000)"
echo "   3. Connect to the same WiFi network"
echo ""