import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ExternalLink, Info, Settings } from "lucide-react";

interface GoogleOAuthHelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleOAuthHelpModal({ open, onOpenChange }: GoogleOAuthHelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            Google Calendar OAuth Setup Guide
          </DialogTitle>
          <DialogDescription>
            Follow these steps to set up Google Calendar integration for your organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Prerequisites */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Administrator Required:</strong> This setup requires Google Workspace admin privileges 
              or access to Google Cloud Console.
            </AlertDescription>
          </Alert>

          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">1</Badge>
              <h3 className="font-semibold">Create Google Cloud Project</h3>
            </div>
            <div className="ml-10 space-y-2">
              <p className="text-sm text-muted-foreground">
                Create a new project in Google Cloud Console to manage your OAuth credentials.
              </p>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center">Google Cloud Console <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li>2. Click "New Project" and give it a name like "TaskScout Calendar Integration"</li>
                <li>3. Note your Project ID for later reference</li>
              </ol>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">2</Badge>
              <h3 className="font-semibold">Enable Google Calendar API</h3>
            </div>
            <div className="ml-10 space-y-2">
              <p className="text-sm text-muted-foreground">
                Enable the Google Calendar API for your project.
              </p>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. In your Google Cloud Console, go to "APIs & Services" → "Library"</li>
                <li>2. Search for "Google Calendar API"</li>
                <li>3. Click on it and press "Enable"</li>
              </ol>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">3</Badge>
              <h3 className="font-semibold">Configure OAuth Consent Screen</h3>
            </div>
            <div className="ml-10 space-y-2">
              <p className="text-sm text-muted-foreground">
                Set up the OAuth consent screen that users will see during authentication.
              </p>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Go to "APIs & Services" → "OAuth consent screen"</li>
                <li>2. Choose "Internal" if using Google Workspace, or "External" for general use</li>
                <li>3. Fill in required fields:</li>
                <li className="ml-4">• App name: "TaskScout Calendar Integration"</li>
                <li className="ml-4">• User support email: Your organization email</li>
                <li className="ml-4">• Developer contact: Your IT team email</li>
                <li>4. Add scopes: Select "Google Calendar API" scopes</li>
                <li>5. Save and continue through all steps</li>
              </ol>
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">4</Badge>
              <h3 className="font-semibold">Create OAuth Credentials</h3>
            </div>
            <div className="ml-10 space-y-2">
              <p className="text-sm text-muted-foreground">
                Create the OAuth 2.0 credentials needed for calendar integration.
              </p>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Go to "APIs & Services" → "Credentials"</li>
                <li>2. Click "Create Credentials" → "OAuth 2.0 Client IDs"</li>
                <li>3. Choose "Web application" as the application type</li>
                <li>4. Set the name to "TaskScout Calendar Client"</li>
                <li>5. Add Authorized redirect URIs:</li>
                <li className="ml-4 font-mono text-xs bg-muted p-1 rounded">
                  {window.location.origin}/api/auth/google/callback
                </li>
                <li>6. Click "Create" and copy the Client ID and Client Secret</li>
              </ol>
            </div>
          </div>

          {/* Step 5 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">5</Badge>
              <h3 className="font-semibold">Configure Environment Variables</h3>
            </div>
            <div className="ml-10 space-y-2">
              <p className="text-sm text-muted-foreground">
                Add your Google OAuth credentials to the application environment.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Add these environment variables:</p>
                <div className="bg-muted p-3 rounded font-mono text-xs space-y-1">
                  <div>GOOGLE_CLIENT_ID=your_client_id_here</div>
                  <div>GOOGLE_CLIENT_SECRET=your_client_secret_here</div>
                  <div>GOOGLE_REDIRECT_URI={window.location.origin}/api/auth/google/callback</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 6 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">6</Badge>
              <h3 className="font-semibold">Test Integration</h3>
            </div>
            <div className="ml-10 space-y-2">
              <p className="text-sm text-muted-foreground">
                Verify that the Google Calendar integration is working correctly.
              </p>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Restart the application to load new environment variables</li>
                <li>2. Click "Connect Google Calendar" in the integration panel</li>
                <li>3. Complete the OAuth flow in the popup window</li>
                <li>4. Verify the connection shows as "Connected"</li>
                <li>5. Test manual sync to import Google Calendar events</li>
              </ol>
            </div>
          </div>

          {/* Success indicator */}
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Success!</strong> Once configured, users will be able to sync their Google Calendar 
              events with the internal calendar system, providing a unified view of all scheduled activities.
            </AlertDescription>
          </Alert>

          {/* Support note */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Need Help?</strong> If you encounter issues during setup, ensure that:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
              <li>• The Google Calendar API is enabled for your project</li>
              <li>• The OAuth consent screen is properly configured</li>
              <li>• The redirect URI exactly matches your application URL</li>
              <li>• Environment variables are correctly set and the app is restarted</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}