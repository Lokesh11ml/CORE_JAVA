# 🚀 Quick Start Guide - Telecaller CRM

Get your Telecaller CRM up and running in minutes!

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Installation guide](https://docs.mongodb.com/manual/installation/)
- **Git** (for cloning the repository)

## 🎯 Quick Setup (Recommended)

### Option 1: Automated Setup (Easiest)

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd telecaller-app
   ```

2. **Run the automated setup script**:
   ```bash
   ./setup.sh
   ```

   This script will:
   - Check prerequisites
   - Install all dependencies
   - Set up environment files
   - Start MongoDB
   - Seed the database with sample data
   - Start the application

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Option 2: Manual Setup

If you prefer to set up manually or the automated script doesn't work:

#### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

#### 2. Set Up Environment Files

**Server Environment** (`server/.env`):
```env
MONGODB_URI=mongodb://localhost:27017/telecaller-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Client Environment** (`client/.env`):
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_VERSION=1.0.0
```

#### 3. Start MongoDB

```bash
# Start MongoDB (if installed locally)
mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:5.0
```

#### 4. Seed the Database

```bash
npm run seed
```

#### 5. Start the Application

```bash
# Start both server and client
npm run dev

# Or start them separately:
# Terminal 1: npm run server
# Terminal 2: npm run client
```

## 🔑 Default Login Credentials

After setup, you can log in with these default accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@telecaller.com | admin123 |
| **Supervisor** | supervisor@telecaller.com | supervisor123 |
| **Telecaller** | alice@telecaller.com | telecaller123 |

## 🎯 What You'll Get

### ✅ Complete Features
- **Multi-User Access**: Admin, Supervisor, and Telecaller roles
- **Lead Management**: Full CRUD operations with filtering and search
- **Call Tracking**: Log calls, track outcomes, and manage follow-ups
- **Real-time Updates**: Live notifications and dashboard updates
- **Reporting System**: Daily reports with Excel/PDF export
- **Meta Ads Integration**: Webhook endpoint for lead capture
- **Admin Dashboard**: Comprehensive analytics and team management

### 📊 Sample Data
The setup includes sample data:
- 5 users (1 admin, 1 supervisor, 3 telecallers)
- 5 sample leads with different statuses
- 3 sample calls with outcomes
- Daily reports for each telecaller

## 🚀 Development Commands

```bash
# Start development server (both frontend and backend)
npm run dev

# Start only the backend server
npm run server

# Start only the frontend client
npm run client

# Seed database with sample data
npm run seed

# Build for production
npm run build

# Install all dependencies
npm run install-all
```

## 🔧 Configuration

### Environment Variables

**Server Configuration** (`server/.env`):
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
```

### Database Configuration

The application uses MongoDB. Make sure MongoDB is running on the default port (27017).

## 🐛 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB if not running
mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb
```

**2. Port Already in Use**
```bash
# Check what's using the port
lsof -i :5000
lsof -i :3000

# Kill the process or change ports in .env files
```

**3. Node Modules Issues**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
rm -rf server/node_modules server/package-lock.json
rm -rf client/node_modules client/package-lock.json
npm run install-all
```

**4. Build Errors**
```bash
# Clear cache and rebuild
cd client
npm run build -- --reset-cache
```

### Getting Help

1. **Check the logs**: Look at the console output for error messages
2. **Verify prerequisites**: Ensure Node.js and MongoDB are properly installed
3. **Check environment files**: Make sure all required environment variables are set
4. **Database connection**: Ensure MongoDB is running and accessible

## 📱 Features Overview

### 🔐 Authentication & Roles
- **Admin**: Full system access, user management, analytics
- **Supervisor**: Team management, performance monitoring
- **Telecaller**: Lead management, call logging, reports

### 📊 Dashboard
- Real-time analytics and metrics
- Lead pipeline visualization
- Team performance charts
- Recent activity feed

### 👥 Lead Management
- Create, edit, and delete leads
- Filter and search functionality
- Status tracking and assignment
- Priority and quality scoring

### 📞 Call Management
- Log calls with outcomes
- Track call duration and quality
- Schedule follow-ups
- Call history and notes

### 📈 Reporting
- Daily activity reports
- Performance metrics
- Excel and PDF export
- Goal tracking

### 🔗 Meta Integration
- Webhook endpoint for lead capture
- Automatic lead creation
- Campaign tracking

## 🚀 Production Deployment

For production deployment, consider:

1. **Environment Variables**: Set production values for all environment variables
2. **Database**: Use a production MongoDB instance (Atlas, AWS, etc.)
3. **SSL**: Set up HTTPS certificates
4. **Process Management**: Use PM2 or similar
5. **Monitoring**: Set up logging and monitoring

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the README.md for detailed documentation
3. Check the console logs for error messages
4. Ensure all prerequisites are properly installed

## 🎉 Success!

Once everything is running, you should see:

- ✅ Server running on http://localhost:5000
- ✅ Client running on http://localhost:3000
- ✅ Database seeded with sample data
- ✅ Real-time features working
- ✅ All user roles accessible

**Happy Telecalling! 🎯**