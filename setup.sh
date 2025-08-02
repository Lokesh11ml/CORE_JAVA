#!/bin/bash

# Telecaller CRM Setup Script
# This script will set up the complete telecaller CRM application

set -e  # Exit on any error

echo "🚀 Starting Telecaller CRM Setup..."
echo "=================================="

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
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        print_status "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) is installed"
}

# Check if MongoDB is installed
check_mongodb() {
    print_status "Checking MongoDB installation..."
    if ! command -v mongod &> /dev/null; then
        print_warning "MongoDB is not installed or not in PATH."
        print_status "Please install MongoDB 5.0 or higher."
        print_status "Visit: https://docs.mongodb.com/manual/installation/"
        print_status "Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:5.0"
        read -p "Continue without MongoDB? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "MongoDB is installed"
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

# Create environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Create server .env file
    if [ ! -f "server/.env" ]; then
        print_status "Creating server .env file..."
        cp server/.env.example server/.env
        print_success "Server .env file created"
    else
        print_warning "Server .env file already exists"
    fi
    
    # Create client .env file
    if [ ! -f "client/.env" ]; then
        print_status "Creating client .env file..."
        cat > client/.env << EOF
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_VERSION=1.0.0
EOF
        print_success "Client .env file created"
    else
        print_warning "Client .env file already exists"
    fi
    
    print_success "Environment files configured"
}

# Start MongoDB (if available)
start_mongodb() {
    print_status "Starting MongoDB..."
    
    if command -v mongod &> /dev/null; then
        # Check if MongoDB is already running
        if pgrep -x "mongod" > /dev/null; then
            print_success "MongoDB is already running"
        else
            # Try to start MongoDB
            if mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb; then
                print_success "MongoDB started successfully"
            else
                print_warning "Could not start MongoDB. Please start it manually."
                print_status "Command: mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb"
            fi
        fi
    else
        print_warning "MongoDB not found. Please start MongoDB manually or use Docker."
    fi
}

# Seed database
seed_database() {
    print_status "Seeding database with sample data..."
    
    # Wait for MongoDB to be ready
    print_status "Waiting for MongoDB to be ready..."
    for i in {1..30}; do
        if node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/telecaller-app').then(() => process.exit(0)).catch(() => process.exit(1))" 2>/dev/null; then
            break
        fi
        sleep 1
    done
    
    # Run database seeding
    if npm run seed; then
        print_success "Database seeded successfully"
    else
        print_error "Failed to seed database"
        exit 1
    fi
}

# Build client
build_client() {
    print_status "Building client application..."
    
    cd client
    if npm run build; then
        print_success "Client built successfully"
    else
        print_error "Failed to build client"
        exit 1
    fi
    cd ..
}

# Start application
start_application() {
    print_status "Starting the application..."
    
    # Start in development mode
    if npm run dev; then
        print_success "Application started successfully"
        print_status "Server: http://localhost:5000"
        print_status "Client: http://localhost:3000"
        print_status ""
        print_status "Default login credentials:"
        print_status "Admin: admin@telecaller.com / admin123"
        print_status "Supervisor: supervisor@telecaller.com / supervisor123"
        print_status "Telecaller: alice@telecaller.com / telecaller123"
    else
        print_error "Failed to start application"
        exit 1
    fi
}

# Main setup function
main() {
    echo ""
    print_status "Starting setup process..."
    echo ""
    
    # Check prerequisites
    check_nodejs
    check_mongodb
    echo ""
    
    # Install dependencies
    install_dependencies
    echo ""
    
    # Setup environment
    setup_environment
    echo ""
    
    # Start MongoDB
    start_mongodb
    echo ""
    
    # Seed database
    seed_database
    echo ""
    
    # Build client (optional for development)
    read -p "Build client for production? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_client
        echo ""
    fi
    
    # Start application
    print_status "Setup completed successfully!"
    echo ""
    print_status "To start the application, run:"
    print_status "npm run dev"
    echo ""
    print_status "Or start server and client separately:"
    print_status "npm run server  # Terminal 1"
    print_status "npm run client  # Terminal 2"
    echo ""
    
    # Ask if user wants to start now
    read -p "Start the application now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_application
    else
        print_success "Setup completed! Run 'npm run dev' to start the application."
    fi
}

# Run main function
main "$@"