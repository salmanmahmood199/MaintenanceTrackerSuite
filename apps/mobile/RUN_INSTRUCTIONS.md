# How to Run Your Mobile App

## Prerequisites
✅ All dependencies fixed
✅ IP address configured: 96.241.167.161
✅ Connects to your server on port 5000
✅ Watchman recommended for macOS (fixes file watcher limits)

## Run Commands
```bash
# 1. Clean installation (if not done already)
rm -rf node_modules
rm package-lock.json
npm install --legacy-peer-deps

# 2. Fix file limit (macOS)
ulimit -n 65536

# 3. Start the mobile app
npx expo start
```

## Expected Output
```
Starting Metro Bundler
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▄▄▄ ▀ ██ █ ▄▄▄▄▄ █
█ █   █ ██▄▀ █  ▄▄█ █   █ █
[QR CODE HERE]

› Metro waiting on exp://96.241.167.161:8081
› Scan the QR code above with Expo Go
```

## Test on Your Phone
1. **Download Expo Go** (App Store/Google Play)
2. **Scan QR code** from terminal
3. **Login**: root@mail.com / admin

## Server Connection
- Mobile app connects to: `http://96.241.167.161:5000`
- Make sure your server is running on port 5000
- Both devices should be on the same network

## If It Doesn't Work
- **File watcher errors**: Install Watchman: `brew install watchman`
- **Alternative**: Use tunnel mode: `npx expo start --tunnel`
- Check server is running: `http://96.241.167.161:5000` in browser
- Clear cache: `npx expo start --clear`

Your mobile maintenance app is ready to run!