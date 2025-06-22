# TaskScout Mobile App

A React Native mobile application for the TaskScout maintenance management system.

## Features

- **Cross-platform**: Works on both iOS and Android
- **Role-based access**: Supports different user roles (root, org_admin, maintenance_admin, technician)
- **Ticket management**: Create, view, and manage maintenance tickets
- **Image capture**: Camera integration for maintenance photos
- **Offline-ready**: Built with potential offline capabilities in mind
- **Real-time updates**: Uses React Query for data synchronization

## Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe development
- **React Navigation**: Navigation between screens
- **React Query**: Server state management
- **Expo Camera**: Image capture functionality
- **Expo SecureStore**: Secure token storage

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g @expo/cli`
- Expo Go app on your mobile device (for testing)

### Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Update the API URL in `src/services/api.ts`:
   - For development: `http://localhost:5000`
   - For production: Your deployed Replit app URL

### Running the App

1. Start the Expo development server:
```bash
npm start
```

2. Scan the QR code with:
   - **iOS**: Camera app or Expo Go
   - **Android**: Expo Go app

### Building for Production

#### iOS (requires macOS)
```bash
expo build:ios
```

#### Android
```bash
expo build:android
```

## Project Structure

```
mobile/
├── src/
│   ├── contexts/          # React contexts (Auth, etc.)
│   ├── screens/           # Screen components
│   ├── services/          # API and external services
│   └── types/             # TypeScript type definitions
├── assets/                # Images, icons, fonts
├── App.tsx               # Main app component
├── app.json              # Expo configuration
└── package.json          # Dependencies and scripts
```

## Features by Role

### Organization Admin
- View and manage tickets for their organization
- Create new maintenance tickets
- View ticket details and progress

### Maintenance Admin (Vendor)
- View tickets assigned to their vendor
- Accept/reject tickets
- Assign technicians to tickets

### Technician
- View assigned tickets
- Update ticket status
- Capture photos during maintenance
- Submit work completion reports

### Root Admin
- Full system access
- Manage organizations and vendors
- View all tickets across the system

## API Integration

The mobile app connects to the same Express.js backend as the web application:

- **Authentication**: Token-based (stored securely with Expo SecureStore)
- **API Endpoints**: Same REST endpoints as web app
- **Image Upload**: Multipart form data for maintenance photos
- **Real-time Updates**: React Query for data synchronization

## Customization

### Branding
- Update `app.json` for app name, icons, and splash screen
- Modify color scheme in screen stylesheets
- Replace icons in `assets/` folder

### Add Features
- Push notifications for ticket updates
- GPS location tracking for technicians
- Offline data synchronization
- Barcode/QR code scanning

## Deployment

### App Store (iOS)
1. Build with `expo build:ios`
2. Download .ipa file
3. Upload to App Store Connect
4. Submit for review

### Google Play Store (Android)
1. Build with `expo build:android`
2. Download .apk or .aab file
3. Upload to Google Play Console
4. Submit for review

## Development Notes

- Uses Expo managed workflow for easier development
- Can eject to bare React Native if advanced native features needed
- Hot reloading enabled for fast development
- TypeScript for better code quality and IDE support

## Future Enhancements

- **Offline Mode**: Cache data for offline usage
- **Push Notifications**: Real-time alerts for ticket updates
- **GPS Tracking**: Location tracking for technicians
- **Voice Notes**: Audio recordings for maintenance reports
- **Barcode Scanning**: Equipment identification
- **Dark Mode**: Theme switching capability