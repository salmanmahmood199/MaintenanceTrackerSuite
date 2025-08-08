// API configuration and utilities
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000' 
  : 'https://your-production-url.com';

export interface ApiError extends Error {
  status?: number;
  data?: any;
}

export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Include cookies for session management
    ...options,
  };

  // Handle FormData (for file uploads)
  if (data instanceof FormData) {
    // Remove Content-Type header to let browser set boundary for FormData
    delete config.headers?.['Content-Type'];
    config.body = data;
  } else if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    
    // Handle common HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}`) as ApiError;
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`API request failed: ${method} ${endpoint}`, error);
      throw error;
    }
    throw new Error('Unknown API error');
  }
}

// Specific API functions
export const ticketsApi = {
  getAll: () => apiRequest('GET', '/api/tickets'),
  getById: (id: number) => apiRequest('GET', `/api/tickets/${id}`),
  create: (data: FormData) => apiRequest('POST', '/api/tickets', data),
  update: (id: number, data: any) => apiRequest('PATCH', `/api/tickets/${id}`, data),
  delete: (id: number) => apiRequest('DELETE', `/api/tickets/${id}`),
  accept: (id: number, data: any) => apiRequest('POST', `/api/tickets/${id}/accept`, data),
  reject: (id: number, data: any) => apiRequest('POST', `/api/tickets/${id}/reject`, data),
  complete: (id: number, data: any) => apiRequest('POST', `/api/tickets/${id}/complete`, data),
  confirm: (id: number, data: any) => apiRequest('POST', `/api/tickets/${id}/confirm`, data),
  getComments: (id: number) => apiRequest('GET', `/api/tickets/${id}/comments`),
  addComment: (id: number, data: any) => apiRequest('POST', `/api/tickets/${id}/comments`, data),
  getWorkOrders: (id: number) => apiRequest('GET', `/api/tickets/${id}/work-orders`),
  createWorkOrder: (id: number, data: FormData) => apiRequest('POST', `/api/tickets/${id}/work-orders`, data),
};

export const authApi = {
  login: (email: string, password: string) => 
    apiRequest('POST', '/api/auth/login', { email, password }),
  logout: () => apiRequest('POST', '/api/auth/logout'),
  getUser: () => apiRequest('GET', '/api/auth/user'),
  register: (data: any) => apiRequest('POST', '/api/auth/register/residential', data),
};

export const organizationsApi = {
  getAll: () => apiRequest('GET', '/api/organizations'),
  getById: (id: number) => apiRequest('GET', `/api/organizations/${id}`),
  create: (data: any) => apiRequest('POST', '/api/organizations', data),
  update: (id: number, data: any) => apiRequest('PATCH', `/api/organizations/${id}`, data),
  delete: (id: number) => apiRequest('DELETE', `/api/organizations/${id}`),
  getSubAdmins: (id: number) => apiRequest('GET', `/api/organizations/${id}/sub-admins`),
  createSubAdmin: (id: number, data: any) => apiRequest('POST', `/api/organizations/${id}/sub-admins`, data),
};

export const vendorsApi = {
  getAll: () => apiRequest('GET', '/api/maintenance-vendors'),
  getById: (id: number) => apiRequest('GET', `/api/maintenance-vendors/${id}`),
  create: (data: any) => apiRequest('POST', '/api/maintenance-vendors', data),
  update: (id: number, data: any) => apiRequest('PATCH', `/api/maintenance-vendors/${id}`, data),
  delete: (id: number) => apiRequest('DELETE', `/api/maintenance-vendors/${id}`),
  getTechnicians: (id: number) => apiRequest('GET', `/api/maintenance-vendors/${id}/technicians`),
  createTechnician: (id: number, data: any) => apiRequest('POST', `/api/maintenance-vendors/${id}/technicians`, data),
};

export const calendarApi = {
  getEvents: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    return apiRequest('GET', `/api/calendar/events${queryString ? `?${queryString}` : ''}`);
  },
  getEvent: (id: number) => apiRequest('GET', `/api/calendar/events/${id}`),
  createEvent: (data: any) => apiRequest('POST', '/api/calendar/events', data),
  updateEvent: (id: number, data: any) => apiRequest('PATCH', `/api/calendar/events/${id}`, data),
  deleteEvent: (id: number) => apiRequest('DELETE', `/api/calendar/events/${id}`),
};

export const locationsApi = {
  getAll: (organizationId?: number) => {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    return apiRequest('GET', `/api/locations${params}`);
  },
  getById: (id: number) => apiRequest('GET', `/api/locations/${id}`),
  create: (data: any) => apiRequest('POST', '/api/locations', data),
  update: (id: number, data: any) => apiRequest('PATCH', `/api/locations/${id}`, data),
  delete: (id: number) => apiRequest('DELETE', `/api/locations/${id}`),
  getUserLocations: (userId: number) => apiRequest('GET', `/api/users/${userId}/locations`),
};

export const invoicesApi = {
  getAll: (vendorId?: number) => {
    const params = vendorId ? `?vendorId=${vendorId}` : '';
    return apiRequest('GET', `/api/invoices${params}`);
  },
  getById: (id: number) => apiRequest('GET', `/api/invoices/${id}`),
  create: (data: any) => apiRequest('POST', '/api/invoices', data),
  update: (id: number, data: any) => apiRequest('PATCH', `/api/invoices/${id}`, data),
  delete: (id: number) => apiRequest('DELETE', `/api/invoices/${id}`),
  updatePayment: (id: number, data: any) => apiRequest('PATCH', `/api/invoices/${id}/payment`, data),
};

export const marketplaceApi = {
  getTickets: () => apiRequest('GET', '/api/marketplace/tickets'),
  getBids: (ticketId: number) => apiRequest('GET', `/api/marketplace/tickets/${ticketId}/bids`),
  createBid: (ticketId: number, data: any) => apiRequest('POST', `/api/marketplace/tickets/${ticketId}/bids`, data),
  updateBid: (bidId: number, data: any) => apiRequest('PATCH', `/api/marketplace/bids/${bidId}`, data),
  acceptBid: (bidId: number) => apiRequest('POST', `/api/marketplace/bids/${bidId}/accept`),
  rejectBid: (bidId: number, data: any) => apiRequest('POST', `/api/marketplace/bids/${bidId}/reject`, data),
  getVendorBids: () => apiRequest('GET', '/api/marketplace/vendor-bids'),
};