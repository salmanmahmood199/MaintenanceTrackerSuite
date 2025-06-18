# Maintenance Ticketing System with Hierarchical Authentication

## Overview

This is a full-stack maintenance ticketing application built with React (frontend) and Express.js (backend). The system features a hierarchical user management structure with root administration, organizational management, and maintenance vendor coordination. Users can create, manage, and track maintenance tickets with image attachments, priority levels, and status tracking across different organizational boundaries.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Session-based authentication with role-based access control

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM and Neon Database serverless
- **Authentication**: Session-based auth with bcrypt password hashing
- **File Storage**: Local file system with multer for image uploads
- **Session Management**: Express sessions with PostgreSQL store
- **Validation**: Zod schemas shared between frontend and backend

### Database Schema

#### Hierarchical User System
- **Users Table**: Multi-role user system with organizational and vendor associations
  - Roles: root, org_admin, maintenance_admin, technician
  - Foreign keys to organizations and maintenance vendors
- **Organizations Table**: Client organizations that request maintenance
- **Maintenance Vendors Table**: Service providers with specialties
- **Sessions Table**: Secure session storage for authentication

#### Ticket Management
- **Tickets Table**: Enhanced ticket system with organizational context
  - Fields: title, description, priority, status, organizationId, reporterId, assigneeId, maintenanceVendorId, images
- **Priority Levels**: low, medium, high
- **Status Types**: open, in-progress, completed

### Authentication Hierarchy
```
Root Admin (root@mail.com / admin)
├── Organizations Branch
│   ├── Organization 1
│   │   ├── Organization Admin (auto-created: admin@orgname.org)
│   │   └── Sub-Admins (managed by org admin)
│   └── Organization 2
│       ├── Organization Admin (auto-created: admin@orgname.org)
│       └── Sub-Admins (managed by org admin)
└── Maintenance Vendors Branch
    ├── Vendor 1
    │   ├── Maintenance Admin (auto-created: admin@vendorname.vendor)
    │   └── Technicians (managed by vendor admin)
    └── Vendor 2
        ├── Maintenance Admin (auto-created: admin@vendorname.vendor)
        └── Technicians (managed by vendor admin)
```

### Auto-Generated Admin Accounts
- **Organization Admins**: When a new organization is created, an admin account is automatically generated with email format `admin@{organizationname}.org`
- **Vendor Admins**: When a new vendor is created, an admin account is automatically generated with email format `admin@{vendorname}.vendor`
- **Credentials**: Random passwords are generated and logged to console during creation
- **Permissions**: Organization admins can place and accept tickets, manage sub-admins; Vendor admins can accept tickets and manage technicians

## Key Components

### Authentication Components
- **Login Page**: Secure login form with role-based redirection
- **AuthHook**: Custom React hook for authentication state management
- **Auth Middleware**: Express middleware for session validation and role checking
- **Admin Dashboard**: Root user interface for managing organizations and vendors

### Frontend Components
- **Dashboard**: Main ticket overview with statistics, filtering, and user context
- **CreateTicketModal**: Form for creating new tickets with image upload
- **TicketCard**: Individual ticket display with actions
- **ImageUpload**: Drag-and-drop image upload component with preview
- **AdminDashboard**: Root admin interface for organization and vendor management

### Backend Services
- **Authentication System**: Session-based auth with bcrypt password hashing
- **Database Storage**: PostgreSQL implementation with Drizzle ORM
- **Role-Based Access Control**: Middleware for enforcing user permissions
- **File Upload**: Multer configuration for image handling with size and type validation
- **API Routes**: RESTful endpoints for tickets, organizations, vendors, and authentication

### Shared Resources
- **Schema Definitions**: Drizzle schemas with Zod validation for type safety
- **Type Definitions**: Shared TypeScript interfaces between frontend and backend

## Data Flow

1. **Ticket Creation**: User fills form → Frontend validation → API call with FormData → Backend validation → Database storage → Real-time UI update
2. **Image Upload**: File selection → Preview generation → FormData append → Server storage → Database path reference
3. **Status Updates**: User action → Optimistic UI update → API call → Backend validation → Database update → UI sync
4. **Statistics**: Dashboard load → API call → Database aggregation → Chart/card updates

## External Dependencies

### Development Tools
- **Database**: PostgreSQL (configured in .replit)
- **Cloud Database**: Neon Database serverless PostgreSQL
- **File Processing**: Multer for multipart form handling
- **Validation**: Zod for runtime type checking

### UI Libraries
- **Component System**: Radix UI primitives for accessibility
- **Icons**: Lucide React for consistent iconography
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Date Handling**: date-fns for timestamp formatting

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **File Storage**: Local uploads directory
- **Hot Reload**: Vite dev server with HMR

### Production Build
- **Frontend**: Vite build to dist/public
- **Backend**: ESBuild compilation to dist/
- **Deployment**: Replit autoscale deployment target
- **Environment**: Production NODE_ENV with optimized assets

### Database Migration
- **Schema Management**: Drizzle Kit for schema changes
- **Migration Files**: Generated to ./migrations directory
- **Connection**: Environment variable DATABASE_URL required

## Authentication Credentials

### Root Administrator Access
- **Email**: root@mail.com
- **Password**: admin
- **Permissions**: Full system access, manage organizations and vendors

### User Role Hierarchy
1. **Root Admin**: Complete system administration
2. **Organization Admin**: Manage organization users and tickets
3. **Maintenance Admin**: Manage technicians and vendor operations
4. **Technician**: Handle assigned maintenance tickets

## API Endpoints

### Authentication
- POST `/api/auth/login` - User authentication
- POST `/api/auth/logout` - Session termination
- GET `/api/auth/user` - Current user information

### Admin Management (Root Only)
- GET/POST `/api/organizations` - Organization management
- GET/POST `/api/maintenance-vendors` - Vendor management
- POST `/api/users` - User creation with role validation

### Ticket Operations
- GET/POST `/api/tickets` - Ticket management with organizational context
- POST `/api/tickets/:id/accept` - Assign ticket to technician
- POST `/api/tickets/:id/complete` - Mark ticket as completed

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL with Neon Database serverless connection
- **File Storage**: Local uploads directory
- **Authentication**: Session-based with PostgreSQL session store
- **Hot Reload**: Vite dev server with HMR

### Database Connection
- **Schema Management**: Drizzle Kit for schema changes
- **Migration**: `npm run db:push` for schema synchronization
- **Connection**: Environment variable DATABASE_URL (Neon serverless)

## Changelog

```
Changelog:
- June 17, 2025. Initial maintenance ticketing system setup
- June 17, 2025. Implemented hierarchical authentication system with PostgreSQL
- June 17, 2025. Added root admin account (root@mail.com / admin)
- June 17, 2025. Created organizational and maintenance vendor management
- June 17, 2025. Integrated session-based authentication with role permissions
- June 17, 2025. Completed hierarchical dashboard visibility system
- June 17, 2025. Root admin can click into organization and vendor dashboards
- June 17, 2025. Fixed API request handling for GET requests with proper response parsing
- June 17, 2025. Implemented auto-generated admin accounts for organizations and vendors
- June 17, 2025. Added role-based routing (org_admin → organization dashboard, maintenance_admin → vendor dashboard)
- June 17, 2025. Fixed vendor ticket filtering to show only assigned tickets
- June 17, 2025. Created independent admin management for organizations and vendors
- June 17, 2025. Fixed sub-admin authentication routing to show organization dashboard
- June 17, 2025. Implemented permission-based UI filtering for sub-admin users
- June 17, 2025. Added role-based access control (accept_ticket vs place_ticket permissions)
- June 17, 2025. Fixed modal scrolling issue with large image uploads
- June 17, 2025. Completed permission-based ticket management for sub-admin users
- June 17, 2025. Enhanced image display in ticket cards to show multiple thumbnails
- June 17, 2025. Transformed ticket display from cards to professional table format
- June 17, 2025. Redesigned progress tracking from percentages to meaningful milestones
- June 17, 2025. Created new root dashboard with TaskScout.ai color theme and tabbed interface
- June 17, 2025. Added dedicated tabs for organizations, vendors, tickets overview with clean management interface
- June 18, 2025. Completed technician management system with full CRUD operations
- June 18, 2025. Implemented comprehensive validation: 10-digit phone numbers, unique emails/phones across system
- June 18, 2025. Added vendor admin credentials: admin@vendor.vendor / password
- June 18, 2025. Fixed database schema with proper unique constraints and validation
- June 18, 2025. Fixed critical role escalation security bug where technicians showed admin interface
- June 18, 2025. Implemented proper role-based UI separation (technicians see basic dashboard, not admin controls)
- June 18, 2025. Fixed routing issues preventing root admin from accessing organization/vendor views
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
UI Design: TaskScout.ai inspired color scheme with blue (#3B82F6) and purple (#7C3AED) gradients
Root Admin UI: Tabbed interface with sidebar navigation for organizations, vendors, tickets, and sub-admins
```