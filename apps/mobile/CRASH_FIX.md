# TaskScout Mobile - Crash Fix Guide

## React Native Runtime Crash Solution

If you're seeing crashes like "non-std C++ exception" or RCTFatal errors, try these steps:

### 1. Clear Everything
```bash
cd /Users/salmanmahmood/Downloads/MaintenanceTracker-1/apps/mobile

# Clear all caches and builds
rm -rf node_modules
rm -rf .expo
npm cache clean --force
expo doctor --fix-dependencies
```

### 2. Reinstall Dependencies
```bash
npm install
```

### 3. Reset Expo Cache
```bash
npx expo start --clear
```

### 4. Alternative: Try Web Version
If iOS continues crashing, test in web browser first:
```bash
npx expo start --web
```

### 5. iOS Simulator Alternative
If device crashes, try iOS Simulator:
```bash
npx expo start --ios
```

### 6. Minimal Test
If still crashing, test with minimal config:
```bash
npx expo start --dev-client
```

## Configuration Changes Made
- Simplified metro.config.js (removed complex monorepo setup)
- Removed reanimated plugin from babel (common crash cause)
- Using stable Expo SDK 53 configuration

## If Nothing Works
Try the web version of the mobile app:
```bash
npx expo start --web
```

The web version gives you the same mobile interface in a browser while we debug the native app.