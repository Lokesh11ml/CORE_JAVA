#!/bin/bash

# Telecaller CRM System Setup Script
# This script will help you set up the complete CRM system

set -e

echo "🚀 Telecaller CRM System Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        print_success "Node.js is installed (version $NODE_VERSION)"
        
        # Check if version is 14 or higher
        if [[ $(echo "$NODE_VERSION" | cut -d'.' -f1) -ge 14 ]]; then
            print_success "Node.js version is compatible"
        else
            print_error "Node.js version $NODE_VERSION is too old. Please install version 14 or higher."
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js version 14 or higher."
        print_status "You can download it from: https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed (version $NPM_VERSION)"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Check if MongoDB is installed
check_mongodb() {
    print_status "Checking MongoDB installation..."
    if command -v mongod &> /dev/null; then
        print_success "MongoDB is installed"
    else
        print_warning "MongoDB is not installed or not in PATH."
        print_status "Please install MongoDB from: https://docs.mongodb.com/manual/installation/"
        print_status "Or use MongoDB Atlas (cloud service)"
        read -p "Do you want to continue without MongoDB? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    print_status "Installing root dependencies..."
    npm install
    
    # Install server dependencies
    print_status "Installing server dependencies..."
    cd server
    npm install
    cd ..
    
    # Install client dependencies
    print_status "Installing client dependencies..."
    cd client
    npm install
    cd ..
    
    print_success "All dependencies installed successfully"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment configuration..."
    
    # Create server .env file
    if [ ! -f server/.env ]; then
        cp server/.env.example server/.env
        print_success "Created server/.env file"
    else
        print_warning "server/.env already exists, skipping..."
    fi
    
    # Create client .env file if needed
    if [ ! -f client/.env ]; then
        echo "REACT_APP_API_URL=http://localhost:5000" > client/.env
        print_success "Created client/.env file"
    else
        print_warning "client/.env already exists, skipping..."
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if MongoDB is running
    if pgrep -x "mongod" > /dev/null; then
        print_success "MongoDB is running"
    else
        print_warning "MongoDB is not running. Starting MongoDB..."
        mongod --fork --logpath /tmp/mongodb.log
        sleep 3
    fi
    
    # Seed database
    print_status "Seeding database with initial data..."
    npm run seed
    print_success "Database seeded successfully"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create uploads directory
    mkdir -p server/uploads
    print_success "Created server/uploads directory"
    
    # Create reports directory
    mkdir -p server/reports
    print_success "Created server/reports directory"
    
    # Create logs directory
    mkdir -p server/logs
    print_success "Created server/logs directory"
}

# Setup Git hooks (optional)
setup_git_hooks() {
    if [ -d ".git" ]; then
        print_status "Setting up Git hooks..."
        
        # Create pre-commit hook
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."
npm run lint
npm run test
EOF
        
        chmod +x .git/hooks/pre-commit
        print_success "Git hooks configured"
    fi
}

# Display configuration instructions
show_configuration_instructions() {
    echo
    echo "🔧 Configuration Instructions"
    echo "============================"
    echo
    echo "1. Edit server/.env file with your configuration:"
    echo "   - Set your MongoDB connection string"
    echo "   - Configure JWT secret"
    echo "   - Add Twilio credentials (for calling feature)"
    echo "   - Add Meta Ads credentials (for ads integration)"
    echo
    echo "2. Edit client/.env file:"
    echo "   - Set the API URL (default: http://localhost:5000)"
    echo
    echo "3. Required environment variables:"
    echo "   - MONGODB_URI: Your MongoDB connection string"
    echo "   - JWT_SECRET: A secure random string for JWT tokens"
    echo "   - TWILIO_ACCOUNT_SID: Your Twilio account SID"
    echo "   - TWILIO_AUTH_TOKEN: Your Twilio auth token"
    echo "   - TWILIO_PHONE_NUMBER: Your Twilio phone number"
    echo "   - META_APP_SECRET: Your Meta app secret"
    echo "   - META_WEBHOOK_SECRET: Your Meta webhook secret"
    echo
}

# Display startup instructions
show_startup_instructions() {
    echo
    echo "🚀 Startup Instructions"
    echo "======================"
    echo
    echo "1. Start the development server:"
    echo "   npm run dev"
    echo
    echo "2. Or start server and client separately:"
    echo "   # Terminal 1 - Start server"
    echo "   cd server && npm run dev"
    echo
    echo "   # Terminal 2 - Start client"
    echo "   cd client && npm start"
    echo
    echo "3. Access the application:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:5000"
    echo
    echo "4. Default admin credentials:"
    echo "   - Email: admin@telecaller.com"
    echo "   - Password: admin123"
    echo
}

# Display feature overview
show_feature_overview() {
    echo
    echo "📋 Feature Overview"
    echo "==================="
    echo
    echo "✅ Multi-User Telecaller Access"
    echo "   - Role-based authentication (Admin, Supervisor, Telecaller)"
    echo "   - Secure JWT token management"
    echo "   - Real-time status updates"
    echo
    echo "✅ Lead Management"
    echo "   - Comprehensive lead tracking"
    echo "   - Automated lead assignment"
    echo "   - Lead scoring and priority classification"
    echo "   - Follow-up scheduling"
    echo
    echo "✅ Meta Ads Integration"
    echo "   - Real-time lead capture from Facebook/Instagram ads"
    echo "   - Automatic lead processing and assignment"
    echo "   - Campaign performance tracking"
    echo
    echo "✅ Automated Lead Distribution"
    echo "   - Smart assignment algorithm"
    echo "   - Automatic reassignment for unresponsive leads"
    echo "   - Performance-based scoring"
    echo
    echo "✅ Call Logs & Twilio Integration"
    echo "   - One-click calling from CRM"
    echo "   - Automatic call recording"
    echo "   - Real-time call status updates"
    echo
    echo "✅ Daily Task & Lead Reporting"
    echo "   - Daily activity reports"
    echo "   - Performance tracking"
    echo "   - Conversion rate analysis"
    echo
    echo "✅ Admin Dashboard"
    echo "   - Real-time analytics"
    echo "   - Team performance monitoring"
    echo "   - Lead distribution visualization"
    echo
    echo "✅ Excel and PDF Report Export"
    echo "   - Comprehensive reporting"
    echo "   - Custom date ranges and filters"
    echo "   - Automated report generation"
    echo
}

# Main setup function
main() {
    echo "Starting setup process..."
    echo
    
    # Run checks
    check_nodejs
    check_npm
    check_mongodb
    
    # Install dependencies
    install_dependencies
    
    # Setup environment
    setup_environment
    
    # Create directories
    create_directories
    
    # Setup database
    setup_database
    
    # Setup Git hooks
    setup_git_hooks
    
    # Display instructions
    show_configuration_instructions
    show_startup_instructions
    show_feature_overview
    
    echo
    print_success "Setup completed successfully! 🎉"
    echo
    echo "Next steps:"
    echo "1. Configure your environment variables in server/.env"
    echo "2. Start the application with: npm run dev"
    echo "3. Access the application at: http://localhost:3000"
    echo
}

# Run main function
main "$@"