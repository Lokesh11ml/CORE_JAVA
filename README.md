# Telecaller CRM System

A comprehensive CRM system for managing telecalling teams with automated lead assignment, Meta Ads integration, Twilio calling, and real-time reporting.

## 🚀 Features

### 🔢 Multi-User Telecaller Access
- **Role-based access**: Admin, Supervisor, and Telecaller roles
- **Secure authentication** with JWT tokens
- **Real-time status updates** for team members
- **Activity tracking** and performance metrics

### 🧾 Lead Management
- **Comprehensive lead tracking** with status updates
- **Automated lead assignment** based on workload and performance
- **Lead scoring** and priority classification
- **Follow-up scheduling** and reminders
- **Lead history** and interaction logs

### 📱 Meta Ads Integration
- **Real-time lead capture** from Facebook/Instagram ads
- **Automatic lead processing** and assignment
- **Campaign performance tracking**
- **Custom field mapping** and lead qualification
- **Webhook signature verification** for security

### 🤖 Automated Lead Distribution
- **Smart assignment algorithm** based on workload and performance
- **Automatic reassignment** for unresponsive leads
- **Performance-based scoring** for optimal distribution
- **Manual override** capabilities for admins/supervisors

### 📞 Call Logs & Twilio Integration
- **One-click calling** from the CRM interface
- **Automatic call recording** and storage
- **Real-time call status** updates
- **Call analytics** and performance metrics
- **Webhook processing** for call events

### 📊 Daily Task & Lead Reporting
- **Daily activity reports** for telecallers
- **Performance tracking** and metrics
- **Conversion rate analysis**
- **Team productivity insights**

### 🎛️ Admin Dashboard
- **Real-time analytics** and KPIs
- **Team performance monitoring**
- **Lead distribution visualization**
- **System health monitoring**
- **User activity tracking**

### 📄 Excel and PDF Report Export
- **Comprehensive reporting** in multiple formats
- **Custom date ranges** and filters
- **Performance analytics** and insights
- **Automated report generation**
- **Scheduled report delivery**

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **Twilio** for calling functionality
- **JWT** for authentication
- **PDFKit** and **XLSX** for report generation

### Frontend
- **React.js** with hooks
- **Material-UI** for components
- **Recharts** for data visualization
- **Socket.io-client** for real-time updates
- **React Router** for navigation
- **React Hook Form** for form handling

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Twilio account
- Meta Ads account (for ads integration)

### 1. Clone the repository
```bash
git clone <repository-url>
cd telecaller-crm
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 3. Environment Configuration
```bash
# Copy environment file
cp server/.env.example server/.env

# Edit the environment file with your configuration
nano server/.env
```

### 4. Database Setup
```bash
# Start MongoDB (if not running)
mongod

# Seed the database with initial data
npm run seed
```

### 5. Start the application
```bash
# Development mode (both server and client)
npm run dev

# Production mode
npm run build
npm start
```

## 🔧 Configuration

### Environment Variables

#### Server Configuration
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
BASE_URL=http://localhost:5000
```

#### Database
```env
MONGODB_URI=mongodb://localhost:27017/telecaller-app
```

#### Authentication
```env
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
```

#### Twilio Configuration
```env
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_SECRET=your-twilio-webhook-secret
```

#### Meta Ads Configuration
```env
META_APP_SECRET=your-meta-app-secret
META_WEBHOOK_SECRET=your-meta-webhook-secret
META_ACCESS_TOKEN=your-meta-access-token
```

## 📱 Usage

### User Roles

#### Admin
- Manage all users and teams
- View system-wide analytics
- Generate comprehensive reports
- Configure system settings
- Monitor all activities

#### Supervisor
- Monitor team performance
- Assign leads manually
- View team reports
- Manage team members
- Track team metrics

#### Telecaller
- View assigned leads
- Make calls through the system
- Update lead status
- Submit daily reports
- Track personal performance

### Lead Management

#### Adding Leads
1. **Manual Entry**: Add leads through the web interface
2. **Meta Ads**: Automatic import via webhook
3. **Bulk Import**: Upload CSV files

#### Lead Assignment
- **Automatic**: Based on workload and performance
- **Manual**: Admin/supervisor override
- **Reassignment**: Automatic for unresponsive leads

#### Lead Tracking
- Status updates (New → Contacted → Qualified → Converted)
- Follow-up scheduling
- Interaction history
- Performance metrics

### Calling System

#### Making Calls
1. Click "Call" button next to a lead
2. System initiates call via Twilio
3. Call is automatically recorded
4. Status updates in real-time
5. Call logs are saved automatically

#### Call Management
- View call history
- Listen to recordings
- Add call notes
- Track call metrics

### Reporting

#### Daily Reports
- Telecallers submit daily activity reports
- Track calls made, follow-ups, conversions
- Add notes and blockers

#### Analytics Dashboard
- Real-time performance metrics
- Team comparison charts
- Lead conversion trends
- Call success rates

#### Export Reports
- Excel format for detailed analysis
- PDF format for presentations
- Custom date ranges
- Filtered data export

## 🔌 API Documentation

### Authentication
```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
```

### Users
```http
GET /api/users
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
```

### Leads
```http
GET /api/leads
POST /api/leads
PUT /api/leads/:id
DELETE /api/leads/:id
```

### Calls
```http
GET /api/calls
POST /api/calls/initiate
GET /api/calls/:id
PUT /api/calls/:id
```

### Reports
```http
GET /api/reports
POST /api/reports
GET /api/reports/export/:type
```

### Meta Ads
```http
POST /api/meta/webhook
GET /api/meta/stats
GET /api/meta/campaigns
```

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Role-based access control** (RBAC)
- **Input validation** and sanitization
- **Rate limiting** to prevent abuse
- **CORS configuration** for secure cross-origin requests
- **Helmet.js** for security headers
- **Webhook signature verification** for Meta Ads

## 📊 Monitoring & Analytics

### Real-time Metrics
- Active users count
- Calls in progress
- Lead assignment status
- System performance

### Performance Tracking
- Call success rates
- Lead conversion rates
- Team productivity
- Response times

### System Health
- Database connection status
- API response times
- Error rates
- Resource usage

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build the client
npm run build

# Start the server
npm start
```

### Docker (Optional)
```bash
# Build the image
docker build -t telecaller-crm .

# Run the container
docker run -p 5000:5000 telecaller-crm
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation

## 🔄 Updates & Maintenance

### Regular Maintenance
- Database cleanup (old leads, reports)
- Log rotation
- Performance monitoring
- Security updates

### Backup Strategy
- Database backups
- File storage backups
- Configuration backups
- Disaster recovery plan

---

**Built with ❤️ for efficient telecalling team management**
