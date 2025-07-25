# Google Calendar Integration Setup Guide

## Project Owner One-Time Setup

This setup only needs to be done once by the TaskScout project owner. After completion, ALL users across ALL organizations can connect their personal Google Calendars (root admins, org admins, sub-admins, vendors, technicians, etc.).

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "New Project"
3. Name it "TaskScout Calendar Integration"
4. Note your Project ID

### Step 2: Enable Google Calendar API

1. Go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click and press "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (since this is a personal project)
3. Fill required fields:
   - App name: "TaskScout Calendar Integration"
   - User support email: Your email address
   - Developer contact: Your email address
4. Under "Scopes", click "Add or Remove Scopes" and add:
   - `../auth/calendar` (See, edit, share, and permanently delete all calendars)
   - `../auth/calendar.events` (View and edit events on all calendars)
   - `../auth/userinfo.email` (See your primary Google Account email address)
5. **Important for Testing**: Under "Test users", add your own email address
6. Save and continue through all steps
7. **Note**: For testing, your app will remain in "Testing" status, which is fine

### Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Name: "TaskScout Calendar Client"
5. Add Authorized redirect URIs:
   - Check the server console logs when you click "Connect Google Calendar" to see the exact URI
   - It will look like: `https://xxxx-xxxx.picard.replit.dev/api/auth/google/callback`
   - `http://localhost:5000/api/auth/google/callback` (for development)
   
   **Important**: Use the exact URI shown in your server logs - Replit domains change dynamically
6. Copy the Client ID and Client Secret

### Step 5: Add Environment Variables

Add these to your Replit Secrets or .env file:

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://your-repl-url.replit.app/api/auth/google/callback
```

### Step 6: Restart Application

Restart your Replit application to load the new environment variables.

## User Experience (All User Types)

After the project owner completes the setup, ANY user can connect:

**Who can connect:**
- Root administrators
- Organization admins and sub-admins
- Maintenance vendor admins
- Technicians
- Any user in any organization

**How they connect:**
1. Go to the Calendar page
2. Click "Connect Google Calendar" 
3. Authenticate with their personal Google account in popup
4. Their personal calendar events automatically sync
5. Each user manages their own connection independently

## Troubleshooting

- **"OAuth error"**: Check redirect URIs match exactly
- **"Access blocked - App not verified"**: Add your email to "Test users" in OAuth consent screen
- **"API not enabled"**: Ensure Google Calendar API is enabled
- **"Invalid credentials"**: Verify environment variables are set correctly
- **"redirect_uri_mismatch"**: Ensure exact redirect URI is added to OAuth credentials

### For Testing Phase
While your app is in "Testing" status:
1. Only users added to "Test users" list can authenticate
2. Add your email and any other test users to the Test users section
3. The app will work perfectly for testing without full Google verification

## Security Notes

- Each user's Google account credentials are stored securely
- Only calendar read access is requested
- Users can disconnect their calendars at any time
- No data is shared between users' Google accounts