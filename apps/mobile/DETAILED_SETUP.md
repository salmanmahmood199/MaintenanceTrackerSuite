# Detailed Mobile App Setup Instructions

## Prerequisites
- macOS, Windows, or Linux computer
- Node.js installed (check with `node --version`)
- Internet connection
- Smartphone (iOS or Android)

## Step 1: Download Mobile App
1. Download the `apps/mobile` folder from your project
2. Extract to a location like `/Users/yourusername/Downloads/MaintenanceTracker-1/apps/mobile`
3. Note the full path - you'll need it

## Step 2: Open Terminal
- **Mac**: Press `Cmd + Space`, type "Terminal", press Enter
- **Windows**: Press `Win + R`, type "cmd", press Enter
- **Linux**: Press `Ctrl + Alt + T`

## Step 3: Navigate to Mobile App Folder
```bash
# Replace with your actual path
cd /Users/yourusername/Downloads/MaintenanceTracker-1/apps/mobile

# Verify you're in the right folder (should show package.json)
ls -la
```

## Step 4: Install Expo CLI Globally
```bash
npm install -g @expo/cli
```
**Expected output**: Installation progress, then "changed XXX packages"

## Step 5: Install App Dependencies
```bash
# IMPORTANT: Must use --legacy-peer-deps flag
npm install --legacy-peer-deps
```

**If you get errors:**
- Try: `npm install --legacy-peer-deps --force`
- Or: `rm -rf node_modules && npm install --legacy-peer-deps`

**Expected output**: 
- Installation progress
- "added XXX packages" 
- Possibly some warnings (normal)

## Step 6: Start the Development Server
```bash
# Use npx expo start (NOT npm start)
npx expo start
```

**Expected output:**
```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

## Step 7: Install Expo Go on Your Phone
- **iPhone**: App Store → Search "Expo Go" → Install
- **Android**: Google Play → Search "Expo Go" → Install

## Step 8: Connect Your Phone
### For iPhone:
1. Open Camera app
2. Point at QR code in terminal
3. Tap notification that appears
4. App will open in Expo Go

### For Android:
1. Open Expo Go app
2. Tap "Scan QR Code"
3. Point at QR code in terminal
4. App will load

## Step 9: Login to App
- **Email**: root@mail.com
- **Password**: admin

## Troubleshooting

### Problem: "ERESOLVE unable to resolve dependency tree"
**Solution**: You must use `--legacy-peer-deps` flag
```bash
npm install --legacy-peer-deps
```

### Problem: "unable to find expo in this project"
**Solution**: Use `npx expo start` instead of `npm start`
```bash
npx expo start
```

### Problem: "Metro waiting" but no QR code
**Solution**: Press `r` to reload, or try tunnel mode
```bash
npx expo start --tunnel
```

### Problem: Phone can't connect to server
**Solution**: Check that server URL is correct in `src/contexts/AuthContext.tsx`
```typescript
return 'https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev';
```

### Problem: App crashes on phone
**Solution**: Check terminal for error messages, restart with
```bash
npx expo start --clear
```

## Complete Command Sequence
```bash
# Navigate to folder
cd /Users/yourusername/Downloads/MaintenanceTracker-1/apps/mobile

# Install Expo CLI
npm install -g @expo/cli

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npx expo start

# Scan QR code with phone
# Login: root@mail.com / admin
```

## What You Should See
1. Terminal shows QR code and "Metro waiting"
2. Phone loads app after scanning
3. Login screen appears
4. After login: ticket dashboard
5. You can create tickets, view details, take photos

## App Features
- ✅ Login with web app credentials
- ✅ View all tickets
- ✅ Create new tickets with camera
- ✅ View ticket details and images
- ✅ Material Design 3 interface
- ✅ Dark/light theme
- ✅ Real-time updates

## Need Help?
- Check terminal for error messages
- Restart: `Ctrl+C` then `npx expo start`
- Clear cache: `npx expo start --clear`
- Force reinstall: `rm -rf node_modules && npm install --legacy-peer-deps`

Your mobile app connects to the same server as your web app, so all data stays in sync!