# TeleCaller CRM Application

A comprehensive telecaller management system designed for teams across departments to streamline telecalling operations, Meta ad management, call assignment, tracking, and reporting.

## 🚀 Features

### ✅ Multi-User Access
- Single application for all telecaller staff
- Individual login credentials for each staff member
- Role-based access control (Admin, Supervisor, Telecaller)

### ✅ Meta Ad Integration
- Direct integration with Facebook/Instagram ads
- Real-time lead reception from Meta campaigns
- Automatic lead processing and assignment

### ✅ Automatic Call Assignment
- Intelligent auto-assignment to available telecallers
- Manual override options for supervisors
- Load balancing based on workload and availability

### ✅ Call History Tracking
- Complete call logs for each telecaller
- Admin access to all user call histories
- Detailed call analytics and performance metrics

### ✅ Daily Task Reporting
- In-app report submission for daily activities
- Downloadable reports in Excel/PDF formats
- Performance tracking and target monitoring

### ✅ Admin Dashboard
- Comprehensive performance summaries
- Lead status overview and management
- Team member management and analytics
- Report review and approval system

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time features
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

### Frontend
- **React 18** with functional components and hooks
- **Material-UI (MUI)** for modern UI components
- **React Router** for navigation
- **Axios** for API communication
- **Socket.IO Client** for real-time updates
- **React Hook Form** for form management
- **Recharts** for data visualization

### Additional Features
- **PDF/Excel Export** functionality
- **Real-time notifications**
- **Responsive design** for mobile and desktop
- **Role-based access control**
- **Auto-assignment algorithms**

## 🏗️ Project Structure

```
telecaller-app/
├── server/                 # Backend application
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication and validation
│   ├── index.js           # Server entry point
│   └── .env.example       # Environment variables template
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── App.js         # Main app component
│   │   └── index.js       # React entry point
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd telecaller-app
```

2. **Install root dependencies**
```bash
npm install
```

3. **Install all dependencies**
```bash
npm run install-all
```

4. **Set up environment variables**
```bash
# Copy environment template
cp server/.env.example server/.env

# Edit the .env file with your configuration
nano server/.env
```

5. **Configure environment variables**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/telecaller-app

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

# Client URL
CLIENT_URL=http://localhost:3000

# Meta/Facebook API (Optional)
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_ACCESS_TOKEN=your-facebook-access-token
```

6. **Start the development servers**
```bash
# Start both frontend and backend
npm run dev

# Or start them separately:
# Backend only
npm run server

# Frontend only
npm run client
```

7. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 👥 Default User Accounts

For testing purposes, you can create default accounts using the admin registration endpoint:

### Admin Account
- Email: admin@telecaller.com
- Password: admin123
- Role: Admin

### Supervisor Account
- Email: supervisor@telecaller.com
- Password: supervisor123
- Role: Supervisor

### Telecaller Account
- Email: telecaller@telecaller.com
- Password: telecaller123
- Role: Telecaller

## 📱 Key Functionalities

### For Telecallers
- View assigned leads and call history
- Log call activities and outcomes
- Submit daily reports
- Update availability status
- Receive real-time lead assignments

### For Supervisors
- Manage team members
- Review and approve reports
- Reassign leads between telecallers
- Monitor team performance
- Access team analytics

### For Administrators
- Complete system management
- User account creation and management
- Meta integration configuration
- System-wide analytics and reporting
- Lead assignment algorithm configuration

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/status` - Update user status

### Leads Management
- `GET /api/leads` - Get leads with filtering
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `PUT /api/leads/:id/assign` - Reassign lead

### Call Management
- `GET /api/calls` - Get call history
- `POST /api/calls` - Log new call
- `PUT /api/calls/:id` - Update call details

### Reports
- `GET /api/reports` - Get reports
- `POST /api/reports` - Create/update report
- `GET /api/reports/:id/export` - Export report

### Meta Integration
- `POST /api/meta/webhook` - Facebook webhook endpoint
- `GET /api/meta/campaigns` - Get Facebook campaigns
- `POST /api/meta/test-lead` - Create test lead

## 🔧 Configuration

### Meta/Facebook Integration
1. Create a Facebook App at developers.facebook.com
2. Set up a webhook endpoint for lead generation
3. Configure the webhook URL: `https://your-domain.com/api/meta/webhook`
4. Add your Facebook credentials to the .env file

### Database Setup
1. Install MongoDB locally or use MongoDB Atlas
2. Update the MONGODB_URI in your .env file
3. The application will automatically create collections on first run

## 📊 Features in Detail

### Real-time Features
- Live lead assignment notifications
- Team member status updates
- Call completion alerts
- System announcements

### Reporting System
- Daily activity reports
- Performance analytics
- Export to PDF/Excel
- Supervisor review workflow

### Lead Management
- Automatic Meta ad lead import
- Smart assignment algorithms
- Lead scoring and prioritization
- Follow-up scheduling

### Call Tracking
- Complete call history
- Duration and outcome tracking
- Quality assessments
- Performance metrics

## 🚀 Deployment

### Production Build
```bash
# Build the client
npm run build

# Set NODE_ENV to production
export NODE_ENV=production

# Start the server
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/telecaller-app
JWT_SECRET=your-production-jwt-secret
CLIENT_URL=https://your-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

## 🔄 Updates and Maintenance

Regular updates include:
- Security patches
- Feature enhancements
- Performance optimizations
- Bug fixes
- Meta API updates

## 📈 Roadmap

Future enhancements planned:
- Mobile app development
- Advanced analytics dashboard
- Integration with more ad platforms
- AI-powered lead scoring
- Voice recording capabilities
- Advanced reporting features