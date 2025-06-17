# Ticket Management System

## Overview

This is a full-stack ticket management application built with React (frontend) and Express.js (backend). The system allows users to create, manage, and track support tickets with image attachments, priority levels, and status tracking.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Local file system with multer for image uploads
- **Session Management**: Express sessions with PostgreSQL store
- **Validation**: Zod schemas shared between frontend and backend

### Database Schema
- **Users Table**: Basic user authentication (id, username, password)
- **Tickets Table**: Core ticket data with fields for title, description, priority, status, reporter, assignee, images array, and timestamps
- **Priority Levels**: low, medium, high
- **Status Types**: open, in-progress, completed

## Key Components

### Frontend Components
- **Dashboard**: Main ticket overview with statistics and filtering
- **CreateTicketModal**: Form for creating new tickets with image upload
- **TicketCard**: Individual ticket display with actions
- **ImageUpload**: Drag-and-drop image upload component with preview

### Backend Services
- **Storage Layer**: Abstracted storage interface with in-memory implementation (ready for database integration)
- **File Upload**: Multer configuration for image handling with size and type validation
- **API Routes**: RESTful endpoints for ticket CRUD operations and statistics

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

## Changelog

```
Changelog:
- June 17, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```