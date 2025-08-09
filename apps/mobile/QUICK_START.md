# Quick Start - Mobile App

## 🚀 5-Minute Setup

### 1. Update Server URL
Edit `src/contexts/AuthContext.tsx` line 33:
```typescript
return 'https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev';
```

### 2. Install & Run
```bash
npm install -g @expo/cli
npm install --legacy-peer-deps
npx expo start
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