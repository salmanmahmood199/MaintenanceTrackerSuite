import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Get current Replit app URL
const getApiUrl = () => {
  if (__DEV__) {
    // Development - use localhost for web compatibility and session cookies
    return 'http://localhost:5000';
  }
  // Production - use current Replit URL
  return Constants.expoConfig?.extra?.apiUrl || 'https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picar.replit.dev';
};

const API_BASE_URL = getApiUrl();

export class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await SecureStore.getItemAsync('sessionToken');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    return response;
  }

  async get(endpoint: string) {
    return this.makeRequest(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data: any) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.makeRequest(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();