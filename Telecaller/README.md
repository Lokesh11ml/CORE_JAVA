# TeleCaller CRM Application

A comprehensive centralized telecaller application designed for staff management, Meta ads integration, call tracking, and reporting.

## 📁 Project Structure

```
Telecaller/
├── Frontend/           # React.js Frontend Application
│   ├── public/         # Static files
│   ├── src/           # Source code
│   │   ├── components/ # Reusable components
│   │   ├── contexts/   # React Context providers
│   │   ├── pages/      # Page components
│   │   └── App.js      # Main App component
│   └── package.json    # Frontend dependencies
├── Backend/            # Node.js Backend Application
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── scripts/        # Utility scripts
│   └── index.js        # Server entry point
├── package.json        # Main project configuration
└── README.md          # This file
```

## 🚀 Features

- **Multi-User Access**: Role-based authentication (Admin, Supervisor, Telecaller)
- **Meta Ad Integration**: Real-time lead reception from Facebook/Instagram ads
- **Automatic Call Assignment**: Smart lead distribution to available telecallers
- **Call History Tracking**: Comprehensive call logging and analytics
- **Daily Task Reporting**: In-app reports with Excel/PDF export
- **Admin Dashboard**: Performance monitoring and team management
- **Real-time Communication**: WebSocket-based notifications and updates

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Material-UI (MUI)** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **React Hook Form** - Form management
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Navigate to project directory
cd Telecaller

# Install all dependencies (root, frontend, and backend)
npm run install-all
```

### 2. Environment Setup
Create a `.env` file in the `Backend` directory:
```bash
cd Backend
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/telecaller-app
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
CLIENT_URL=http://localhost:3000

# Meta/Facebook API (Optional)
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
FACEBOOK_VERIFY_TOKEN=your_facebook_verify_token
FACEBOOK_PAGE_ID=your_facebook_page_id
FACEBOOK_AD_ACCOUNT_ID=your_facebook_ad_account_id
```

### 3. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# For systems with systemd
sudo systemctl start mongod

# Or start manually
mongod --dbpath /path/to/your/db
```

### 4. Seed Database
```bash
npm run seed
```

### 5. Run the Application
```bash
# Start both frontend and backend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 👥 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@telecaller.com | admin123 |
| Supervisor | supervisor@telecaller.com | supervisor123 |
| Telecaller | telecaller@telecaller.com | telecaller123 |

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Admin only)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Lead Management
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Call Management
- `GET /api/calls` - Get call logs
- `POST /api/calls` - Create call log
- `PUT /api/calls/:id` - Update call

### User Management
- `GET /api/users` - Get all users
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Reports
- `GET /api/reports` - Get reports
- `POST /api/reports` - Create report
- `GET /api/reports/export` - Export reports

## 🔧 Development Scripts

```bash
# Install all dependencies
npm run install-all

# Start development servers
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Build frontend for production
npm run build

# Seed database with initial data
npm run seed

# Start production server
npm start
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Environment Variables
Ensure all production environment variables are set in your deployment environment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team.

---

**Made with ❤️ for efficient telecaller management**