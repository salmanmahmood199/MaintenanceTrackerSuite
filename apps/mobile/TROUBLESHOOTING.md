# Mobile App Troubleshooting

## Common Issues and Solutions

### 1. "EMFILE: too many open files" Error (macOS)

**Problem:** Metro bundler can't watch files due to macOS file limit.

**Solution:**
```bash
# Run this before starting the app
ulimit -n 65536
npm start
```

Or run:
```bash
./fix-file-limit.sh
```

### 2. Mobile App Can't Connect to Server

**Problem:** Mobile app shows network errors or login fails.

**Solution:** The API URL is already set to use `0.0.0.0:5000` which should work automatically. If you still have connection issues, you can try:
```typescript
// Alternative: Use your specific IP address
return 'http://192.168.1.153:5000';
```

### 3. Dependencies Issues

**Problem:** Package installation fails or version conflicts.

**Solution:**
```bash
npm install --legacy-peer-deps
```

### 4. Expo Go Not Working

**Problem:** QR code scanning doesn't work.

**Solutions:**
- Make sure Expo Go app is updated
- Try typing `w` in terminal to open web version
- Use tunnel mode: `expo start --tunnel`

### 5. App Crashes on Phone

**Problem:** App crashes when opening.

**Solutions:**
- Check if your phone and computer are on same WiFi
- Clear Expo Go cache
- Restart the development server

## Current Status

✅ **Expo CLI Installed**: Version installed successfully
✅ **Dependencies**: Installed with legacy peer deps
✅ **Development Server**: Metro bundler running
✅ **QR Code**: Generated and ready to scan

## Next Steps

1. **Fix file limits**: Run `./fix-file-limit.sh`
2. **Update IP address**: Edit `src/contexts/AuthContext.tsx`
3. **Scan QR code**: Use Expo Go app on your phone
4. **Test login**: Use root@mail.com / admin