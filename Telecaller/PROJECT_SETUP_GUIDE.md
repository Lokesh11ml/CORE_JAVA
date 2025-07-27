# TeleCaller CRM - Complete Project Setup Guide

## 📁 Project Structure

```
workspace/
└── Telecaller/                    # Main project directory
    ├── Frontend/                  # React.js Frontend Application
    │   ├── public/               # Static files
    │   │   └── index.html        # Main HTML file
    │   ├── src/                  # Frontend source code
    │   │   ├── components/       # Reusable React components
    │   │   │   ├── Layout.js     # Main layout component
    │   │   │   ├── ProtectedRoute.js # Route protection
    │   │   │   ├── StatusIndicator.js # User status component
    │   │   │   └── NotificationPanel.js # Real-time notifications
    │   │   ├── contexts/         # React Context providers
    │   │   │   ├── AuthContext.js # Authentication context
    │   │   │   └── SocketContext.js # Socket.IO context
    │   │   ├── pages/           # Page components
    │   │   │   ├── Login.js     # Login page
    │   │   │   ├── Dashboard.js # Main dashboard
    │   │   │   ├── Leads.js     # Leads management
    │   │   │   ├── Calls.js     # Call history
    │   │   │   ├── Reports.js   # Reporting system
    │   │   │   ├── Users.js     # User management
    │   │   │   ├── Profile.js   # User profile
    │   │   │   ├── MetaIntegration.js # Meta ads integration
    │   │   │   ├── Analytics.js # Analytics dashboard
    │   │   │   └── Settings.js  # Application settings
    │   │   ├── App.js           # Main App component
    │   │   ├── index.js         # React entry point
    │   │   └── index.css        # Global styles
    │   ├── package.json         # Frontend dependencies
    │   └── node_modules/        # Frontend packages
    ├── Backend/                  # Node.js Backend Application
    │   ├── models/              # Database models
    │   │   ├── User.js          # User model (Admin, Supervisor, Telecaller)
    │   │   ├── Lead.js          # Lead model with Meta integration
    │   │   ├── Call.js          # Call tracking model
    │   │   └── Report.js        # Daily reporting model
    │   ├── routes/              # API routes
    │   │   ├── auth.js          # Authentication routes
    │   │   ├── users.js         # User management routes
    │   │   ├── leads.js         # Lead management routes
    │   │   ├── calls.js         # Call tracking routes
    │   │   ├── reports.js       # Reporting routes
    │   │   └── meta.js          # Meta/Facebook integration routes
    │   ├── middleware/          # Custom middleware
    │   │   └── auth.js          # JWT authentication middleware
    │   ├── scripts/             # Utility scripts
    │   │   └── seedDatabase.js  # Database seeding script
    │   ├── .env                 # Environment variables (created from .env.example)
    │   ├── .env.example         # Environment template
    │   ├── index.js             # Backend server entry point
    │   ├── package.json         # Backend dependencies
    │   └── node_modules/        # Backend packages
    ├── package.json             # Main project configuration
    ├── README.md               # Project documentation
    ├── PROJECT_SETUP_GUIDE.md  # This file
    └── node_modules/           # Root-level packages
```

## 🛠️ Technology Stack

### Frontend Technologies
- **React 18** - Modern UI framework with hooks and functional components
- **Material-UI (MUI)** - Professional component library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API communication
- **Socket.IO Client** - Real-time communication
- **React Hook Form** - Form state management
- **React Hot Toast** - User notifications
- **Recharts** - Data visualization and charts
- **Day.js** - Date manipulation library

### Backend Technologies
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.IO** - Real-time bidirectional communication
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - API rate limiting
- **Multer** - File upload handling
- **XLSX** - Excel file generation
- **PDFKit** - PDF generation
- **Axios** - HTTP client for external APIs

## 🚀 Complete Setup Instructions

### Step 1: Prerequisites Installation

Before starting, ensure you have the following installed:

1. **Node.js (v14 or higher)**
   ```bash
   # Check Node.js version
   node --version
   
   # If not installed, download from https://nodejs.org/
   ```

2. **MongoDB (v4.4 or higher)**
   ```bash
   # For Ubuntu/Debian
   sudo apt update
   curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
   echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   sudo apt update
   sudo apt install -y mongodb-org
   
   # For macOS
   brew install mongodb/brew/mongodb-community
   
   # For Windows
   # Download from https://www.mongodb.com/try/download/community
   ```

3. **Git (optional, for version control)**
   ```bash
   git --version
   ```

### Step 2: Project Setup

1. **Navigate to the project directory**
   ```bash
   cd Telecaller
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```
   This command will install:
   - Root level dependencies (concurrently)
   - Backend dependencies (Express, MongoDB, etc.)
   - Frontend dependencies (React, Material-UI, etc.)

### Step 3: Database Setup

1. **Start MongoDB**
   ```bash
   # For systems with systemd (Ubuntu/Debian)
   sudo systemctl start mongod
   sudo systemctl enable mongod
   
   # For macOS
   brew services start mongodb/brew/mongodb-community
   
   # Manual start (if systemd not available)
   sudo mkdir -p /var/lib/mongodb
   sudo chown mongodb:mongodb /var/lib/mongodb
   sudo mkdir -p /var/log/mongodb
   sudo chown mongodb:mongodb /var/log/mongodb
   sudo -u mongodb mongod --dbpath /var/lib/mongodb --logpath /var/log/mongodb/mongod.log --fork
   ```

2. **Verify MongoDB is running**
   ```bash
   mongosh --eval "db.runCommand({ping: 1})"
   ```
   You should see: `{ ok: 1 }`

3. **Seed the database with initial users**
   ```bash
   npm run seed
   ```

### Step 4: Environment Configuration

1. **Backend Environment Setup**
   ```bash
   cd Backend
   cp .env.example .env
   ```

2. **Edit the .env file** (Backend/.env)
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/telecaller-app
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Client URL
   CLIENT_URL=http://localhost:3000
   
   # Meta/Facebook API Configuration (Optional)
   FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
   FACEBOOK_VERIFY_TOKEN=your_facebook_verify_token
   FACEBOOK_PAGE_ID=your_facebook_page_id
   FACEBOOK_AD_ACCOUNT_ID=your_facebook_ad_account_id
   
   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   
   # Email Configuration (Optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

### Step 5: Running the Application

1. **Start the development servers**
   ```bash
   # From the Telecaller directory
   npm run dev
   ```
   This will start both:
   - Backend server on http://localhost:5000
   - Frontend server on http://localhost:3000

2. **Alternative: Start servers separately**
   ```bash
   # Terminal 1: Start Backend only
   npm run server
   
   # Terminal 2: Start Frontend only
   npm run client
   ```

### Step 6: Access the Application

1. **Open your web browser**
2. **Navigate to** http://localhost:3000
3. **Login with default credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@telecaller.com | admin123 |
| Supervisor | supervisor@telecaller.com | supervisor123 |
| Telecaller | telecaller@telecaller.com | telecaller123 |

## 🎯 Features Overview

### 🔐 Authentication System
- JWT-based authentication
- Role-based access control (Admin, Supervisor, Telecaller)
- Password hashing with bcryptjs
- Session management

### 👥 User Management
- Multi-role user system
- User profile management
- Team hierarchy (Supervisor → Telecallers)
- Performance tracking

### 📞 Lead Management
- Automatic lead assignment
- Meta/Facebook ad integration
- Lead scoring and prioritization
- Status tracking and conversion

### 📱 Call Tracking
- Comprehensive call logging
- Duration and outcome tracking
- Call history and analytics
- Performance metrics

### 📊 Reporting System
- Daily activity reports
- Performance analytics
- Excel/PDF export functionality
- Supervisor review workflow

### 🔄 Real-time Features
- Socket.IO for live updates
- Real-time lead assignments
- Live notification system
- Team status updates

### 📈 Analytics Dashboard
- Performance metrics
- Conversion tracking
- Team statistics
- Visual charts and graphs

## 🔧 Available Scripts

### Root Level Scripts
```bash
# Install all dependencies (root, backend, frontend)
npm run install-all

# Start both frontend and backend in development mode
npm run dev

# Start only the backend server
npm run server

# Start only the frontend development server
npm run client

# Build frontend for production
npm run build

# Seed database with initial users
npm run seed

# Start backend in production mode
npm start
```

### Backend Specific Scripts
```bash
cd Backend

# Start backend with nodemon (auto-restart on changes)
npm run dev

# Start backend normally
npm start

# Seed database
npm run seed
```

### Frontend Specific Scripts
```bash
cd Frontend

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App (not recommended)
npm run eject
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Admin only)
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout
- `PUT /api/auth/change-password` - Change password
- `PUT /api/auth/status` - Update user status

### User Management
- `GET /api/users` - Get all users (with filtering)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/team` - Get team members (Supervisor)
- `GET /api/users/:id/analytics` - Get user performance analytics

### Lead Management
- `GET /api/leads` - Get leads (with filtering and pagination)
- `GET /api/leads/:id` - Get specific lead details
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead information
- `PUT /api/leads/:id/assign` - Reassign lead
- `DELETE /api/leads/:id` - Delete lead (Supervisor/Admin)
- `GET /api/leads/dashboard` - User-specific lead dashboard

### Call Management
- `GET /api/calls` - Get call logs (with filtering)
- `GET /api/calls/:id` - Get specific call details
- `POST /api/calls` - Create new call log
- `PUT /api/calls/:id` - Update call information
- `PUT /api/calls/:id/review` - Review call (Supervisor/Admin)
- `DELETE /api/calls/:id` - Delete call log (Admin only)
- `GET /api/calls/dashboard` - User-specific call dashboard

### Reports
- `GET /api/reports` - Get reports (with filtering)
- `GET /api/reports/:id` - Get specific report
- `POST /api/reports` - Create/update daily report
- `PUT /api/reports/:id/submit` - Submit report for review
- `PUT /api/reports/:id/review` - Review report (Supervisor/Admin)
- `GET /api/reports/today` - Get today's report for current user
- `GET /api/reports/analytics` - Team analytics
- `GET /api/reports/export` - Export reports (Excel/PDF)

### Meta Integration
- `POST /api/meta/webhook` - Facebook webhook endpoint
- `GET /api/meta/webhook` - Webhook verification
- `GET /api/meta/leads` - Fetch Meta leads
- `POST /api/meta/process-lead` - Process Meta lead
- `GET /api/meta/campaigns` - Get Facebook campaigns
- `GET /api/meta/forms` - Get lead generation forms
- `POST /api/meta/test-lead` - Create test lead
- `GET /api/meta/stats` - Meta integration statistics

## 🔒 Security Features

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control
- Password hashing with bcryptjs
- Session management
- Token expiration handling

### API Security
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation with Express Validator
- SQL injection prevention (using Mongoose)

### Data Protection
- Password encryption
- Sensitive data masking
- Environment variable protection
- File upload security

## 🚀 Production Deployment

### Build for Production
```bash
# Build frontend
npm run build

# Set environment variables for production
export NODE_ENV=production
export MONGODB_URI=your-production-mongodb-uri
export JWT_SECRET=your-production-jwt-secret

# Start production server
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/telecaller-app
JWT_SECRET=your-super-secure-production-jwt-secret
CLIENT_URL=https://your-domain.com
PORT=5000
```

### Deployment Platforms
- **Heroku**: Easy deployment with Git integration
- **DigitalOcean**: VPS deployment with PM2
- **AWS**: EC2 instance with Load Balancer
- **Netlify/Vercel**: Frontend deployment (static build)
- **MongoDB Atlas**: Cloud database hosting

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Check if MongoDB is running
   sudo systemctl status mongod
   
   # Start MongoDB
   sudo systemctl start mongod
   
   # Check connection
   mongosh
   ```

2. **Port Already in Use**
   ```bash
   # Kill process on port 5000
   sudo lsof -t -i tcp:5000 | xargs kill -9
   
   # Kill process on port 3000
   sudo lsof -t -i tcp:3000 | xargs kill -9
   ```

3. **Permission Errors**
   ```bash
   # Fix npm permissions
   sudo chown -R $(whoami) ~/.npm
   
   # Clear npm cache
   npm cache clean --force
   ```

4. **Dependencies Installation Issues**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Or use npm ci for clean install
   npm ci
   ```

### Logs and Debugging

1. **Backend Logs**
   ```bash
   # Check backend logs
   cd Backend
   npm run server
   ```

2. **Frontend Logs**
   ```bash
   # Check frontend logs
   cd Frontend
   npm start
   ```

3. **Database Logs**
   ```bash
   # MongoDB logs
   sudo tail -f /var/log/mongodb/mongod.log
   ```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Standards
- Use ESLint for code linting
- Follow React best practices
- Use consistent naming conventions
- Write clear commit messages
- Add comments for complex logic

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Check the troubleshooting section above
- Review the API documentation
- Contact the development team

---

**TeleCaller CRM - Made with ❤️ for efficient telecaller management**

Last Updated: $(date)
Version: 1.0.0