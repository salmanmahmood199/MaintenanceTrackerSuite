# Create TaskScout Mobile App as New Replit Project

## Step 1: Create New Replit Project
1. Go to your Replit dashboard
2. Click "Create Repl"
3. Choose "React Native" template
4. Name it "TaskScout Mobile"

## Step 2: Replace Default Files
Copy these files from the current project to your new mobile Replit:

### Root Files
- `../taskscout-mobile/package.json`
- `../taskscout-mobile/app.json`
- `../taskscout-mobile/App.tsx`
- `../taskscout-mobile/README.md`

### Source Files
- `../taskscout-mobile/src/contexts/AuthContext.tsx`
- `../taskscout-mobile/src/services/api.ts`
- `../taskscout-mobile/src/screens/LoginScreen.tsx`
- `../taskscout-mobile/src/screens/DashboardScreen.tsx`
- `../taskscout-mobile/src/screens/TicketListScreen.tsx`
- `../taskscout-mobile/src/screens/CreateTicketScreen.tsx`

## Step 3: Configure API
Update `src/services/api.ts` with your current Replit app URL:
```typescript
const API_BASE_URL = 'https://your-current-replit-app.replit.app';
```

## Step 4: Install Dependencies
In the new mobile Replit, run:
```bash
npm install
```

## Step 5: Start Development
```bash
npm start
```

This will create a completely separate mobile app project in your Replit dashboard that connects to your current backend.