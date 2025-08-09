# Mobile App Troubleshooting Guide

## Network Request Failed Issues

If you encounter "Network request failed" errors, here are the steps to resolve them:

### 1. Check API URL Configuration

Ensure your `.env` file contains the correct Replit URL:
```
EXPO_PUBLIC_API_URL=https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev
```

### 2. Verify Backend is Running

Test your Replit backend by visiting the URL in a browser. You should see the TaskScout landing page.

### 3. Test API Endpoints

You can test API connectivity with this simple Node.js script:

```javascript
// test-api.js
const testLogin = async () => {
  const response = await fetch('https://your-replit-url.replit.dev/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email: 'root@mail.com', password: 'admin' })
  });
  console.log('Status:', response.status);
  console.log('Response:', await response.json());
};
testLogin();
```

### 4. Check Network Security Settings

The app.json includes network security configurations for both iOS and Android:

- iOS: NSAppTransportSecurity settings for replit.dev domain
- Android: usesCleartextTraffic set to false (HTTPS only)

### 5. Authentication Issues

If authentication fails after login:

1. Check that cookies are being set properly
2. Verify AsyncStorage is working
3. Ensure CORS is configured on the backend
4. Check that the backend accepts credentials from mobile apps

### 6. Common Solutions

1. **Restart the mobile app** after configuration changes
2. **Clear app data** if authentication state is corrupted
3. **Check Replit logs** for backend errors
4. **Verify network connectivity** on the mobile device

### 7. Backend CORS Configuration

Ensure your Replit backend has proper CORS settings:

```javascript
app.use(cors({
  origin: true, // or specify allowed origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Environment Setup

### Development
- Uses hardcoded Replit URL as fallback
- Includes debugging and error logging
- AsyncStorage for token persistence

### Production
- Uses environment variables
- Optimized error handling
- Secure token storage

## Key Files Modified

1. `src/services/api.ts` - API configuration and request handling
2. `src/contexts/AuthContext.tsx` - Authentication state management
3. `app.json` - Network security configuration
4. `app/create-ticket.tsx` - Fixed hardcoded URLs
5. `.env` - Environment configuration

## Testing Checklist

- [ ] Login works without 403 errors
- [ ] Authentication persists after app restart
- [ ] API calls work (tickets, locations, etc.)
- [ ] Ticket creation works
- [ ] Image upload works
- [ ] Logout clears session properly
