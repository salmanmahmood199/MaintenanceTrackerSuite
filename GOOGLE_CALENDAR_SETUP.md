# Google Calendar Integration Setup Guide

## Administrator One-Time Setup

This setup only needs to be done once by the system administrator. After completion, all users can connect their personal Google Calendars.

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
2. Choose "Internal" (for Google Workspace) or "External"
3. Fill required fields:
   - App name: "TaskScout Calendar Integration"
   - User support email: Your organization email
   - Developer contact: Your IT team email
4. Add scopes: Select Google Calendar API scopes
5. Save and continue through all steps

### Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Name: "TaskScout Calendar Client"
5. Add Authorized redirect URIs:
   - `https://your-repl-url.replit.app/api/auth/google/callback`
   - `http://localhost:5000/api/auth/google/callback` (for development)
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

## User Experience

After the administrator completes the setup:

1. Users go to the Calendar page
2. Click "Connect Google Calendar" 
3. Authenticate with their Google account in popup
4. Their calendar events automatically sync
5. Users can enable/disable sync and manually refresh as needed

## Troubleshooting

- **"OAuth error"**: Check redirect URIs match exactly
- **"Access blocked"**: Verify OAuth consent screen is configured
- **"API not enabled"**: Ensure Google Calendar API is enabled
- **"Invalid credentials"**: Verify environment variables are set correctly

## Security Notes

- Each user's Google account credentials are stored securely
- Only calendar read access is requested
- Users can disconnect their calendars at any time
- No data is shared between users' Google accounts