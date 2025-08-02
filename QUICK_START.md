# 🚀 Quick Start Guide - Telecaller CRM

Get your telecaller CRM system up and running in minutes!

## ⚡ Quick Setup (5 minutes)

### 1. Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git

### 2. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd telecaller-crm

# Run the setup script
chmod +x setup.sh
./setup.sh
```

### 3. Configure Environment
Edit `server/.env` with your settings:
```env
MONGODB_URI=mongodb://localhost:27017/telecaller-app
JWT_SECRET=your-super-secret-key-here
```

### 4. Start the Application
```bash
npm run dev
```

### 5. Access the System
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### 6. Login Credentials
- **Admin**: admin@telecaller.com / admin123
- **Supervisor**: supervisor@telecaller.com / supervisor123
- **Telecallers**: alice@telecaller.com, bob@telecaller.com, carol@telecaller.com / telecaller123

## 🎯 What You Get

### ✅ Multi-User Access
- **Admin**: Full system control
- **Supervisor**: Team management
- **Telecaller**: Lead management and calling

### ✅ Lead Management
- Add leads manually or via Meta Ads
- Automatic lead assignment
- Lead scoring and prioritization
- Follow-up scheduling

### ✅ Calling System
- One-click calling via Twilio
- Automatic call recording
- Real-time call status
- Call analytics

### ✅ Reporting
- Daily activity reports
- Performance analytics
- Excel/PDF exports
- Real-time dashboard

### ✅ Meta Ads Integration
- Real-time lead capture
- Automatic processing
- Campaign tracking

## 🔧 Advanced Configuration

### Twilio Setup (for calling)
1. Create a Twilio account
2. Get your credentials from Twilio Console
3. Add to `server/.env`:
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Meta Ads Setup (for lead capture)
1. Create a Meta App
2. Configure webhook URL: `https://your-domain.com/api/meta/webhook`
3. Add to `server/.env`:
```env
META_APP_SECRET=your-app-secret
META_WEBHOOK_SECRET=your-webhook-secret
```

## 📱 Using the System

### For Telecallers
1. **Login** with your credentials
2. **View assigned leads** on your dashboard
3. **Make calls** by clicking the "Call" button
4. **Update lead status** after each call
5. **Submit daily reports** with your activities

### For Supervisors
1. **Monitor team performance** on dashboard
2. **Assign leads manually** if needed
3. **View team reports** and analytics
4. **Manage team members** and their performance

### For Admins
1. **Manage all users** and their roles
2. **View system-wide analytics**
3. **Generate comprehensive reports**
4. **Configure system settings**
5. **Monitor Meta Ads integration**

## 🔄 Daily Workflow

### Morning
1. Login to the system
2. Check assigned leads
3. Review daily targets
4. Start making calls

### During the Day
1. Make calls to assigned leads
2. Update lead status after each call
3. Schedule follow-ups if needed
4. Add notes and observations

### Evening
1. Submit daily report
2. Review performance metrics
3. Plan follow-ups for tomorrow
4. Logout from system

## 📊 Key Features

### Lead Management
- **Add Leads**: Manual entry or Meta Ads import
- **Auto-Assignment**: Smart distribution based on workload
- **Lead Scoring**: Automatic prioritization
- **Follow-up Tracking**: Never miss a follow-up

### Calling System
- **One-Click Calling**: Direct integration with Twilio
- **Call Recording**: Automatic recording of all calls
- **Real-time Status**: Live call status updates
- **Call Analytics**: Performance tracking

### Reporting
- **Daily Reports**: Track daily activities
- **Performance Analytics**: Monitor KPIs
- **Export Options**: Excel and PDF reports
- **Real-time Dashboard**: Live system overview

### Team Management
- **Role-based Access**: Secure permissions
- **Team Performance**: Individual and team metrics
- **Lead Distribution**: Fair workload distribution
- **Activity Tracking**: Monitor team activities

## 🚨 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```bash
# Start MongoDB
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:5.0
```

#### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=5001
```

#### Node Modules Error
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database Seeding Error
```bash
# Manually seed database
cd server
node scripts/seedDatabase.js
```

### Getting Help
1. Check the logs in `server/logs/`
2. Review the API documentation
3. Check the README.md file
4. Create an issue in the repository

## 🔒 Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use strong JWT secrets
- Rotate secrets regularly
- Use different secrets for production

### User Management
- Change default passwords
- Use strong passwords
- Regularly review user access
- Deactivate unused accounts

### Data Protection
- Regular database backups
- Secure file uploads
- Input validation
- Rate limiting

## 📈 Performance Tips

### Database Optimization
- Create indexes for frequently queried fields
- Regular database maintenance
- Monitor query performance
- Archive old data

### Application Performance
- Enable compression
- Use caching where appropriate
- Monitor memory usage
- Regular log cleanup

### Network Optimization
- Use CDN for static assets
- Enable gzip compression
- Optimize API responses
- Monitor response times

## 🔄 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker (Optional)
```bash
# Build Docker image
docker build -t telecaller-crm .

# Run container
docker run -p 5000:5000 telecaller-crm
```

## 📞 Support

### Documentation
- **API Documentation**: See `API_DOCUMENTATION.md`
- **README**: Complete system overview
- **Code Comments**: Inline documentation

### Community
- Create issues for bugs
- Submit feature requests
- Share your experience
- Contribute to the project

### Contact
- Email: support@telecaller.com
- GitHub: Create an issue
- Documentation: Check the docs folder

---

**🎉 You're all set!** Your telecaller CRM system is ready to boost your team's productivity and track leads effectively.

**Next Steps:**
1. Explore the dashboard
2. Add your first leads
3. Configure Twilio for calling
4. Set up Meta Ads integration
5. Train your team on the system

**Happy Telecalling! 🚀**