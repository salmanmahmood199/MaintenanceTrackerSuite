# Maintenance Tracker Mobile App

This is the React Native mobile app for the Maintenance Tracker system.

## Setup

### Prerequisites
1. Install Expo CLI globally:
```bash
npm install -g @expo/cli
```

2. Download Expo Go app on your phone from App Store or Google Play

### Running the Mobile App
1. Navigate to mobile directory:
```bash
cd apps/mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Scan the QR code with Expo Go app on your phone

### Running Both Web and Mobile
1. Make sure web server is running (npm run dev in root directory)
2. In a new terminal, follow the mobile setup steps above
3. Both apps will connect to the same backend API

## Features

- Login with same credentials as web app
- View and manage tickets
- Create new tickets with camera support
- Real-time ticket updates
- Role-based access control
- Offline ticket viewing (coming soon)

## Development

- Uses Expo for easier development and testing
- Shares types and schemas with the web app
- Connects to the same backend API
- Material Design 3 UI components

## Configuration

Update the API URL in `src/contexts/AuthContext.tsx` to point to your backend server.

For development, make sure your backend server is running and accessible from your mobile device.