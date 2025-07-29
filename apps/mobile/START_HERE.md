# TaskScout Mobile App - Getting Started

## 🚀 Quick Start Guide

The TaskScout mobile app has been fully updated with all the latest features from the web platform. Here's how to get it running:

### Prerequisites
- Node.js 18+ installed
- Expo CLI: `npm install -g @expo/cli`
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Installation Steps

1. **Navigate to mobile app directory:**
   ```bash
   cd apps/mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

4. **Connect your device:**
   - **iOS**: Open Camera app and scan the QR code
   - **Android**: Open Expo Go app and scan the QR code
   - **Web**: Press `w` in the terminal to open in web browser

### 📱 App Features

#### ✅ Complete Feature Parity
- **Authentication**: Login, registration, password recovery
- **User Roles**: Organizations, vendors, residential users
- **Ticket Management**: Create, view, track tickets with real-time status
- **Marketplace**: Vendor bidding system for residential tickets
- **Image/Video Upload**: Mandatory media for ticket creation
- **Address Management**: Flexible service location options
- **Real API Integration**: Connected to TaskScout backend on port 5000

#### 🎨 User Experience
- **Material Design 3**: Modern, native-feeling interface
- **Dark/Light Theme**: Automatic system theme detection
- **Role-Based Navigation**: Contextual menus and features
- **Responsive Design**: Optimized for all screen sizes
- **Error Handling**: Comprehensive validation and feedback

### 🔐 Test Accounts

#### Root Admin
- **Email**: root@mail.com
- **Password**: admin
- **Access**: Full system administration

#### Demo Organization
- **Email**: admin@testorg.org
- **Password**: [auto-generated - check console logs]
- **Access**: Organization management and tickets

#### Demo Vendor
- **Email**: admin@testvendor.vendor
- **Password**: [auto-generated - check console logs]
- **Access**: Marketplace bidding and job management

#### Residential User
- **Registration**: Use "Sign up here" link on login screen
- **Features**: Create tickets, automatic marketplace assignment
- **Address**: Full address capture with service location options

### 🛠 Technical Details

#### API Configuration
- **Backend URL**: http://0.0.0.0:5000
- **Authentication**: Session-based with secure token storage
- **File Upload**: FormData implementation for images/videos
- **Real-time Updates**: Live ticket status and bid tracking

#### Mobile Architecture
- **Framework**: React Native with Expo SDK 53
- **Navigation**: React Navigation 6 with stack navigator
- **UI Library**: React Native Paper (Material Design 3)
- **State Management**: React Context for authentication
- **Storage**: Expo SecureStore for sensitive data

#### Key Components
- **LoginScreen**: Multi-mode authentication interface
- **DashboardScreen**: Role-based ticket overview
- **CreateTicketScreen**: Enhanced ticket creation with media
- **MarketplaceScreen**: Vendor bidding and job browsing
- **TicketDetailsScreen**: Comprehensive ticket information

### 🔧 Development Mode

#### Hot Reload
- Changes automatically reload in Expo Go
- Fast refresh preserves component state
- Real-time debugging with React Native Debugger

#### Debugging
- **Console Logs**: View in terminal or browser dev tools
- **Network Requests**: Monitor API calls in debug mode
- **Error Overlay**: Automatic error display in development

### 📊 Features Demonstration

#### For Residential Users
1. **Register**: Complete address information required
2. **Create Ticket**: Upload images/videos, set service location
3. **Marketplace**: Tickets automatically go to marketplace
4. **Track Progress**: Real-time status updates

#### For Vendors
1. **Login**: Use vendor credentials
2. **Browse Jobs**: Access marketplace tickets (if tier enabled)
3. **Place Bids**: Submit hourly rates and response times
4. **Manage Work**: Accept tickets and track progress

#### For Organizations
1. **Dashboard**: View all organizational tickets
2. **Create Tickets**: Internal maintenance requests
3. **Vendor Management**: Assign and manage service providers
4. **Location Management**: Multi-location support

### 🌐 Web Compatibility

While primarily designed for mobile, the app includes web compatibility:

```bash
# Run in web browser
npx expo start --web
```

**Note**: Some native features (camera, file picker) have web alternatives

### 🔄 Synchronization

#### Real-time Features
- **Ticket Updates**: Status changes reflect immediately
- **Bid Notifications**: New bids and responses
- **Assignment Changes**: Vendor and technician updates
- **Comments**: Real-time collaboration

#### Offline Support
- **Basic Functionality**: View cached tickets
- **Queue Operations**: Sync when connection restored
- **Error Recovery**: Automatic retry mechanisms

### 📈 Performance

#### Optimization Features
- **Lazy Loading**: Images and data loaded on demand
- **Caching**: Smart data caching for better performance
- **Memory Management**: Proper cleanup and garbage collection
- **Bundle Size**: Optimized for fast loading

### 🚨 Troubleshooting

#### Common Issues

**QR Code Not Working**
- Ensure phone and computer are on same network
- Try `npx expo start --tunnel` for network issues

**App Won't Load**
- Check that backend is running on port 5000
- Verify API_BASE_URL in apps/mobile/src/services/api.ts

**Authentication Failed**
- Confirm backend database is accessible
- Check session configuration in server

**Images Not Uploading**
- Verify multer configuration in server
- Check file size limits and formats

#### Getting Help
- Check Expo documentation: https://docs.expo.dev/
- View error logs in terminal or Expo Go
- Test API endpoints directly with curl

### 🎯 Next Steps

The mobile app is ready for production deployment:

1. **Build for Production**: `expo build`
2. **App Store Deployment**: Follow Expo's deployment guide
3. **Push Notifications**: Add real-time notifications
4. **Offline Mode**: Enhanced offline capabilities
5. **Analytics**: User behavior tracking

The mobile app now provides a complete, professional experience that matches the web platform while being optimized for mobile workflows and touch interfaces.