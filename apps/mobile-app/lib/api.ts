import axios from 'axios';

// Get API URL from environment or use default
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  
  // For local development, use the main Replit URL
  if (process.env.NODE_ENV === "development") {
    // Use the main Replit domain which should serve both frontend and backend
    return 'https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev';
  }
  
  // Use the Replit backend URL for production
  return 'https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev';
};

const API_BASE_URL = getApiUrl();

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add debugging and better error handling
api.interceptors.request.use(
  async (config) => {
    console.log(`Making API request to: ${config.baseURL}${config.url}`);
    // For now, remove auth complexity and focus on basic connectivity
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.error('Network connectivity issue - check if backend is running on', API_BASE_URL);
    }
    
    return Promise.reject(error);
  }
);

export default api;
