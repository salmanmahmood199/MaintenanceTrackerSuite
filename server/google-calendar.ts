import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import type { GoogleCalendarIntegration, CalendarEvent } from '../shared/schema';

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: any;

  constructor() {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      (process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/api/auth/google/callback`
        : process.env.REPL_SLUG && process.env.REPL_OWNER 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/auth/google/callback`
        : 'http://localhost:5000/api/auth/google/callback');
    
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Generate OAuth2 URL for user authentication
  generateAuthUrl(userId: number): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId.toString(),
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  // Set credentials for API calls
  setCredentials(integration: GoogleCalendarIntegration) {
    this.oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: integration.tokenExpiresAt.getTime()
    });
  }

  // Refresh access token if expired
  async refreshToken(integration: GoogleCalendarIntegration) {
    this.setCredentials(integration);
    
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return {
        accessToken: credentials.access_token!,
        tokenExpiresAt: new Date(credentials.expiry_date!)
      };
    } catch (error) {
      console.error('Failed to refresh Google Calendar token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  // Get user's profile information
  async getUserInfo(integration: GoogleCalendarIntegration) {
    this.setCredentials(integration);
    
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const response = await oauth2.userinfo.get();
      return response.data;
    } catch (error) {
      console.error('Failed to get Google user info:', error);
      throw new Error('Failed to get user information');
    }
  }

  // Get user's primary calendar info
  async getCalendarInfo(integration: GoogleCalendarIntegration) {
    this.setCredentials(integration);
    
    try {
      const response = await this.calendar.calendars.get({
        calendarId: 'primary'
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get calendar info:', error);
      throw new Error('Failed to get calendar information');
    }
  }

  // Create event in Google Calendar
  async createEvent(integration: GoogleCalendarIntegration, event: CalendarEvent) {
    this.setCredentials(integration);
    
    try {
      const googleEvent = {
        summary: event.title,
        description: event.description || '',
        start: {
          dateTime: event.startDate + 'T' + (event.startTime || '00:00:00'),
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: event.endDate + 'T' + (event.endTime || '23:59:59'),
          timeZone: 'America/New_York'
        },
        location: event.location || '',
        colorId: this.getColorIdFromHex(event.color || '#3B82F6')
      };

      const response = await this.calendar.events.insert({
        calendarId: integration.calendarId,
        resource: googleEvent
      });

      return response.data.id;
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      throw new Error('Failed to create event in Google Calendar');
    }
  }

  // Update event in Google Calendar
  async updateEvent(integration: GoogleCalendarIntegration, event: CalendarEvent) {
    if (!event.googleEventId) {
      throw new Error('Event has no Google Calendar ID');
    }

    this.setCredentials(integration);
    
    try {
      const googleEvent = {
        summary: event.title,
        description: event.description || '',
        start: {
          dateTime: event.startDate + 'T' + (event.startTime || '00:00:00'),
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: event.endDate + 'T' + (event.endTime || '23:59:59'),
          timeZone: 'America/New_York'
        },
        location: event.location || '',
        colorId: this.getColorIdFromHex(event.color || '#3B82F6')
      };

      await this.calendar.events.update({
        calendarId: integration.calendarId,
        eventId: event.googleEventId,
        resource: googleEvent
      });

      return true;
    } catch (error) {
      console.error('Failed to update Google Calendar event:', error);
      throw new Error('Failed to update event in Google Calendar');
    }
  }

  // Delete event from Google Calendar
  async deleteEvent(integration: GoogleCalendarIntegration, googleEventId: string) {
    this.setCredentials(integration);
    
    try {
      await this.calendar.events.delete({
        calendarId: integration.calendarId,
        eventId: googleEventId
      });

      return true;
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error);
      throw new Error('Failed to delete event from Google Calendar');
    }
  }

  // Sync events from Google Calendar to local calendar
  async syncFromGoogle(integration: GoogleCalendarIntegration, lastSyncAt?: Date) {
    this.setCredentials(integration);
    
    try {
      const now = new Date();
      // Fetch events from 7 days ago to 1 year in the future
      const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const timeMax = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      
      console.log('Current time:', now.toISOString());
      console.log('Searching events from:', timeMin.toISOString());
      console.log('Searching events to:', timeMax.toISOString());
      
      const params: any = {
        calendarId: integration.calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500 // Increased to get more events
      };

      console.log(`Syncing Google Calendar events from ${timeMin.toISOString()} to ${timeMax.toISOString()}`);
      
      const response = await this.calendar.events.list(params);
      const events = response.data.items || [];
      console.log(`Found ${events.length} Google Calendar events to sync`);
      
      // Log each event for debugging
      events.forEach(event => {
        const startTime = event.start?.date || event.start?.dateTime;
        console.log(`Google Event: "${event.summary}" on ${startTime} (Status: ${event.status})`);
      });
      
      return events;
    } catch (error) {
      console.error('Failed to sync from Google Calendar:', error);
      throw new Error('Failed to sync events from Google Calendar');
    }
  }

  // Get user's email from Google
  async getUserInfo(integration: GoogleCalendarIntegration) {
    this.setCredentials(integration);
    
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const response = await oauth2.userinfo.get();
      return response.data;
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw new Error('Failed to get user information');
    }
  }

  // Helper function to convert hex color to Google Calendar color ID
  private getColorIdFromHex(hexColor: string): string {
    const colorMap: { [key: string]: string } = {
      '#3B82F6': '1', // Blue
      '#EF4444': '11', // Red
      '#10B981': '2', // Green
      '#F59E0B': '5', // Yellow
      '#8B5CF6': '3', // Purple
      '#F97316': '6', // Orange
      '#06B6D4': '7', // Cyan
      '#84CC16': '10' // Lime
    };

    return colorMap[hexColor] || '1'; // Default to blue
  }
}

export const googleCalendarService = new GoogleCalendarService();