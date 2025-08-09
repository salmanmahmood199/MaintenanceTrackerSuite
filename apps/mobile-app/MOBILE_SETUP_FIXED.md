# Mobile App Setup Guide - FIXED

## Issue Resolution

The mobile app was failing with "Network request failed" errors when trying to create tickets. This was due to:

1. **Incorrect API URL**: The mobile app was trying to connect to `https://taskscout.ai` instead of the local development server
2. **Missing CORS configuration**: The backend wasn't configured to accept cross-origin requests from the mobile app
3. **Network configuration**: Expo requires specific IP address configuration for local development

## Changes Made

### 1. Backend CORS Configuration Added
- Added CORS middleware to `server/index.ts`
- Configured to accept requests from Expo development server
- Supports both HTTP and Expo protocol URLs
- Allows credentials for session management

### 2. Mobile App API Configuration Fixed
- Updated `apps/mobile-app/src/services/api.ts` to use correct local IP
- Added environment variable support for flexible configuration
- Fixed TypeScript issues with header manipulation

### 3. Environment Configuration
- Created `.env.example` with proper API URL
- Mobile app now detects local development vs production automatically

## Setup Instructions

### For Development

1. **Start the backend server** (from project root):
   ```bash
   npm run dev
   ```
   This starts the backend on `http://0.0.0.0:5000`

2. **Get your local IP address**:
   - On Mac/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - On Windows: `ipconfig | findstr IPv4`
   - Look for your local network IP (usually 192.168.x.x)

3. **Update mobile app configuration** (if needed):
   - Edit `apps/mobile-app/src/services/api.ts`
   - Change the IP address in the development URL to match your local IP
   - Current setting: `http://192.168.1.153:5000`

4. **Start the mobile app** (from `apps/mobile-app` folder):
   ```bash
   npm install
   npm start
   ```

5. **Connect your device**:
   - Use Expo Go app on your phone
   - Scan the QR code displayed in terminal
   - Make sure your phone is on the same WiFi network

### For Production

The app automatically uses `https://taskscout.ai` when not in development mode.

## Testing

To test if the connection is working:

1. Open the mobile app
2. Try to login with credentials
3. Try to create a new ticket
4. Check the terminal logs for successful API requests

## Troubleshooting

### "Network request failed"
- Ensure your phone and computer are on the same WiFi network
- Check if the IP address in the mobile app matches your computer's IP
- Verify the backend server is running on port 5000

### Authentication Issues
- The app uses session-based authentication with cookies
- CORS is configured to allow credentials
- Sessions are stored server-side with PostgreSQL

### File Upload Issues
- Images and videos are uploaded using FormData
- File size limit is 50MB
- Supported formats: images/* and videos/*

## Troubleshooting 403 Errors

If you're still getting 403 errors, try these solutions:

### 1. Find Your Correct IP Address
Run this command on your computer to find your local IP:
```bash
# On Mac/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows:
ipconfig | findstr IPv4
```

### 2. Update Mobile App IP Address
Edit `apps/mobile-app/src/services/api.ts` and change the IP in line 13:
```javascript
"http://YOUR_ACTUAL_IP:5000",  // Replace with your IP
```

### 3. Alternative: Use Expo Dev Server IP
When you run `npm start` in the mobile app, Expo shows:
```
Metro waiting on exp://192.168.x.x:8081
```
Use that same IP but with port 5000:
```javascript
"http://192.168.x.x:5000",
```

### 4. Test Connection
Create a test file to verify connection:
```bash
cd apps/mobile-app
node debug-connection.js
```

## Current Status

✅ Backend CORS configuration added (allows all origins in development)
✅ Mobile app API URL configuration with debugging
✅ TypeScript errors resolved
✅ Environment configuration created
✅ Debug logging added to server
🔄 IP address may need manual adjustment

The mobile app should now be able to:
- Connect to the local development server
- Authenticate users  
- Create tickets with media attachments
- Access all API endpoints

## Quick Fix Summary

1. **Start backend**: `npm run dev` (from project root)
2. **Find your IP**: Use `ifconfig` or `ipconfig` 
3. **Update mobile config**: Edit the IP in `apps/mobile-app/src/services/api.ts`
4. **Start mobile app**: `npm start` (from `apps/mobile-app` folder)
5. **Test**: Try logging in with `placeticket@nsrpetro.com`