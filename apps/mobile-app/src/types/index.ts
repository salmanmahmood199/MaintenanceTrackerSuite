// Shared types for the mobile app
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  organizationId?: number;
  maintenanceVendorId?: number;
  permissions?: string[];
  vendorTiers?: string[];
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  reporterId: number;
  organizationId: number;
  locationId?: number;
  maintenanceVendorId?: number;
  assigneeId?: number;
  images?: string[];
  rejectionReason?: string;
  reporterName?: string;
  assignedTo?: string;
  organizationName?: string;
  locationName?: string;
  locationAddress?: string;
  // Additional fields from API response
  ticketNumber?: string;
  assignedAt?: string | null;
  assignee?: User | null;
  completedAt?: string | null;
  confirmedAt?: string | null;
  confirmationFeedback?: string | null;
  rejectionFeedback?: string | null;
  forceClosedAt?: string | null;
  forceClosedBy?: number | null;
  forceCloseReason?: string | null;
  estimatedStartDate?: string | null;
  estimatedEndDate?: string | null;
  estimatedDuration?: number | null;
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  etaProvidedAt?: string | null;
  etaProvidedBy?: number | null;
  etaNotes?: string | null;
  residentialAddress?: string | null;
  residentialCity?: string | null;
  residentialState?: string | null;
  residentialZip?: string | null;
  // Related objects from API response
  reporter?: User;
  organization?: Organization;
  maintenanceVendor?: MaintenanceVendor | null;
  comments?: TicketComment[];
  workOrders?: WorkOrder[];
}

export interface Organization {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceVendor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  organizationId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  eventType: 'availability' | 'work_assignment' | 'meeting' | 'maintenance' | 'personal';
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  isAllDay: boolean;
  priority: 'low' | 'medium' | 'high';
  status: 'confirmed' | 'tentative' | 'cancelled';
  color: string;
  location?: string;
  isAvailability: boolean;
  isRecurring?: boolean;
  googleEventId?: string;
  syncedToGoogle?: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: number;
  content: string;
  ticketId: number;
  userId: number;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export interface WorkOrder {
  id: number;
  description: string;
  completionStatus: 'completed' | 'return_needed';
  ticketId: number;
  technicianId: number;
  technicianName: string;
  timeIn?: string;
  timeOut?: string;
  parts?: Array<{
    name: string;
    customName?: string;
    quantity: number;
    cost: number;
  }>;
  otherCharges?: Array<{
    description: string;
    cost: number;
  }>;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: number;
  ticketId: number;
  organizationId: number;
  vendorId: number;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentType?: string;
  checkNumber?: string;
}

// Form types for creating/updating entities
export interface CreateTicketInput {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  locationId?: number;
  images: File[];
}

export interface CreateCommentInput {
  content: string;
  ticketId: number;
  images?: File[];
}

export interface CreateWorkOrderInput {
  description: string;
  ticketId: number;
  completionStatus: 'completed' | 'return_needed';
  timeIn?: string;
  timeOut?: string;
  parts?: Array<{
    name: string;
    customName?: string;
    quantity: number;
    cost: number;
  }>;
  otherCharges?: Array<{
    description: string;
    cost: number;
  }>;
  images?: File[];
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}