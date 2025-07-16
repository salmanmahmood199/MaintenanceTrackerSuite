# Mobile App Setup Guide

## Step 1: Download and Extract
1. Download the mobile app folder from the project
2. Extract to your desired location (e.g., Desktop/MaintenanceApp)

## Step 2: Configure Server Connection
1. Open `src/contexts/AuthContext.tsx`
2. Find line 33 and replace:
   ```typescript
   return 'https://your-replit-url.replit.app';
   ```
   With your actual Replit URL: `https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev`

## Step 3: Install Prerequisites
```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Download Expo Go app on your phone
# - iOS: App Store
# - Android: Google Play Store
```

## Step 4: Install Dependencies
```bash
# Navigate to mobile app folder
cd path/to/your/mobile/app

# Install dependencies (IMPORTANT: Use --legacy-peer-deps)
npm install --legacy-peer-deps
```

## Step 5: Start Development Server
```bash
# Start the mobile app (use npx expo, not npm start)
npx expo start
```

## Step 6: Run on Your Phone
1. QR code will appear in your terminal
2. Open Expo Go app on your phone
3. Scan the QR code
4. App will load on your phone

## Step 7: Test Login
- **Email**: root@mail.com
- **Password**: admin

## Troubleshooting

### If you get "EMFILE: too many open files" error:
```bash
ulimit -n 65536
npm start
```

### If mobile app can't connect to server:
- Make sure your Replit server is running
- Double-check the URL in `src/contexts/AuthContext.tsx`
- Ensure your phone and computer are on the same network

### If dependencies fail to install:
```bash
npm install --legacy-peer-deps --force
```

### If you get "unable to find expo" error:
```bash
# Use the new Expo CLI (recommended)
npx expo start

# NOT: npm start
```

## Features Available
- Login with web app credentials
- View ticket dashboard
- Create tickets with camera
- View ticket details
- Material Design 3 UI
- Dark/light theme support
- Real-time updates

## File Structure
```
mobile/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx     <- UPDATE THIS FILE
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── CreateTicketScreen.tsx
│   │   └── TicketDetailsScreen.tsx
│   └── services/
│       └── api.ts
├── App.tsx
├── package.json
└── app.json
```

## Support
If you encounter issues, check:
1. Replit server is running
2. URL is correct in AuthContext.tsx
3. Phone and computer on same network
4. Expo Go app is updated