# Quick Fix for Mobile App Connection

## Problem
- Mobile app can't connect to Replit server
- File limit errors preventing tunnel mode

## Solution
Updated mobile app to use your local IP address instead of Replit server.

## Steps:
1. **Fix file limit** (run this first):
   ```bash
   ulimit -n 65536
   ```

2. **Start regular development server**:
   ```bash
   npx expo start
   ```

3. **Make sure your Replit server is running locally**:
   - Your web app should be accessible at `http://192.168.1.153:5000`
   - This is the same IP your mobile development server uses

4. **Scan QR code and test**:
   - Login: root@mail.com / admin

## How it works:
- Mobile app now connects to `http://192.168.1.153:5000`
- This is your local computer running the Replit server
- Same network, no external connection needed

## If it still doesn't work:
1. Check your computer's IP: `ifconfig | grep "inet "`
2. Update the IP in `src/contexts/AuthContext.tsx` if needed
3. Make sure your Replit server is running on port 5000