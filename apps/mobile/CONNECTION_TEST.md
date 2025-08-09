# Connection Test for Mobile App

## Issue
Mobile app shows "Could not connect to the server" error when trying to access your Replit server.

## Test Your Server Connection
1. Open your web browser on your phone
2. Navigate to: `https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev`
3. You should see your web app login page

## If Server is Accessible
The mobile app should work. Try these steps:
1. Close the Expo Go app completely
2. Restart your mobile development server: `npx expo start --clear`
3. Scan the QR code again
4. Try logging in with: root@mail.com / admin

## If Server is Not Accessible
Your Replit server might be sleeping or the URL changed. Check:
1. Make sure your Replit server is running
2. Check if the URL in your browser matches the one in the mobile app
3. Update the URL in `src/contexts/AuthContext.tsx` if needed

## Alternative: Use Tunnel Mode
If you're still having connection issues, try tunnel mode:
```bash
npx expo start --tunnel
```
This creates a public URL that works from anywhere.

## Current Configuration
Your mobile app is configured to connect to:
`https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev`

This should match exactly what you see in your web browser.