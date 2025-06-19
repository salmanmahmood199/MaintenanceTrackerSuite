# Maintenance Ticketing System

A comprehensive hierarchical maintenance ticketing application with role-based access control, featuring root administration, organizational management, and maintenance vendor coordination.

## Features

### User Management
- **Hierarchical Authentication System**: Root admin, organization admins, maintenance admins, and technicians
- **Auto-Generated Admin Accounts**: Automatic creation of admin accounts for new organizations and vendors
- **Role-Based Permissions**: Granular permissions for ticket placement, acceptance, and management
- **Multi-Tier Vendor System**: Organization-specific vendor tiers with assignment controls

### Ticket Management
- **Complete Ticket Workflow**: Create → Accept → Assign → Work → Complete
- **Image Upload Support**: Drag-and-drop image attachments for tickets
- **Priority & Status Tracking**: High/medium/low priority with comprehensive status management
- **Organization-Specific Ticket Numbers**: Hash-based ticket identifiers for easy tracking

### Work Order System
- **Sequential Work Orders**: Multiple work orders per ticket (Work Order #1, #2, etc.)
- **Parts & Cost Tracking**: Detailed parts inventory and additional charges tracking
- **Return Visit Support**: "Return needed" status for follow-up visits
- **Complete History**: Full work order history with cost breakdowns

### Dashboard Features
- **Role-Based Dashboards**: Customized views for each user role
- **Real-Time Statistics**: Ticket counts, progress tracking, and priority alerts
- **Vendor Management**: Complete technician management with CRUD operations
- **Organization Controls**: Sub-admin management and vendor tier assignments

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **shadcn/ui** component library built on Radix UI
- **Tailwind CSS** with TaskScout.ai inspired design theme
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM and Neon Database
- **Session-based Authentication** with bcrypt password hashing
- **Local File Storage** with multer for image uploads
- **Express Sessions** with PostgreSQL store

## Getting Started

### Prerequisites
- Node.js 20 or higher
- PostgreSQL database
- Environment variables (see below)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/salmanmahmood199/replitmaintenance.git
cd replitmaintenance
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your database credentials
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret_key
```

4. Set up the database:
```bash
# Push database schema
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Default Credentials

### Root Administrator
- **Email**: root@mail.com
- **Password**: admin
- **Access**: Complete system administration

### Auto-Generated Accounts
When creating organizations and vendors, admin accounts are automatically generated:
- **Organization Admin**: admin@{organizationname}.org
- **Vendor Admin**: admin@{vendorname}.vendor
- **Passwords**: Random passwords logged to console during creation

## Database Schema

### Core Tables
- **users**: Multi-role user system with organizational and vendor associations
- **organizations**: Client organizations that request maintenance
- **maintenance_vendors**: Service providers with specialties and tier assignments
- **tickets**: Enhanced ticket system with organizational context and image support
- **work_orders**: Sequential work orders with parts tracking and cost calculation
- **vendor_organization_tiers**: Organization-specific vendor tier assignments

### Key Features
- **Hierarchical Permissions**: Role-based access with granular permission controls
- **Vendor Tiers**: Organization-specific vendor classifications (Tier 1, 2, 3)
- **Image Storage**: Local file system with secure path references
- **Session Management**: PostgreSQL-backed session storage for security

## API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `GET /api/auth/logout` - Session termination
- `GET /api/auth/user` - Current user information

### Admin Management (Root Only)
- `GET/POST /api/organizations` - Organization management
- `GET/POST /api/maintenance-vendors` - Vendor management
- `POST /api/users` - User creation with role validation

### Ticket Operations
- `GET/POST /api/tickets` - Ticket management with organizational context
- `POST /api/tickets/:id/accept` - Accept and assign tickets
- `POST /api/tickets/:id/reject` - Reject tickets with reason
- `POST /api/tickets/:id/complete` - Complete tickets with work orders

### Work Orders
- `GET /api/tickets/:id/work-orders` - Get work order history
- `POST /api/tickets/:id/start` - Start work on ticket
- `POST /api/tickets/:id/complete` - Submit work order

## Deployment

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Configuration
Ensure the following environment variables are set in production:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secure session secret
- `NODE_ENV=production`

## Architecture

### Frontend Structure
```
client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Route components
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utilities and configuration
```

### Backend Structure
```
server/
├── index.ts          # Express server setup
├── routes.ts         # API route definitions
├── storage.ts        # Database operations
├── auth.ts           # Authentication middleware
└── db.ts             # Database configuration
```

### Shared Resources
```
shared/
└── schema.ts         # Drizzle schemas and Zod validation
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub.