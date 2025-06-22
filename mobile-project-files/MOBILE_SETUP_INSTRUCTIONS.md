# TaskScout Mobile App Setup

## Create New Replit Project for Mobile App

### Step 1: Create New Replit
1. Go to your Replit dashboard
2. Click "Create Repl"
3. Choose "React Native" template
4. Name it "TaskScout Mobile"

### Step 2: Copy These Files
Copy all files from the `mobile-project-files/` folder in this project to your new mobile Replit:

**Root files:**
- `package.json`
- `app.json` 
- `App.tsx`

**Source files (create src/ folder structure):**
- `src/contexts/AuthContext.tsx`
- `src/screens/LoginScreen.tsx`
- `src/screens/DashboardScreen.tsx`
- `src/screens/TicketListScreen.tsx`
- `src/screens/CreateTicketScreen.tsx`

### Step 3: Update API Configuration
In the new mobile project, update these files to point to your current web app URL:

1. **src/contexts/AuthContext.tsx** - line 18:
```typescript
const API_BASE_URL = 'https://your-current-replit-url.replit.app';
```

2. **src/screens/TicketListScreen.tsx** - line 12:
```typescript
const API_BASE_URL = 'https://your-current-replit-url.replit.app';
```

3. **src/screens/CreateTicketScreen.tsx** - line 13:
```typescript
const API_BASE_URL = 'https://your-current-replit-url.replit.app';
```

### Step 4: Install and Run
In your new mobile Replit:
```bash
npm install
npm start
```

### Step 5: Test on Device
1. Install "Expo Go" app on your phone
2. Scan QR code from mobile Replit terminal
3. Login with demo credentials:
   - root@mail.com / admin
   - admin@vendor.vendor / password

The mobile app will now connect to your existing TaskScout backend and share the same database.