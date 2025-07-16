# Quick Fix for Mobile App Connection

## Problem
- Mobile app can't connect to Replit server
- File limit errors preventing tunnel mode

## Solution
Updated mobile app to use your Replit server URL for reliable connection.

## Steps:
1. **Fix file limit** (run this first):
   ```bash
   ulimit -n 65536
   ```

2. **Start regular development server**:
   ```bash
   npx expo start
   ```

3. **Server connection**:
   - Your web app runs on Replit: `https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev`
   - Mobile app connects to the same URL
   - Works from anywhere with internet connection

4. **Scan QR code and test**:
   - Login: root@mail.com / admin

## How it works:
- Mobile app connects to your Replit server
- No local network dependency
- Works from any location

## If it still doesn't work:
1. Check your computer's IP: `ifconfig | grep "inet "`
2. Update the IP in `src/contexts/AuthContext.tsx` if needed
3. Make sure your Replit server is running on port 5000