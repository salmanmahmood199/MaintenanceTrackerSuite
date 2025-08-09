# TaskScout Mobile - Quick Install (SDK 53)

## Updated for Latest Expo Go iOS App

The mobile app has been upgraded to Expo SDK 53 to work with the latest Expo Go app on iOS.

### Installation Steps:

```bash
cd /Users/salmanmahmood/Downloads/MaintenanceTracker-1/apps/mobile

# Run the setup script
./setup-mobile.sh

# Or install manually:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install -g npm@latest
npm install -g @expo/cli@latest
npm install

# Start the app
npx expo start
```

### What's New in SDK 53:
- Compatible with latest Expo Go iOS app
- Updated React Native to 0.76.5
- Latest navigation and UI libraries
- Enhanced camera and image picker

### Testing:
1. Make sure TaskScout server is running (port 5000)
2. Update Expo Go app on your phone to latest version
3. Scan QR code with Expo Go app
4. Test login with: root@mail.com / admin

The app includes all TaskScout features: authentication, ticket creation, marketplace bidding, and real-time updates.