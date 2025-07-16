# Maintenance Tracker Mobile App

This is the React Native mobile app for the Maintenance Tracker system.

## Setup

1. Install dependencies:
```bash
cd apps/mobile
npm install
```

2. Start the development server:
```bash
npm start
```

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