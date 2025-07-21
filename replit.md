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
- June 18, 2025. Created comprehensive technician work order modal with parts tracking, cost calculation, and completion status
- June 18, 2025. Added "return_needed" status for jobs requiring follow-up visits
- June 18, 2025. Implemented full ticket workflow: create → org accept → vendor accept → technician start → technician complete with work order
- June 19, 2025. Added work orders database table with sequential numbering and complete history tracking
- June 19, 2025. Fixed permission system for organization admins to accept tickets and assign vendors
- June 19, 2025. Created work order history viewer showing all work orders per ticket with full details
- June 19, 2025. Updated ticket ordering to show newest tickets first across all views (newest at top)
- June 19, 2025. Completed work order system implementation with proper JSON handling and database storage
- June 19, 2025. Fixed work order creation workflow - technicians can now create detailed work orders with parts, costs, and completion status
- June 19, 2025. Implemented sequential work order numbering (Work Order #1, #2, etc.) for multiple visits per ticket
- June 19, 2025. Fixed vendor admin accept/reject ticket functionality - vendor admins can now properly accept and assign technicians to tickets
- June 19, 2025. Resolved UI display issues for vendor admin accept/reject buttons - buttons now appear correctly for open tickets
- June 19, 2025. Confirmed complete vendor admin workflow: login → view open tickets → accept tickets → assign technicians → manage work orders
- June 19, 2025. Fixed work order form reset issue - each new work order now starts with clean form fields instead of pre-populated data from previous work orders
- June 19, 2025. Fixed work orders history API authentication - work orders history component now uses authenticated API client to properly fetch all work orders
- June 19, 2025. Implemented ticket completion confirmation workflow - when technicians mark jobs as completed, tickets return to original requester for final approval
- June 19, 2025. Added pending_confirmation status and confirm completion functionality - requesters can approve or reject completed work with feedback
- June 19, 2025. Enhanced image gallery modal with full-screen viewing, zoom controls, and thumbnail navigation for work order images
- June 19, 2025. Completed ticket confirmation workflow - confirmed tickets move to "ready_for_billing" status for vendor invoice generation
- June 19, 2025. Implemented comprehensive invoice generation system for maintenance vendors with work order integration
- June 19, 2025. Added invoice creation modal with automatic work order calculation, additional items, tax handling, and total computation
- June 19, 2025. Created invoice database schema and API routes for full invoice lifecycle management (create, view, update)
- June 22, 2025. Fixed invoice generation workflow - added missing storage methods and completed vendor billing system
- June 22, 2025. Fixed JSON parsing errors in invoice modal and added proper error handling for empty data
- June 22, 2025. Successfully implemented complete workflow: technician completes → requester confirms → vendor creates invoice → ticket billed
- June 22, 2025. Completed invoice viewing system with tabbed navigation (Assigned Tickets/Invoices tabs)
- June 22, 2025. Fixed SQL query errors in invoice fetching - invoices now display properly in vendor dashboard
- June 22, 2025. Application ready for deployment with complete billing workflow operational
- June 22, 2025. Implemented location management system for organization admins
- June 22, 2025. Added location creation, assignment, and management functionality
- June 22, 2025. Created tabbed navigation in organization dashboard (Tickets, Sub-Admins, Locations, Vendors)
- June 22, 2025. Sub-admins can now be assigned to specific locations within organizations
- June 22, 2025. Implemented location-based ticket filtering and creation
- June 22, 2025. Sub-admins can only see and accept tickets from their assigned locations
- June 22, 2025. Ticket creation includes location dropdown for users with assigned locations
- June 22, 2025. Added locationId field to tickets table for location-based filtering
- June 22, 2025. Implemented comprehensive ticket comments/notes system
- June 22, 2025. Added ticketComments table with image attachment support
- June 22, 2025. Created TicketComments component with real-time editing and image preview
- June 22, 2025. Added comments tab to ticket detail view with activity logging
- June 22, 2025. All users with ticket access can now comment, edit own comments, and attach images
- June 22, 2025. System-generated comments support for automatic activity tracking
- June 23, 2025. Implemented marketplace functionality for open ticket bidding
- June 23, 2025. Added marketplace tier to vendor assignment options
- June 23, 2025. Created marketplace bidding system similar to Uber model
- June 23, 2025. Organizations can assign tickets to marketplace for vendor bidding
- June 23, 2025. Vendors can browse marketplace tickets and submit bids
- June 23, 2025. Added marketplace tab to vendor dashboard with bid placement interface
- June 23, 2025. Organization admins can accept/reject marketplace bids
- June 30, 2025. Enhanced file upload system to support both images and videos
- June 30, 2025. Updated MediaUpload component with video preview and 50MB limit for videos
- June 30, 2025. Modified ticket creation, comments, and work orders to handle video files
- June 30, 2025. Updated media viewer to display videos with controls in ticket table
- June 30, 2025. Fixed video playback for marketplace system - vendors can now properly view video files in marketplace tickets
- June 30, 2025. Updated marketplace ticket modal, vendor dashboard, and bids modal to support video file display and playback
- July 2, 2025. Fixed calendar date offset issue by removing double timezone correction in unavailability modal
- July 2, 2025. Implemented comprehensive conflict checking system that prevents booking during blocked time periods
- July 2, 2025. Added blocked periods management with delete functionality and confirmation dialogs
- July 2, 2025. Enhanced calendar day detail modal to show blocked periods separately with edit/delete controls
- July 2, 2025. Added proper error handling for calendar event deletion to prevent double-delete errors
- July 2, 2025. Implemented user-friendly error messages for booking conflicts (409 errors) with detailed explanations
- July 2, 2025. Added click-to-book functionality on calendar time slots with quick event creation modal
- July 2, 2025. Created comprehensive event details modal with full event information, priority badges, and delete functionality
- July 2, 2025. Implemented year/month selector for calendar navigation with dropdown controls for easy date jumping
- July 2, 2025. Separated availability from calendar event display - availability now works as background configuration data (like 9-5 or 8-6 work hours) and doesn't populate the calendar visually
- July 2, 2025. Added duration selection to event booking (15min, 30min, 45min, 1hr, 2hr, 3hr) for flexible scheduling
- July 2, 2025. Calendar now only shows scheduled events and blocked time periods, providing cleaner visual organization
- July 7, 2025. Major progress tracker enhancement - transformed from simple progress display to comprehensive ticket journey tracking system
- July 7, 2025. Created detailed timeline with visual progress bar showing ticket journey stages (submitted → reviewed → accepted → vendor assigned → work completed → billed)
- July 7, 2025. Enhanced progress tracker with detailed user information tracking (who placed ticket, when, office acceptance/rejection, assignments, vendor changes)
- July 7, 2025. Added comprehensive notes section showing work orders, comments, and assignment history with full user details and timestamps
- July 7, 2025. Implemented API endpoint for detailed ticket information with related data including organization, vendor, assignee, work orders, and comments
- July 7, 2025. Fixed date formatting errors in progress tracker with proper null checks and fallback values
- July 7, 2025. Fixed server crash caused by duplicate route definition for organization admin password reset
- July 7, 2025. Added embedded progress tracker component to ticket details modal as dedicated Progress tab
- July 7, 2025. Created visual journey tracker with progress circles, completion stages, and delivery-style tracking interface
- July 7, 2025. Enhanced ticket modal with 4-tab layout: Details, Comments, Progress, Work Orders for comprehensive ticket management
- July 7, 2025. Improved progress tracker to show all workflow steps upfront in grey, with completed steps highlighted in green/blue and current steps pulsing
- July 7, 2025. Users can now see the complete workflow journey at a glance, with clear visual indicators of progress and what's coming next
- July 7, 2025. Removed Complete button from ticket table interface for all users to streamline UI
- July 8, 2025. Enhanced AI search bar with autonomous ticket creation - AI now generates smart defaults for title, description, and priority automatically
- July 8, 2025. Added mandatory image/video upload requirement for all ticket creation - users must upload at least one file before creating tickets
- July 8, 2025. Fixed AI role permissions - org_subadmin users can only create and view tickets, not accept them (only org_admin can accept tickets)
- July 8, 2025. Implemented comprehensive ticket creation workflow with media upload interface and confirmation system
- July 8, 2025. AI assistant now works autonomously - minimal user interaction required, generates professional ticket details from simple descriptions
- July 13, 2025. Fixed application startup issue - resolved database schema migration conflicts and unique constraint problems
- July 13, 2025. Enhanced AI assistant to prevent looping - added hasImages parameter to detect when images are uploaded and automatically proceed with ticket creation
- July 13, 2025. Improved ticket creation workflow - AI now immediately creates tickets when images are uploaded instead of repeatedly asking for uploads
- July 14, 2025. Temporarily disabled Gemini AI search bar for all users - hidden from dashboard, organization view, and vendor view pages
- July 14, 2025. Fixed text visibility issues in dark theme - updated all modal components to use proper CSS variables (text-foreground, text-muted-foreground) instead of hardcoded slate colors
- July 14, 2025. Enhanced text readability in create ticket modal, media upload component, ticket details modal, and vendor/technician ticket detail modals
- July 14, 2025. Fixed JavaScript initialization error in OrganizationView component - resolved "Cannot access 'organizationVendors' before initialization" issue with proper null checks
- July 14, 2025. Enhanced visibility in ticket details modal tabs - replaced hardcoded white backgrounds with dark theme compatible colors
- July 14, 2025. Fixed text contrast in ticket comments, progress tracker, and all modal tab content for better readability
- July 14, 2025. Updated rejection/force close reason displays to use dark theme appropriate background colors
- July 14, 2025. Fixed marketplace section text visibility - updated all marketplace components (ticket listings, bid modals, ticket details) to use proper dark theme colors
- July 14, 2025. Fixed scrolling issue in marketplace bid modal - users can now scroll to see submit button and all form fields properly
- July 16, 2025. Created React Native mobile app structure with Expo integration
- July 16, 2025. Implemented mobile app with login, dashboard, ticket creation, and ticket details screens
- July 16, 2025. Set up monorepo structure with apps/mobile, packages/shared for code sharing
- July 16, 2025. Added mobile-specific features: camera integration, image picker, and Material Design 3 UI
- July 16, 2025. Configured mobile authentication context to connect to existing backend API
- July 21, 2025. Fixed marketplace bid visibility permissions - only users with marketplace access can now view bids
- July 21, 2025. Enhanced permission system to properly check vendorTiers for marketplace access in organization admin dashboard
- July 21, 2025. Updated dark theme styling for Sub-Admins and Vendors tabs with proper CSS variables for better readability
- July 21, 2025. Fixed JavaScript initialization error in OrganizationView component - resolved "Cannot access 'organizationVendors' before initialization" issue
- July 21, 2025. Fixed marketplace assignment access issue - users with marketplace vendor tier permissions can now assign tickets to marketplace
- July 21, 2025. Enhanced marketplace counter offer system with accept/reject/recounter options replacing basic "submit response"
- July 21, 2025. Added bid history tracking table for complete negotiation records between organizations and vendors
- July 21, 2025. Enhanced VendorBidsView component with sophisticated response options and visual improvements for dark theme
- July 21, 2025. Implemented automatic ticket removal from marketplace when accepted by any vendor during negotiation
- July 21, 2025. Added comprehensive bid history display with negotiation timeline in vendor response modal
- July 21, 2025. Fixed dark theme visibility issues in counter offer sections with improved CSS variables and border styling
- July 21, 2025. Converted side-by-side action buttons into clean dropdown menu interface for better space utilization
- July 21, 2025. Fixed technician dashboard ticket filtering - technicians now properly see tickets assigned to them
- July 21, 2025. Enhanced ticket actions organization with dropdown menu containing Accept, Reject, Force Close, Confirm, Reassign, Invoice, View Bids
- July 21, 2025. Fixed technician dashboard dark theme visibility issues - updated all text colors, card backgrounds, and icon contrasts to use proper CSS variables for dark mode compatibility
- July 21, 2025. Added explicit "View Details" button for technicians - technicians now have a dedicated button to view ticket details alongside existing work order action buttons
- July 21, 2025. Enhanced technician ticket details modal with tabbed interface - technicians now have access to Details, Comments, Progress, and Work Orders tabs matching other user roles for full ticket management
- July 21, 2025. Fixed dropdown menu Windows compatibility issues - enhanced three-dots menu with proper event handling, z-index stacking, and cursor styling for better cross-platform functionality
- July 21, 2025. Enhanced work order modal dark theme visibility - replaced hardcoded colors with CSS variables for better dark mode compatibility
- July 21, 2025. Fixed time input functionality in work order creation - improved time validation, error handling, and hours calculation with proper form integration
- July 21, 2025. Enhanced time input clock icon visibility - added CSS styling and Tailwind classes to make clock icons clearly visible in both light and dark themes
- July 21, 2025. Made time picker interface white - forced time input fields and picker dropdown to use white background with black text for optimal visibility
- July 21, 2025. Fixed critical storage layer issues - resolved duplicate function implementations causing work orders and comments to fail
- July 21, 2025. Restored work orders functionality - technicians can now view and create multiple work orders per ticket (sequential numbering working)
- July 21, 2025. Fixed comments system completely - all users can view, create, and edit comments with proper user attribution and image attachments
- July 21, 2025. Database migration successful - added missing is_system column to ticket_comments table for system-generated comments
- July 21, 2025. Enhanced invoice creation system with professional PDF-style interface and comprehensive cost management capabilities
- July 21, 2025. Created EnhancedInvoiceCreator component with tabbed interface: Work Orders editing, Invoice Details, and PDF Preview
- July 21, 2025. Added real-time cost adjustments: admins can modify hourly rates, hours worked, and part costs per work order
- July 21, 2025. Implemented professional PDF-style invoice viewer with white background, company logos, service details, and print functionality
- July 21, 2025. Enhanced invoice workflow: click work orders → adjust rates/costs → set payment terms → preview PDF → create invoice
- July 21, 2025. Fixed invoice creator stability issues: clicking input fields no longer collapses work order sections
- July 21, 2025. Added proper event handling with stopPropagation for all form inputs preventing interface glitches
- July 21, 2025. Enhanced parts cost editing: system defaults populate automatically but allow full customization
- July 21, 2025. Improved PDF visibility: converted light gray text to black for better contrast and readability
- July 21, 2025. Added chevron indicators for expandable work order sections with visual feedback
- July 21, 2025. Completed dark theme compatibility for all invoice creator form fields and components
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
UI Design: TaskScout.ai inspired color scheme with blue (#3B82F6) and purple (#7C3AED) gradients
Root Admin UI: Tabbed interface with sidebar navigation for organizations, vendors, tickets, and sub-admins
```