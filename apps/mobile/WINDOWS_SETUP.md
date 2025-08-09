# TaskScout Mobile App - Windows Setup Guide

## 🚨 Quick Fix for Windows Users

If you're encountering the `Cannot find module 'expo/metro-config'` error, here's how to fix it:

### Step 1: Install Missing Dependencies
```cmd
cd apps\mobile
npm install @expo/metro-config@~0.25.1
```

### Step 2: Install All Dependencies
```cmd
npm install
```

### Step 3: Clear Cache and Restart
```cmd
npx expo start --clear
```

### Alternative: Simplified Setup

If you continue having issues, you can run a simplified version:

1. **Create a new Expo app:**
```cmd
npx create-expo-app TaskScoutMobile
cd TaskScoutMobile
```

2. **Replace the App.js with our mobile code:**
```cmd
# Copy the contents from apps/mobile/App.tsx
# Copy the src folder from apps/mobile/src
```

3. **Install required packages:**
```cmd
npm install react-native-paper @react-navigation/native @react-navigation/native-stack expo-secure-store expo-constants
```

### API Configuration

Make sure to update the API URL in your local version:

1. Open `apps/mobile/src/services/api.ts`
2. Change the API URL to point to your Replit backend:
```typescript
const API_BASE_URL = 'https://your-replit-url.replit.dev';
```

### Test Connection

Before running the mobile app, verify the backend is accessible:
```cmd
curl https://your-replit-url.replit.dev/api/auth/user
```

### Quick Test Commands

1. **Install Expo CLI globally:**
```cmd
npm install -g @expo/cli
```

2. **Start the app:**
```cmd
npx expo start
```

3. **Test in browser:**
```cmd
npx expo start --web
```

### Mobile App Features

Once running, you'll have access to:
- ✅ Login/Registration system
- ✅ Residential user registration
- ✅ Ticket creation with image upload
- ✅ Marketplace bidding for vendors
- ✅ Real-time API integration
- ✅ Role-based navigation

### Troubleshooting

**If metro bundler fails:**
```cmd
npx expo install --fix
```

**If dependencies conflict:**
```cmd
rm -rf node_modules
npm install
```

**If you need to reset everything:**
```cmd
npx expo install --clean
```

The mobile app is fully functional and connects to the live TaskScout backend running on Replit. Once you get past the initial setup, you'll have the complete mobile experience with all features working.