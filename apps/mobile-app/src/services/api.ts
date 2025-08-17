// Simple token storage for mobile authentication
let authToken: string | null = null;

export const tokenStorage = {
  setToken: (token: string) => { authToken = token; },
  getToken: () => authToken,
  removeToken: () => { authToken = null; },
};

// API configuration and utilities
// Get the API URL from environment or use defaults
const getApiUrl = () => {
  // Use environment variable if available (for different environments)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Check if running in Expo development mode
  if (__DEV__ && process.env.NODE_ENV === "development") {
    // For local Expo development, use local network IP
    // You may need to update this IP to match your local machine's IP
    return "http://192.168.1.153:5000";
  }
  
  // For production or Replit deployment
  if (process.env.NODE_ENV === "development") {
    return "https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev";
  }
  
  return "https://taskscout.ai";
};

const API_BASE_URL = getApiUrl();

export interface ApiError extends Error {
  status?: number;
  data?: any;
}

export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  endpoint: string,
  data?: any,
  options?: RequestInit,
): Promise<Response> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  // Get JWT token from token storage for mobile authentication
  const token = tokenStorage.getToken();

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      // Add JWT token to Authorization header if available
      ...(token && { "Authorization": `Bearer ${token}` }),
      ...options?.headers,
    },
    // Use 'include' for cookie-based auth with Replit (fallback)
    credentials: "include",
    ...options,
  };
  
  console.log('API Request - URL:', url);
  console.log('API Request - Method:', method);
  console.log('API Request - Headers:', JSON.stringify(config.headers, null, 2));

  // Handle FormData (for file uploads)
  if (data instanceof FormData) {
    // Remove Content-Type header to let browser set boundary for FormData
    const headers = config.headers as Record<string, string>;
    delete headers["Content-Type"];
    config.body = data;
  } else if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);

    // Handle common HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.message || `HTTP ${response.status}`,
      ) as ApiError;
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`API request failed: ${method} ${url}`, error.message);
      // Check if it's a network error
      if (error.message.includes('Network request failed')) {
        console.error('Network error - check if backend is accessible:', url);
      }
      throw error;
    }
    throw new Error("Unknown API error");
  }
}

// Specific API functions
export const ticketsApi = {
  getAll: async (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : "";
    const response = await apiRequest("GET", `/api/tickets${queryString}`);
    return response.json();
  },
  getById: async (id: number) => {
    const response = await apiRequest("GET", `/api/tickets/${id}`);
    return response.json();
  },
  getTicketDetails: async (id: string) => {
    const response = await apiRequest("GET", `/api/tickets/${id}/details`);
    return response.json();
  },
  getTicketComments: async (id: string) => {
    const response = await apiRequest("GET", `/api/tickets/${id}/comments`);
    return response.json();
  },
  getTicketWorkOrders: async (id: string) => {
    const response = await apiRequest("GET", `/api/tickets/${id}/work-orders`);
    return response.json();
  },
  create: async (data: any) => {
    const response = await apiRequest("POST", "/api/tickets", data);
    return response; // Return the Response object, not the parsed JSON
  },
  update: async (id: number, data: any) => {
    const response = await apiRequest("PATCH", `/api/tickets/${id}`, data);
    return response.json();
  },
  delete: async (id: number) => {
    const response = await apiRequest("DELETE", `/api/tickets/${id}`);
    return response.json();
  },
  updateStatus: async (id: number, status: string, data?: any) => {
    const response = await apiRequest("PATCH", `/api/tickets/${id}/status`, { status, ...data });
    return response.json();
  },
  addComment: async (id: number, data: any) => {
    const response = await apiRequest("POST", `/api/tickets/${id}/comments`, data);
    return response.json();
  },
  getComments: async (id: number) => {
    const response = await apiRequest("GET", `/api/tickets/${id}/comments`);
    return response.json();
  },
  uploadImage: async (id: number, formData: FormData) => {
    const response = await apiRequest("POST", `/api/tickets/${id}/images`, formData);
    return response.json();
  },
  assignVendor: async (id: number, vendorId: number) => {
    const response = await apiRequest("POST", `/api/tickets/${id}/assign`, { vendorId });
    return response.json();
  },
  accept: async (id: number) => {
    const response = await apiRequest("POST", `/api/tickets/${id}/accept`);
    return response.json();
  },
  reject: async (id: number, reason?: string) => {
    const response = await apiRequest("POST", `/api/tickets/${id}/reject`, { reason });
    return response.json();
  },
  complete: async (id: number, data?: any) => {
    const response = await apiRequest("POST", `/api/tickets/${id}/complete`, data);
    return response.json();
  },
  getProgress: async (id: number) => {
    const response = await apiRequest("GET", `/api/tickets/${id}/progress`);
    return response.json();
  },
  updateProgress: async (id: number, data: any) => {
    const response = await apiRequest("POST", `/api/tickets/${id}/progress`, data);
    return response.json();
  },
  getWorkOrders: async (id: number) => {
    const response = await apiRequest("GET", `/api/tickets/${id}/work-orders`);
    return response.json();
  },
  createWorkOrder: async (id: number, data: any) => {
    const response = await apiRequest("POST", `/api/tickets/${id}/work-orders`, data);
    return response.json();
  },
};

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest("POST", "/api/auth/login", { email, password }),
  logout: () => apiRequest("POST", "/api/auth/logout"),
  getUser: () => apiRequest("GET", "/api/auth/user"),
  register: (data: any) =>
    apiRequest("POST", "/api/auth/register/residential", data),
};

export const organizationsApi = {
  getAll: () => apiRequest("GET", "/api/organizations"),
  getById: (id: number) => apiRequest("GET", `/api/organizations/${id}`),
  create: (data: any) => apiRequest("POST", "/api/organizations", data),
  update: (id: number, data: any) =>
    apiRequest("PATCH", `/api/organizations/${id}`, data),
  delete: (id: number) => apiRequest("DELETE", `/api/organizations/${id}`),
  getSubAdmins: (id: number) =>
    apiRequest("GET", `/api/organizations/${id}/sub-admins`),
  createSubAdmin: (id: number, data: any) =>
    apiRequest("POST", `/api/organizations/${id}/sub-admins`, data),
};

export const vendorsApi = {
  getAll: () => apiRequest("GET", "/api/maintenance-vendors"),
  getById: (id: number) => apiRequest("GET", `/api/maintenance-vendors/${id}`),
  create: (data: any) => apiRequest("POST", "/api/maintenance-vendors", data),
  update: (id: number, data: any) =>
    apiRequest("PATCH", `/api/maintenance-vendors/${id}`, data),
  delete: (id: number) =>
    apiRequest("DELETE", `/api/maintenance-vendors/${id}`),
  getTechnicians: (id: number) =>
    apiRequest("GET", `/api/maintenance-vendors/${id}/technicians`),
  createTechnician: (id: number, data: any) =>
    apiRequest("POST", `/api/maintenance-vendors/${id}/technicians`, data),
};

export const calendarApi = {
  getEvents: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString();
    return apiRequest(
      "GET",
      `/api/calendar/events${queryString ? `?${queryString}` : ""}`,
    );
  },
  getEvent: (id: number) => apiRequest("GET", `/api/calendar/events/${id}`),
  createEvent: (data: any) => apiRequest("POST", "/api/calendar/events", data),
  updateEvent: (id: number, data: any) =>
    apiRequest("PATCH", `/api/calendar/events/${id}`, data),
  deleteEvent: (id: number) =>
    apiRequest("DELETE", `/api/calendar/events/${id}`),
};

export const locationsApi = {
  getAll: (organizationId?: number) => {
    const params = organizationId ? `?organizationId=${organizationId}` : "";
    return apiRequest("GET", `/api/locations${params}`);
  },
  getById: (id: number) => apiRequest("GET", `/api/locations/${id}`),
  create: (data: any) => apiRequest("POST", "/api/locations", data),
  update: (id: number, data: any) =>
    apiRequest("PATCH", `/api/locations/${id}`, data),
  delete: (id: number) => apiRequest("DELETE", `/api/locations/${id}`),
  getUserLocations: (userId: number) =>
    apiRequest("GET", `/api/users/${userId}/locations`),
};

export const invoicesApi = {
  getAll: (vendorId?: number) => {
    const params = vendorId ? `?vendorId=${vendorId}` : "";
    return apiRequest("GET", `/api/invoices${params}`);
  },
  getById: (id: number) => apiRequest("GET", `/api/invoices/${id}`),
  create: (data: any) => apiRequest("POST", "/api/invoices", data),
  update: (id: number, data: any) =>
    apiRequest("PATCH", `/api/invoices/${id}`, data),
  delete: (id: number) => apiRequest("DELETE", `/api/invoices/${id}`),
  updatePayment: (id: number, data: any) =>
    apiRequest("PATCH", `/api/invoices/${id}/payment`, data),
};

export const marketplaceApi = {
  getTickets: () => apiRequest("GET", "/api/marketplace/tickets"),
  getBids: (ticketId: number) =>
    apiRequest("GET", `/api/marketplace/tickets/${ticketId}/bids`),
  createBid: (ticketId: number, data: any) =>
    apiRequest("POST", `/api/marketplace/tickets/${ticketId}/bids`, data),
  updateBid: (bidId: number, data: any) =>
    apiRequest("PATCH", `/api/marketplace/bids/${bidId}`, data),
  acceptBid: (bidId: number) =>
    apiRequest("POST", `/api/marketplace/bids/${bidId}/accept`),
  rejectBid: (bidId: number, data: any) =>
    apiRequest("POST", `/api/marketplace/bids/${bidId}/reject`, data),
  getVendorBids: () => apiRequest("GET", "/api/marketplace/vendor-bids"),
};
