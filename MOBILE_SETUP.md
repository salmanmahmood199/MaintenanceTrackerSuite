# TaskScout Mobile App Setup

## Quick Start (Both Apps Together)

Run both the main web app and mobile app simultaneously:

```bash
./start-mobile-and-web.sh
```

This will start:
- **Web App**: http://localhost:5000 (main TaskScout platform)  
- **Mobile App**: http://localhost:19006 (mobile interface)

## Manual Setup

### 1. Install Mobile Dependencies
```bash
cd apps/mobile
npm install --legacy-peer-deps
```

### 2. Start Mobile App (Web Version)
```bash
npx expo start --web
```

### 3. Start Main Server (Separate Terminal)
```bash
npm run dev
```

## Authentication

Both apps use the same login credentials:
- **Root Admin**: root@mail.com / admin
- **Residential**: Click "Sign up here" to register

## Features Available in Mobile App

✅ **Authentication**: All user roles (root, residential, vendor, technician)
✅ **Ticket Management**: Create, view, update tickets with image/video upload
✅ **Marketplace**: Browse tickets, place bids, negotiate prices
✅ **Dashboard**: Role-based dashboards with statistics
✅ **Address Management**: Residential users can manage service addresses
✅ **Real-time Updates**: Status changes, assignments, completions

## API Configuration

The mobile app automatically connects to:
- **Development**: http://localhost:5000 (when web version)
- **Native**: http://0.0.0.0:5000 (when on device)

## Troubleshooting

### Login Issues
- Open browser developer tools (F12) → Console
- Check for API connection errors
- Verify main server is running on port 5000

### Dependency Issues
```bash
# Clear cache and reinstall
cd apps/mobile
rm -rf node_modules
npm cache clean --force
npm install --legacy-peer-deps
```

### Port Conflicts
```bash
# Kill existing processes
pkill -f "expo start"
lsof -i :19006 -t | xargs kill -9 2>/dev/null || true
```

## Testing Native App

For iOS/Android testing (after web version works):
```bash
npx expo start
# Then scan QR code with Expo Go app
```