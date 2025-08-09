# Mobile App Setup Instructions

## Quick Start (5 minutes)

### Step 1: Install Expo CLI
```bash
npm install -g @expo/cli
```

### Step 2: Navigate to mobile directory
```bash
cd apps/mobile
```

### Step 3: Install dependencies
```bash
npm install
```

### Step 4: Start the development server
```bash
npm start
```

### Step 5: Run on your phone
1. Download "Expo Go" app from App Store or Google Play
2. Scan the QR code that appears in your terminal
3. The app will load on your phone

## What the Mobile App Includes

✅ **Login Screen** - Same credentials as web app
✅ **Dashboard** - View all tickets with priority and status
✅ **Create Ticket** - Camera integration for photos
✅ **Ticket Details** - Full ticket information and actions
✅ **Material Design 3** - Beautiful, modern UI
✅ **Dark/Light Theme** - Automatic theme switching
✅ **Real-time Updates** - Pull to refresh functionality

## Troubleshooting

If you get dependency errors:
```bash
npm install --legacy-peer-deps
```

If Expo CLI is not found:
```bash
npx expo start
```

## Backend Connection

The mobile app connects to your web server automatically. Make sure:
1. Your web server is running (it currently is)
2. Update the API URL in `src/contexts/AuthContext.tsx` if needed

## Demo Credentials

- **Email**: root@mail.com
- **Password**: admin

The mobile app uses the same authentication system as your web app!