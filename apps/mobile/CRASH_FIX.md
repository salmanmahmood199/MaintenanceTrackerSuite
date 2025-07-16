# Mobile App Crash Fix

## Problem
React Native crash with non-std C++ exception after SDK 53 upgrade.

## Solution
Reverted to Expo SDK 52 for better stability.

## Fixed Configuration
- **Expo SDK**: 52.0.0 (stable)
- **React Native**: 0.75.4 (stable)
- **React**: 18.3.1
- Stable versions of all dependencies

## Steps to Fix:
1. **Clean installation**:
   ```bash
   rm -rf node_modules
   rm package-lock.json
   npm install --legacy-peer-deps
   ```

2. **Missing Dependencies Fixed**:
   - Added `react-native-reanimated` (required for animations)
   - Added proper `babel.config.js` configuration

2. **Start fresh**:
   ```bash
   ulimit -n 65536
   npx expo start --clear
   ```

3. **If still crashes**:
   ```bash
   # Reset Metro cache
   npx expo start --reset-cache
   
   # Or try development build
   npx expo start --dev-client
   ```

## Why This Fixes It
- SDK 52 is more stable than 53
- Compatible dependencies
- No experimental features
- Proven stability record

Your mobile app should now run without crashes!