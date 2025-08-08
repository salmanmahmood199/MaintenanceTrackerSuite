# TaskScout Mobile App

A React Native mobile application built with Expo that provides a native mobile experience for the TaskScout maintenance ticketing system. This app replicates all functionality from the web version with optimized mobile UI/UX.

## Features

### 🔐 Authentication
- Secure login with session management
- Role-based access control (Root Admin, Org Admin, Maintenance Admin, Technician, Residential)
- Automatic session persistence

### 🎫 Ticket Management
- Create tickets with image/video uploads
- View and filter tickets by status, priority, and date
- Real-time ticket status updates
- Location-based ticket assignment
- Priority levels (Low, Medium, High)

### 📅 Calendar & Scheduling
- Monthly calendar view with event indicators
- Event creation and management
- Work assignment tracking
- Availability management
- Calendar integration with ticket assignments

### 👤 User Profile
- User information and role display
- Account settings access
- Logout functionality

### 📱 Mobile-Optimized Features
- Native camera integration for photos
- Gallery picker for multiple media files
- Touch-optimized UI components
- Responsive layouts for different screen sizes
- Native navigation with tab bar

## Tech Stack

- **Framework**: React Native with Expo SDK 53
- **Navigation**: Expo Router (file-based routing)
- **State Management**: TanStack Query for server state
- **UI/Styling**: Custom styled components with gradients
- **API**: RESTful API integration
- **Media**: Expo ImagePicker for camera/gallery access
- **Icons**: Expo Vector Icons (Ionicons)

## Project Structure

```
apps/mobile-app/
├── app/                          # File-based routing screens
│   ├── (tabs)/                   # Tab navigator screens
│   │   ├── dashboard.tsx         # Main dashboard
│   │   ├── tickets.tsx           # Tickets list
│   │   ├── calendar.tsx          # Calendar view
│   │   └── profile.tsx           # User profile
│   ├── create-ticket.tsx         # Create ticket form
│   ├── ticket/[id].tsx           # Ticket details
│   ├── _layout.tsx               # Root layout
│   └── index.tsx                 # Login screen
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx       # Authentication context
│   ├── services/
│   │   └── api.ts                # API utilities
│   └── types/
│       └── index.ts              # TypeScript types
├── assets/                       # Static assets
├── app.json                      # Expo configuration
└── package.json                  # Dependencies
```

## Installation & Setup

1. **Prerequisites**
   - Node.js 18 or higher
   - Expo CLI (`npm install -g @expo/cli`)
   - Expo Go app on your mobile device (for development)

2. **Install Dependencies**
   ```bash
   cd apps/mobile-app
   npm install
   ```

3. **Configure API Base URL**
   - Update the API_BASE_URL in `src/services/api.ts`
   - For development: `http://localhost:5000`
   - For production: Your deployed backend URL

4. **Start Development Server**
   ```bash
   npm start
   ```

5. **Run on Device**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or use `npm run android` / `npm run ios` for simulators

## Key Components

### Authentication Flow
- Login screen with credential validation
- Automatic session checking on app start
- Role-based navigation and permissions

### Ticket Creation
- Multi-step form with validation
- Camera integration for photos
- Gallery picker for existing media
- Location selection for assigned users
- Priority level selection

### Dashboard
- Real-time statistics cards
- Quick action buttons
- Recent tickets display
- Role-specific information

### Calendar
- Monthly view with event dots
- Day selection and event details
- Event type color coding
- Upcoming events list

## API Integration

The app integrates with the same backend API as the web version:

- Authentication: `/api/auth/login`, `/api/auth/logout`
- Tickets: `/api/tickets` (CRUD operations)
- Organizations: `/api/organizations`
- Calendar: `/api/calendar/events`
- File uploads: Form data with multipart encoding

## Mobile-Specific Optimizations

### Image Handling
- Native camera access with expo-image-picker
- Multiple file selection from gallery
- Image preview with remove functionality
- Automatic file type detection

### Navigation
- Tab-based navigation for main sections
- Stack navigation for detailed views
- Native back button handling
- Smooth transitions between screens

### Performance
- Lazy loading of images
- Efficient query caching with TanStack Query
- Optimized list rendering for large datasets
- Background refresh capabilities

## Development

### Adding New Screens
1. Create new screen file in `app/` directory
2. Add navigation linking where needed
3. Update TypeScript types if required

### API Integration
- Use the `apiRequest` utility from `src/services/api.ts`
- Add new endpoints to the respective API modules
- Handle authentication and error states

### Styling
- Follow the existing color scheme (blue/purple gradients)
- Use consistent spacing and typography
- Ensure proper dark mode support

## Deployment

### Expo Application Services (EAS)
1. Install EAS CLI: `npm install -g eas-cli`
2. Configure build: `eas build:configure`
3. Run build: `eas build --platform all`
4. Submit to stores: `eas submit`

### Manual Build
- iOS: `expo build:ios`
- Android: `expo build:android`

## Known Issues & Solutions

- **Image Upload**: Ensure proper permissions for camera/gallery access
- **API Calls**: Check network connectivity and CORS configuration
- **Navigation**: Use proper navigation methods to avoid memory leaks

## Contributing

1. Follow the existing code style and patterns
2. Test on both iOS and Android devices
3. Update types when adding new features
4. Maintain compatibility with the backend API

## License

Private project - All rights reserved.