import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, RefreshCw, Settings, Check, X, Globe, Bug } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface GoogleCalendarStatus {
  connected: boolean;
  email: string | null;
  syncEnabled: boolean;
  lastSyncAt: string | null;
}

interface RecentEvent {
  id: number;
  title: string;
  startDate: string;
  startTime: string | null;
  eventType: string;
  googleEventId: string | null;
  syncedToGoogle: boolean;
}

export function GoogleCalendarIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch Google Calendar integration status
  const { data: status, isLoading } = useQuery<GoogleCalendarStatus>({
    queryKey: ['/api/google-calendar/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent events for debugging
  const { data: recentEvents } = useQuery<RecentEvent[]>({
    queryKey: ['/api/calendar/recent-events'],
    enabled: status?.connected || false,
  });

  // Connect to Google Calendar
  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/google-calendar/auth');
      const { authUrl } = await response.json();
      
      // Open Google auth in new window
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for popup to close (user completed auth)
      return new Promise<void>((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Wait a moment then refresh status
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/status'] });
              resolve();
            }, 1000);
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          popup?.close();
          reject(new Error('Authentication timeout'));
        }, 300000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Google Calendar Connected",
        description: "Your Google Calendar has been successfully connected and sync is enabled.",
      });
      setIsConnecting(false);
    },
    onError: (error) => {
      console.error('Google Calendar connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Calendar. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    },
  });

  // Disconnect from Google Calendar
  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/google-calendar/disconnect'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/status'] });
      toast({
        title: "Google Calendar Disconnected",
        description: "Your Google Calendar has been disconnected.",
      });
    },
    onError: () => {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect Google Calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sync with Google Calendar
  const syncMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/google-calendar/sync'),
    onSuccess: async (response) => {
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      toast({
        title: "Sync Completed",
        description: `Successfully synced ${result.syncedEvents} events from Google Calendar.`,
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync with Google Calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle sync settings
  const toggleSyncMutation = useMutation({
    mutationFn: (syncEnabled: boolean) => 
      apiRequest('PATCH', '/api/google-calendar/sync-settings', { syncEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/status'] });
      toast({
        title: "Sync Settings Updated",
        description: "Google Calendar sync settings have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update sync settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Manual sync specific event to Google Calendar (for debugging)
  const manualSyncMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiRequest('POST', `/api/google-calendar/sync-event/${eventId}`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Event Synced Successfully",
        description: `"${data.eventTitle}" has been synced to Google Calendar.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
    },
    onError: (error) => {
      console.error('Manual sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync event to Google Calendar. Check console for details.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    setIsConnecting(true);
    connectMutation.mutate();
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handleToggleSync = (checked: boolean) => {
    toggleSyncMutation.mutate(checked);
  };

  const handleManualSync = (eventId: number) => {
    manualSyncMutation.mutate(eventId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Google Calendar Integration
          </CardTitle>
          <CardDescription>Loading integration status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-500" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Sync your internal calendar with your Gmail calendar bidirectionally
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Connection Status</span>
              {status?.connected ? (
                <Badge variant="default" className="bg-green-500">
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <X className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
            {status?.connected && status.email && (
              <p className="text-sm text-muted-foreground">
                Connected to: {status.email}
              </p>
            )}
          </div>
          
          {status?.connected ? (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting || connectMutation.isPending}
            >
              {isConnecting || connectMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Connect Google Calendar
            </Button>
          )}
        </div>

        {status?.connected && (
          <>
            <Separator />
            
            {/* Sync Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">Automatic Sync</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync events from Google Calendar
                  </p>
                </div>
                <Switch
                  checked={status.syncEnabled}
                  onCheckedChange={handleToggleSync}
                  disabled={toggleSyncMutation.isPending}
                />
              </div>

              {/* Manual Sync */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span className="font-medium">Manual Sync</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Manually sync events from Google Calendar
                  </p>
                  {status.lastSyncAt && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(status.lastSyncAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncMutation.isPending || !status.syncEnabled}
                >
                  {syncMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync Now
                </Button>
              </div>
            </div>

            <Separator />

            {/* Sync Information */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CalendarDays className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    How Google Calendar Sync Works
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Events from your Google Calendar are imported to your internal calendar</li>
                    <li>• Changes in Google Calendar will be reflected after manual sync</li>
                    <li>• Your internal calendar events remain separate and private</li>
                    <li>• Sync only imports events, it doesn't modify your Google Calendar</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Debug Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="h-4 w-4" />
                <span className="font-medium">Debug Tools</span>
              </div>
              
              <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 p-4 border border-orange-200 dark:border-orange-800">
                <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
                  Manual Event Sync (Test July 30 Event)
                </h4>
                <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                  Recent TaskScout events that may need syncing to Google Calendar:
                </p>
                
                {recentEvents && recentEvents.length > 0 ? (
                  <div className="space-y-2">
                    {recentEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{event.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {event.startDate} {event.startTime || 'All day'} • {event.eventType}
                          </div>
                          <div className="text-xs mt-1">
                            {event.syncedToGoogle ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                ✓ Synced to Google
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                ✗ Not synced
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManualSync(event.id)}
                          disabled={manualSyncMutation.isPending || event.syncedToGoogle}
                        >
                          {manualSyncMutation.isPending ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            'Sync Now'
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent events found.</p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}