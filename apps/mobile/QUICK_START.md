# Quick Start - Mobile App

## 🚀 5-Minute Setup

### 1. Update Server URL
Edit `src/contexts/AuthContext.tsx` line 33:
```typescript
return 'https://YOUR_REPLIT_URL.replit.app';
```

### 2. Install & Run
```bash
npm install -g @expo/cli
npm install --legacy-peer-deps
npm start
```

### 3. Scan QR Code
- Download Expo Go app
- Scan QR code with your phone
- Login: root@mail.com / admin

## That's it! 🎉

Your mobile maintenance app is now running and connected to your Replit server.

## Common Issues
- **Can't connect**: Check URL in AuthContext.tsx
- **File limit error**: Run `ulimit -n 65536`
- **Install errors**: Use `--legacy-peer-deps` flag