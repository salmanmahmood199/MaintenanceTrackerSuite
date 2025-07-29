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
5. **Residential**: Self-service maintenance request portal with marketplace assignment

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
- July 21, 2025. Enhanced work order editing interface with parts and rates display underneath labor costs for complete cost breakdown
- July 21, 2025. Fixed interface stability issues preventing editing fields from collapsing unexpectedly with comprehensive event handling
- July 21, 2025. Parts costs now populate from system defaults but allow full customization in invoice creation interface
- July 21, 2025. Added parts summary display showing individual parts with quantities and costs immediately below labor section
- July 21, 2025. Fixed PDF text visibility issues completely - all invoice text now displays in black instead of invisible white/gray
- July 21, 2025. Enhanced PDF preview with detailed work order breakdown showing individual labor details, parts lists with quantities/costs, and real vendor/organization data
- July 21, 2025. Customized PDF header to display actual vendor name instead of generic "Professional Maintenance Services"
- July 21, 2025. Implemented comprehensive work order table with description, labor breakdown (hours/rate), detailed parts usage, and completion dates
- July 22, 2025. Enhanced location display system across all ticket views with comprehensive store name and address information
- July 22, 2025. Fixed location data persistence issue in ticket creation - backend now properly saves locationId from form submissions
- July 22, 2025. Created universal location access system allowing vendor users to view location information for assigned tickets
- July 22, 2025. Removed Timeline column from ticket table for cleaner interface with focused location display
- July 22, 2025. Added new public location lookup API endpoint (/api/locations/:id) accessible by all authenticated users
- July 23, 2025. Implemented comprehensive payment system for invoices with multiple payment methods
- July 23, 2025. Added payment modal supporting credit card, ACH, and external payments (check/other)
- July 23, 2025. Enhanced database schema with payment tracking fields (paymentMethod, paymentType, checkNumber, stripePaymentIntentId)
- July 23, 2025. Created tabbed invoice organization system - all invoices, paid invoices, unpaid invoices sorted by date
- July 23, 2025. Added payment processing API endpoint /api/invoices/:id/pay with external payment support
- July 23, 2025. External payments (check/other) fully functional, credit card/ACH showing "Coming Soon" status
- July 23, 2025. Updated InvoicesView component with payment status badges and payment method display
- July 23, 2025. Successfully migrated database schema to support new payment fields
- July 23, 2025. Enhanced invoice system with comprehensive filtering and sorting capabilities
- July 23, 2025. Added search functionality for invoices by number, ticket, or organization name
- July 23, 2025. Implemented date-based sorting (newest first/oldest first) for invoice organization
- July 23, 2025. Added organization filtering for vendors working with multiple clients
- July 23, 2025. Organization names now display in vendor invoice tables for better clarity
- July 23, 2025. Added results summary showing filtered count and active filter indicators
- July 23, 2025. Enhanced vendor ticket view with visual status categories and priority indicators
- July 23, 2025. Added vendor-specific status dashboard showing tickets needing attention vs in progress vs ready to bill
- July 23, 2025. Created color-coded status cards with counts for better vendor workflow visibility
- July 23, 2025. Implemented vendor-friendly status badges with clear action descriptions (e.g., "Needs Assignment", "Ready to Invoice")
- July 23, 2025. Added priority indicators with animated alerts for high-priority vendor actions
- July 23, 2025. Completely redesigned vendor status labels to be action-oriented and clear (e.g., "Assign Technician", "Create Invoice", "Work Approved")
- July 23, 2025. Updated vendor dashboard categories with intuitive names: "Action Required", "In Progress", "Ready to Bill", "All Done"
- July 23, 2025. Enhanced filter system with vendor-friendly status options using emojis and clear action descriptions
- July 23, 2025. Eliminated confusing status terminology - vendors now see exactly what action is needed for each ticket
- July 23, 2025. Fixed media file display issues in ticket details - images and videos now show proper thumbnails instead of broken placeholders
- July 23, 2025. Enhanced work orders display with clickable detailed view modal showing all work order information, images, parts, and costs
- July 23, 2025. Added comprehensive work order details modal with full image gallery, parts breakdown, and completion notes
- July 25, 2025. Implemented comprehensive Google Calendar integration with OAuth 2.0 authentication flow
- July 25, 2025. Created Google Calendar API service with bidirectional sync capabilities (import from Gmail to internal calendar)
- July 25, 2025. Added googleCalendarIntegrations database table for storing user authentication tokens and sync settings
- July 25, 2025. Built Google Calendar integration UI component with connection status, sync controls, and OAuth help guide
- July 25, 2025. Enhanced calendar page with Google Calendar sync functionality and OAuth setup documentation
- July 25, 2025. Added comprehensive API routes for Google Calendar authentication, token management, and event synchronization
- July 25, 2025. Calendar events now support Google sync metadata (googleEventId, syncedToGoogle) for bidirectional integration
- July 25, 2025. Fixed database schema issues and created missing tables (google_calendar_integrations, availability_configs)
- July 25, 2025. Created administrator setup guide (GOOGLE_CALENDAR_SETUP.md) for one-time OAuth configuration
- July 25, 2025. Enhanced Google Calendar sync to fetch future events (1 year ahead) with improved date parsing
- July 25, 2025. Fixed OAuth callback redirect handling for proper Replit domain support
- July 25, 2025. Successfully connected Google Calendar integration - all future events now sync to TaskScout calendar
- July 25, 2025. Fixed timezone display issue in calendar grid - events now show correct local time (3:30 PM instead of 5:30 PM)
- July 25, 2025. Implemented bidirectional Google Calendar sync - TaskScout events now automatically sync back to Google Calendar
- July 25, 2025. Enhanced event creation with proper all-day and timed event handling for Google sync
- July 25, 2025. Added comprehensive logging for sync debugging and error handling
- July 26, 2025. Implemented comprehensive bid versioning system for marketplace bids
- July 26, 2025. Enhanced database schema with bid versioning fields (isSuperseded, supersededByBidId, previousBidId, version)
- July 26, 2025. Updated marketplace bid updates to create new bid records instead of modifying existing ones
- July 26, 2025. Added visual indicators for superseded bids with red warning notices and version badges
- July 26, 2025. Disabled action buttons (Accept, Reject, Counter) for outdated bid versions
- July 26, 2025. Complete bid history now visible in "View Bids" modal showing both old and new bid versions
- July 26, 2025. Organizations can see full negotiation history with clear visual separation between current and superseded bids
- July 26, 2025. Updated React Native mobile app with current server connectivity and fixed configuration issues
- July 26, 2025. Mobile app now properly connects to TaskScout server at http://0.0.0.0:5000 with automatic API detection
- July 26, 2025. Updated mobile app dependencies and fixed TypeScript configuration for Expo SDK 53
- July 26, 2025. Mobile app includes comprehensive setup instructions in START_HERE.md for easy deployment
- July 28, 2025. Implemented comprehensive residential user support with self-registration portal
- July 28, 2025. Added residential user authentication system with address fields for service location tracking
- July 28, 2025. Created residential dashboard with automatic marketplace ticket assignment (no approval step required)
- July 28, 2025. Enhanced database schema with residential address fields for both users and tickets tables
- July 28, 2025. Added residential user registration link to login page for easy onboarding
- July 28, 2025. Residential tickets automatically assigned to marketplace for vendor bidding without organization approval
- July 29, 2025. Enhanced residential ticket creation with flexible address options - users can choose home address or enter new service address
- July 29, 2025. Implemented comprehensive email and phone validation across entire platform preventing duplicates across users, organizations, and vendors
- July 29, 2025. Updated all API routes with validation functions ensuring unique emails and 10-digit phone numbers with proper format validation
- July 29, 2025. Created dedicated residential ticket modal with address selection and full service address input fields including apartment/unit support
- July 29, 2025. Implemented marketplace privacy protection - vendors only see city, state, and ZIP code until bid acceptance
- July 29, 2025. Enhanced address privacy system: full street addresses hidden from marketplace vendors, revealed only after successful bid acceptance
- July 29, 2025. Updated marketplace ticket displays and vendor bid views to show limited location information for residential user privacy
- July 29, 2025. Simplified marketplace bidding form - removed Required Parts section and Estimated Hours field for streamlined vendor experience
- July 29, 2025. Enhanced bidding workflow with hourly rate input and response time selection only (no hour estimation required)
- July 29, 2025. Updated bid display components to show hourly rate instead of total amount, maintaining hourly pricing model without complexity
- July 29, 2025. Implemented comprehensive Gmail SMTP-based password recovery system with secure 15-minute expiry tokens
- July 29, 2025. Added password reset database table and API endpoints for forgot/reset password workflow
- July 29, 2025. Created professional email templates for password reset and confirmation notifications
- July 29, 2025. Built frontend components for forgot password and reset password pages with proper validation
- July 29, 2025. Added "Forgot your password?" link to login page for easy access to password recovery
- July 29, 2025. Enhanced residential user registration with welcome email functionality
- July 29, 2025. Created comprehensive welcome email template with platform overview and getting started tips
- July 29, 2025. Successfully configured Google Workspace business email authentication for hello@taskscout.ai
- July 29, 2025. Completed email system implementation - welcome emails and password recovery fully operational with professional TaskScout branding
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
UI Design: TaskScout.ai inspired color scheme with blue (#3B82F6) and purple (#7C3AED) gradients
Root Admin UI: Tabbed interface with sidebar navigation for organizations, vendors, tickets, and sub-admins
```