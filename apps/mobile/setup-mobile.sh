#!/bin/bash

echo "🚀 Setting up TaskScout Mobile App (Expo SDK 53)..."

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

# Update npm to latest version
echo "📦 Updating npm..."
npm install -g npm@latest

# Install Expo CLI if not present
if ! command -v expo &> /dev/null; then
  echo "⚡ Installing Expo CLI globally..."
  npm install -g @expo/cli@latest
fi

# Install dependencies for SDK 53
echo "📦 Installing Expo SDK 53 dependencies..."
npm install

# Install peer dependencies that might be missing
echo "🔧 Installing additional peer dependencies..."
npm install expo-dev-client@~4.0.0 --save-dev

echo ""
echo "✅ SDK 53 Setup complete! Now you can run:"
echo ""
echo "   npx expo start"
echo ""
echo "📱 Make sure to:"
echo "   1. Update to latest Expo Go app on your phone (iOS/Android)"
echo "   2. Keep your main TaskScout server running (port 5000)"
echo "   3. Connect to the same WiFi network"
echo ""
echo "🍎 iOS Note: Latest Expo Go now supports SDK 53"
echo "🤖 Android Note: Compatible with latest Expo Go"
echo ""