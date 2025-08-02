# Telecaller CRM with Meta Ads Integration

A comprehensive Customer Relationship Management (CRM) system designed specifically for telecaller teams with automated lead management and Meta Ads integration.

## 🎯 Project Overview

This application provides a complete solution for managing telecaller operations, including:
- Multi-user telecaller access with role-based permissions
- Automated lead distribution system
- Meta Ads integration for real-time lead capture
- Call tracking and performance analytics
- Daily reporting and task management
- Admin dashboard with comprehensive analytics

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
- **Framework**: Express.js with Socket.io for real-time features
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with role-based access control
- **Real-time**: Socket.io for live updates and notifications
- **File Handling**: Multer for file uploads, PDF/Excel export capabilities

### Frontend (React + Material-UI)
- **Framework**: React 18 with React Router for navigation
- **UI Library**: Material-UI (MUI) with custom theming
- **State Management**: React Context API with hooks
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form for form handling
- **Notifications**: React Hot Toast for user feedback

## 🚀 Core Features

### 1. Multi-User Telecaller Access
- **Individual login credentials** for each telecaller
- **Role-based access control**: Admin, Supervisor, Telecaller
- **Secure authentication** with JWT tokens
- **Session management** with automatic logout
- **Profile management** with avatar upload

### 2. Lead Management System
- **Complete lead lifecycle** from capture to conversion
- **Lead scoring** based on multiple factors
- **Status tracking**: New → Contacted → Qualified → Interested → Converted
- **Priority levels**: Low, Medium, High, Urgent
- **Lead quality**: Hot, Warm, Cold
- **Follow-up scheduling** with automated reminders

### 3. Meta Ads Integration
- **Webhook endpoint** for real-time lead capture
- **Automatic lead creation** from Meta Ads campaigns
- **Campaign tracking** with detailed analytics
- **Lead source attribution** for performance analysis
- **Custom field mapping** for Meta form data

### 4. Automated Lead Distribution
- **Smart assignment algorithm** based on availability
- **Round-robin distribution** for fair workload
- **Manual reassignment** by admin/supervisor
- **Availability tracking** with real-time status updates
- **Workload balancing** to prevent overload

### 5. Call History & Status Tracking
- **Comprehensive call logging** with detailed notes
- **Call outcome tracking**: Connected, No Answer, Busy, etc.
- **Duration tracking** with performance metrics
- **Quality assessment** with supervisor review
- **Follow-up scheduling** based on call outcomes

### 6. Daily Task & Lead Reporting
- **Daily activity reports** for each telecaller
- **Performance metrics** calculation
- **Goal tracking** with achievement percentages
- **Export capabilities** in Excel and PDF formats
- **Supervisor review system** with feedback

### 7. Admin Dashboard
- **Real-time analytics** with live data updates
- **Performance charts** and visualizations
- **Team overview** with individual metrics
- **Lead pipeline** visualization
- **Quick actions** for lead management

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['admin', 'supervisor', 'telecaller'],
  department: String,
  phone: String,
  isActive: Boolean,
  avatar: String,
  performance: {
    totalCalls: Number,
    successfulCalls: Number,
    conversionRate: Number
  },
  availability: {
    isAvailable: Boolean,
    currentStatus: String,
    lastActive: Date
  },
  supervisor: ObjectId (ref: User),
  teamMembers: [ObjectId] (ref: User)
}
```

### Leads Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  source: ['facebook', 'instagram', 'manual', 'website'],
  status: ['new', 'contacted', 'qualified', 'interested', 'converted'],
  priority: ['low', 'medium', 'high', 'urgent'],
  assignedTo: ObjectId (ref: User),
  assignedAt: Date,
  metaData: {
    adName: String,
    campaignName: String,
    leadGenFormName: String
  },
  followUpDate: Date,
  notes: String,
  score: Number (0-100)
}
```

### Calls Collection
```javascript
{
  _id: ObjectId,
  leadId: ObjectId (ref: Lead),
  telecallerId: ObjectId (ref: User),
  phoneNumber: String,
  callType: ['outbound', 'inbound'],
  startTime: Date,
  endTime: Date,
  duration: Number (seconds),
  status: ['scheduled', 'in_progress', 'completed', 'missed'],
  outcome: ['connected', 'no_answer', 'busy', 'converted'],
  notes: String,
  nextFollowupDate: Date,
  quality: ['excellent', 'good', 'fair', 'poor']
}
```

### Reports Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  reportDate: Date,
  reportType: ['daily', 'weekly', 'monthly'],
  callMetrics: {
    totalCalls: Number,
    completedCalls: Number,
    successfulCalls: Number,
    totalDuration: Number
  },
  leadMetrics: {
    newLeads: Number,
    contactedLeads: Number,
    convertedLeads: Number
  },
  performanceMetrics: {
    connectionRate: Number,
    conversionRate: Number
  },
  activities: [{
    time: String,
    activity: String,
    description: String
  }],
  notes: String,
  status: ['draft', 'submitted', 'reviewed']
}
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Users Management
- `GET /api/users` - Get all users (Admin/Supervisor)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/team/:supervisorId` - Get team members

### Leads Management
- `GET /api/leads` - Get all leads with filters
- `POST /api/leads` - Create new lead
- `GET /api/leads/:id` - Get specific lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/assign` - Assign lead to telecaller
- `GET /api/leads/assigned/:userId` - Get assigned leads

### Call Management
- `GET /api/calls` - Get all calls with filters
- `POST /api/calls` - Log new call
- `GET /api/calls/:id` - Get specific call
- `PUT /api/calls/:id` - Update call
- `GET /api/calls/user/:userId` - Get user's calls
- `POST /api/calls/start` - Start call timer
- `POST /api/calls/end` - End call timer

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get specific report
- `PUT /api/reports/:id` - Update report
- `GET /api/reports/export/:format` - Export reports
- `GET /api/reports/analytics` - Get analytics data

### Meta Integration
- `POST /api/meta/webhook` - Meta Ads webhook endpoint
- `GET /api/meta/campaigns` - Get Meta campaigns
- `POST /api/meta/sync` - Sync Meta leads
- `GET /api/meta/analytics` - Get Meta analytics

## 🎨 Frontend Components

### Core Components
- `Layout.js` - Main application layout with sidebar
- `ProtectedRoute.js` - Route protection with role-based access
- `NotificationPanel.js` - Real-time notifications
- `StatusIndicator.js` - User status indicator

### Pages
- `Login.js` - Authentication page
- `Dashboard.js` - Main dashboard with analytics
- `Leads.js` - Lead management interface
- `LeadDetail.js` - Individual lead view
- `Calls.js` - Call management interface
- `Reports.js` - Report management
- `Users.js` - User management (Admin/Supervisor)
- `MetaIntegration.js` - Meta Ads integration settings
- `Analytics.js` - Advanced analytics dashboard
- `Profile.js` - User profile management
- `Settings.js` - Application settings

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

### Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
MONGODB_URI=mongodb://localhost:27017/telecaller-app
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:3000
PORT=5000

# Start development server
npm run dev
```

### Frontend Setup
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm start
```

### Database Seeding
```bash
# Seed initial data
npm run seed
```

## 🔐 Environment Variables

### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/telecaller-app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL
CLIENT_URL=http://localhost:3000

# Meta Ads Integration
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

## 📱 Features Walkthrough

### 1. User Authentication & Roles
- **Admin**: Full system access, user management, analytics
- **Supervisor**: Team management, performance monitoring, lead assignment
- **Telecaller**: Lead management, call logging, daily reports

### 2. Lead Management Workflow
1. **Lead Creation**: Manual entry or Meta Ads webhook
2. **Auto-Assignment**: System assigns to available telecaller
3. **Contact Attempt**: Telecaller makes initial contact
4. **Status Update**: Update lead status based on response
5. **Follow-up**: Schedule next contact if needed
6. **Conversion**: Mark as converted when deal closes

### 3. Call Management Process
1. **Call Initiation**: Start call timer
2. **Call Recording**: Log call details and outcome
3. **Notes Entry**: Add call notes and follow-up requirements
4. **Status Update**: Update lead status based on call outcome
5. **Follow-up Scheduling**: Schedule next contact if needed

### 4. Reporting System
- **Daily Reports**: Telecallers submit daily activity reports
- **Performance Metrics**: Connection rate, conversion rate, call duration
- **Goal Tracking**: Track against daily/weekly targets
- **Export Options**: Excel and PDF export capabilities

### 5. Meta Ads Integration
- **Webhook Setup**: Configure Meta Ads webhook
- **Lead Capture**: Automatic lead creation from ads
- **Campaign Tracking**: Track performance by campaign
- **Analytics**: Meta-specific analytics and reporting

## 🔄 Real-time Features

### Socket.io Events
- `join-user-room` - Join user-specific room
- `new-lead-assigned` - Notify telecaller of new lead
- `call-status-updated` - Broadcast call status changes
- `report-submitted` - Notify supervisor of report submission
- `user-status-changed` - Update user availability status

### Live Updates
- **Lead Assignment**: Real-time notifications for new leads
- **Call Status**: Live call status updates
- **User Availability**: Real-time availability tracking
- **Performance Metrics**: Live dashboard updates

## 📊 Analytics & Reporting

### Dashboard Metrics
- **Total Leads**: New, contacted, converted
- **Call Performance**: Total calls, success rate, average duration
- **Team Performance**: Individual telecaller metrics
- **Conversion Funnel**: Lead progression through stages

### Export Options
- **Excel Export**: Detailed reports in Excel format
- **PDF Export**: Formatted reports in PDF format
- **Custom Date Ranges**: Flexible reporting periods
- **Filtered Reports**: Role-based report access

## 🛡️ Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Role-based Access**: Granular permission control
- **Session Management**: Automatic session handling
- **Password Security**: Bcrypt password hashing

### Data Protection
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting for abuse prevention
- **CORS Configuration**: Secure cross-origin requests
- **Helmet Security**: Security headers implementation

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**: Set production environment variables
2. **Database Setup**: Configure production MongoDB instance
3. **File Storage**: Configure cloud storage for uploads
4. **SSL Certificate**: Set up HTTPS for security
5. **Process Management**: Use PM2 for process management

### Deployment Options
- **Heroku**: Easy deployment with add-ons
- **AWS**: Scalable cloud deployment
- **DigitalOcean**: VPS deployment
- **Vercel**: Frontend deployment
- **Netlify**: Static site hosting

## 🔧 Customization

### Theming
- **Material-UI Theme**: Customizable color scheme
- **Component Styling**: Modular CSS-in-JS approach
- **Responsive Design**: Mobile-first responsive layout

### Feature Extensions
- **SMS Integration**: Add SMS capabilities
- **Email Integration**: Email automation features
- **CRM Integration**: Connect with external CRM systems
- **Analytics Enhancement**: Advanced analytics and AI insights

## 📞 Support & Maintenance

### Monitoring
- **Error Logging**: Comprehensive error tracking
- **Performance Monitoring**: Application performance metrics
- **User Analytics**: User behavior tracking
- **System Health**: Automated health checks

### Updates & Maintenance
- **Regular Updates**: Security and feature updates
- **Backup Strategy**: Automated database backups
- **Disaster Recovery**: Data recovery procedures
- **Documentation**: Comprehensive system documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For support or questions, please contact the development team.

---

**Note**: This application is designed for production use with proper security measures and should be deployed with appropriate security configurations.
