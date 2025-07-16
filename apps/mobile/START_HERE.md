# START HERE - Mobile App from Full Project Download

## Step 1: Open Terminal
- **Mac**: Press `Cmd + Space`, type "Terminal", press Enter
- **Windows**: Press `Win + R`, type "cmd", press Enter

## Step 2: Navigate to Mobile App Folder
```bash
# Replace "YourDownloadFolder" with where you extracted the project
cd /Users/yourusername/Downloads/YourProjectFolder/apps/mobile

# Or if on Windows:
cd C:\Users\yourusername\Downloads\YourProjectFolder\apps\mobile

# Verify you're in the right place (should show package.json, App.tsx, src folder)
ls
```

## Step 3: Install Expo CLI
```bash
npm install -g @expo/cli
```

## Step 4: Install Dependencies
```bash
# MUST use --legacy-peer-deps flag
npm install --legacy-peer-deps
```

## Step 5: Start the App
```bash
# Use npx expo start (NOT npm start)
npx expo start
```

## Step 6: You Should See This
```
Starting Metro Bundler
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

[QR CODE APPEARS HERE]

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
› Press r │ reload app
› Press m │ toggle menu
```

## Step 7: Scan QR Code
- **iPhone**: Open Camera app → Point at QR code → Tap notification
- **Android**: Download Expo Go app → Tap "Scan QR Code" → Point at QR code

## Step 8: Login
- **Email**: root@mail.com
- **Password**: admin

## Common Issues & Solutions

### Issue: "ERESOLVE unable to resolve dependency tree"
```bash
npm install --legacy-peer-deps --force
```

### Issue: "unable to find expo in this project"
```bash
npx expo start
# NOT: npm start
```

### Issue: QR code doesn't appear
```bash
# Press 'r' to reload
# Or try tunnel mode:
npx expo start --tunnel
```

### Issue: App won't connect to server
The server URL is already configured to: `https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev`

If it doesn't work, edit `src/contexts/AuthContext.tsx` and update the URL.

## Success Checklist
- ✅ Terminal shows QR code
- ✅ Phone scans QR code successfully
- ✅ App loads on phone
- ✅ Login screen appears
- ✅ Can login with root@mail.com/admin
- ✅ See ticket dashboard
- ✅ Can create tickets with camera

## Full Command Sequence
```bash
cd /path/to/your/project/apps/mobile
npm install -g @expo/cli
npm install --legacy-peer-deps
npx expo start
```

That's it! The QR code should appear and you can scan it with your phone.