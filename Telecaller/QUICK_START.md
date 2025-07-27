# TeleCaller CRM - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Install Dependencies
```bash
cd Telecaller
npm run install-all
```

### 2. Start MongoDB
```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand({ping: 1})"

# If not running, start it:
sudo systemctl start mongod
# OR manually:
sudo -u mongodb mongod --dbpath /var/lib/mongodb --logpath /var/log/mongodb/mongod.log --fork
```

### 3. Setup Environment
```bash
cd Backend
cp .env.example .env
# Edit .env if needed (default settings work for local development)
```

### 4. Seed Database
```bash
cd .. # Back to Telecaller directory
npm run seed
```

### 5. Start Application
```bash
npm run dev
```

### 6. Access Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 👥 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@telecaller.com | admin123 |
| Supervisor | supervisor@telecaller.com | supervisor123 |
| Telecaller | telecaller@telecaller.com | telecaller123 |

## 📁 Project Structure
```
Telecaller/
├── Frontend/    # React app (port 3000)
├── Backend/     # Node.js API (port 5000)
├── package.json # Main project config
└── README.md    # Full documentation
```

## 🔧 Common Commands

```bash
# Start both servers
npm run dev

# Start only backend
npm run server

# Start only frontend  
npm run client

# Build for production
npm run build

# Seed database
npm run seed
```

## 🆘 Quick Troubleshooting

**MongoDB won't start?**
```bash
sudo systemctl status mongod
sudo systemctl start mongod
```

**Port already in use?**
```bash
sudo lsof -t -i tcp:3000 | xargs kill -9
sudo lsof -t -i tcp:5000 | xargs kill -9
```

**Dependencies issues?**
```bash
rm -rf node_modules package-lock.json
npm run install-all
```

## 📖 More Info
See `PROJECT_SETUP_GUIDE.md` for complete documentation.

---
**Happy Coding! 🎉**