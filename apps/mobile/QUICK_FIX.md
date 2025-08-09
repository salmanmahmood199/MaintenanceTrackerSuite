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
   - Mobile app connects to: `http://96.241.167.161:5000`
   - Your server should be accessible at this IP
   - Same network required for local IP connection

4. **Scan QR code and test**:
   - Login: root@mail.com / admin

## How it works:
- Mobile app connects to `http://96.241.167.161:5000`
- Local network connection to your server
- Same network required for both devices

## If it still doesn't work:
1. Check your computer's IP: `ifconfig | grep "inet "`
2. Update the IP in `src/contexts/AuthContext.tsx` if needed
3. Make sure your Replit server is running on port 5000