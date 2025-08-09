# Fix macOS File Watcher Limit with Watchman

## Problem
"Your macOS system limit does not allow enough watchers for Metro"

## Solution: Install Watchman
Watchman is Facebook's file watching service that handles large projects better than the default system.

### Option 1: Install with Homebrew (Recommended)
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Watchman
brew install watchman

# Start your mobile app
npx expo start
```

### Option 2: Alternative Fix (Temporary)
If you can't install Watchman, increase the file limit:
```bash
# Set higher limit
sudo sysctl -w kern.maxfiles=65536
sudo sysctl -w kern.maxfilesperproc=65536

# Then run
ulimit -n 65536
npx expo start
```

### Option 3: Use Tunnel Mode (Bypass Watchers)
```bash
# This uses less file watchers
npx expo start --tunnel
```

## After Installing Watchman
```bash
# Just run normally
npx expo start
```

## Why Watchman is Better
- Handles thousands of files efficiently
- Designed for React Native development
- No file limit issues
- Faster file change detection
- Industry standard for React Native

## Verification
After installing Watchman, you should see:
- No file watcher errors
- Faster Metro bundler startup
- QR code appears without issues
- Mobile app connects to http://96.241.167.161:5000

Your mobile app will run smoothly with Watchman!