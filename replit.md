# Maintenance Ticketing System with Hierarchical Authentication

## Overview
This is a full-stack maintenance ticketing application for commercial businesses, featuring hierarchical user management, robust ticket tracking with media attachments, and integrated financial workflows. The system supports root administration, organizational management, and maintenance vendor coordination, enabling efficient management of various business maintenance needs. Key capabilities include multi-role user system, comprehensive ticket lifecycle management (from creation to billing), location-based services, a marketplace for vendor bidding, and detailed work order tracking. The vision is to provide a comprehensive, intuitive platform for commercial maintenance, transforming how businesses manage their assets and service providers.

## Recent Changes (August 2025)
- **Mobile App Connection Fixed**: Resolved "Network request failed" errors in Expo mobile app
- **CORS Configuration Added**: Backend now properly accepts cross-origin requests from mobile devices
- **API URL Configuration**: Mobile app now correctly connects to local development server (192.168.1.153:5000)
- **Environment Setup**: Added flexible environment configuration for mobile app development vs production
- **Complete Billing System**: Implemented full invoicing workflow in mobile app with InvoiceModal for work order completion billing
- **Work Order Completion**: Fixed field mapping issues, completion status validation, and implemented complete verification workflow
- **Invoice Management**: Added comprehensive invoice management screen with create, view, and payment functionality
- **Billing Actions**: Added billing actions to Actions tab for tickets with "ready_for_billing" status
- **Vendor Self-Assignment**: Added ability for maintenance vendor admins to assign tickets to themselves as technicians, supporting one-man vendor teams in both web and mobile applications
- **Counter Offer System**: Completed counter offer functionality with proper accept/reject workflows, hourly rate formatting, and mobile app support
- **Streamlined Mobile Workflow**: Eliminated workflow friction by removing intermediate confirmation popups and native iOS picker, replaced with custom in-app technician selector that auto-navigates to work order creation upon assignment
- **PDF Invoice Preview**: Added professional PDF preview functionality for mobile invoice creation with real-time updates and complete line item display
- **Web Progress Bar Fix**: Fixed progress tracker visibility issue by increasing container height from 60vh to 80vh
- **Mobile Dashboard Redesign**: Removed blue stats boxes and redesigned mobile dashboard with intuitive search functionality, priority overview, and enhanced filtering system with clear visual indicators for ticket status and counts
- **Critical Security Fix**: Prevented vendor admins (maintenance_admin role) from creating tickets by adding requireRole middleware to POST /api/tickets endpoint and hiding "New Ticket" button in mobile app for vendor users
- **Enhanced Mobile Filtering**: Added advanced filtering system with date range filters (Today, This Week, This Month), role-based organization/vendor filtering, and improved visual contrast for better usability
- **Mobile Navigation Overhaul**: Replaced bottom tab navigation with hamburger menu in top-left header, providing cleaner interface with scrollable month/day/year date pickers for custom date ranges

## User Preferences
Preferred communication style: Simple, everyday language.
UI Design: TaskScout.ai inspired color scheme with blue (#3B82F6) and purple (#7C3AED) gradients
Root Admin UI: Tabbed interface with sidebar navigation for organizations, vendors, tickets, and sub-admins

## System Architecture

### Core Design Principles
- **Hierarchical Authentication**: Multi-level user roles (Root Admin, Org Admin, Maintenance Admin, Technician, Residential) with role-based access control.
- **Modular Design**: Separation of concerns between frontend (React) and backend (Express.js) with shared schemas and types.
- **Scalable Data Model**: PostgreSQL database with Drizzle ORM for robust and extensible data structures supporting complex relationships (users, organizations, vendors, tickets, work orders, invoices, comments, locations, bids, calendar events).
- **Session-Based Authentication**: Secure user sessions with bcrypt hashing for passwords and PostgreSQL session store.
- **Comprehensive Workflow Automation**: Automated processes for admin account generation, ticket lifecycle (creation, acceptance, assignment, completion, confirmation, invoicing), and marketplace bidding.

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite for development.
- **UI/UX**: shadcn/ui (Radix UI + Tailwind CSS) for consistent, themeable components.
- **State Management**: TanStack Query for efficient server-state management.
- **Routing**: Wouter for lightweight client-side navigation.
- **Form Handling**: React Hook Form with Zod for validation.
- **Mobile Application**: React Native (Expo) app with shared codebase, covering login, dashboard, ticket creation, and details, including marketplace functionalities.

### Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **File Handling**: Multer for secure image and video uploads.
- **Validation**: Zod schemas for end-to-end type safety.
- **Email Services**: SMTP-based for password recovery and welcome emails.

### Key Features
- **Ticket Management**: Create, track, and manage tickets with detailed fields, attachments (images/videos), priority, status, and comprehensive progress tracking.
- **Hierarchical User System**: Distinct dashboards and permissions for each user role, including location-based access for sub-admins.
- **Financial Workflows**: Integrated work order management, invoice generation with customizable costs, and payment tracking.
- **Marketplace Bidding**: Allows organizations to list tickets for vendor bidding, including counter-offer functionality and bid versioning. Residential users automatically assign tickets to the marketplace.
- **Calendar & Scheduling**: Google Calendar integration (bidirectional sync), availability management, and conflict checking.
- **Communication**: Integrated ticket comments system with media attachments and activity logging.
- **Search & AI Integration**: AI-powered search for autonomous ticket creation (currently disabled for all users).
- **Location Management**: Comprehensive system for managing and associating locations with organizations and tickets, with privacy controls for marketplace bidding.
- **Media Handling**: Support for both image and video uploads across ticket creation, comments, and work orders.
- **Professional Presence**: Futuristic interactive homepage, detailed contact/support pages, and SEO-optimized blog section with industry-specific content.

## External Dependencies

- **Database**: PostgreSQL (Neon Database serverless)
- **File Processing**: Multer
- **Validation**: Zod
- **UI Components**: Radix UI, shadcn/ui, Tailwind CSS
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Google Calendar API**: For event synchronization
- **Nodemailer**: For email services (SMTP via Google Workspace)
- **geoip-lite**: For IP-based location targeting