# Telecaller CRM Frontend

A comprehensive React-based frontend for the Telecaller CRM system, built with Material-UI and modern React practices.

## Features

### Core Features
- **Multi-User Authentication**: Role-based access control (Admin, Supervisor, Telecaller)
- **Real-time Communication**: Socket.io integration for live updates
- **Responsive Design**: Mobile-friendly interface using Material-UI
- **Modern UI/UX**: Clean, intuitive interface with consistent design patterns

### Lead Management
- **Lead Capture & Assignment**: Automated and manual lead distribution
- **Lead Scoring**: Quality assessment and priority ranking
- **Follow-up Tracking**: Automated follow-up scheduling and reminders
- **Meta Ads Integration**: Real-time lead capture from Facebook campaigns

### Call Management
- **One-Click Calling**: Direct integration with Twilio for seamless calling
- **Call Recording**: Automatic call recording and playback
- **Call Analytics**: Detailed call statistics and performance metrics
- **Call Scheduling**: Future call scheduling and reminders

### Reporting & Analytics
- **Daily Reports**: Comprehensive daily activity reports
- **Performance Analytics**: Team and individual performance tracking
- **Export Capabilities**: PDF and Excel export functionality
- **Real-time Dashboards**: Live performance monitoring

### User Management
- **Role-based Access**: Granular permissions for different user types
- **Profile Management**: User profile updates and settings
- **Team Management**: Supervisor and admin user management tools

## Technology Stack

- **React 18**: Modern React with hooks
- **Material-UI (MUI)**: Component library for consistent UI
- **React Router**: Client-side routing
- **Socket.io Client**: Real-time communication
- **Axios**: HTTP client for API calls
- **React Hook Form**: Form handling and validation
- **React Hot Toast**: User notifications
- **Recharts**: Data visualization and charts

## Project Structure

```
client/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Layout.js
│   │   ├── LoadingSpinner.js
│   │   ├── ConfirmDialog.js
│   │   ├── StatusBadge.js
│   │   ├── DataTable.js
│   │   └── index.js
│   ├── contexts/
│   │   ├── AuthContext.js
│   │   └── SocketContext.js
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── Leads.js
│   │   ├── LeadDetail.js
│   │   ├── Calls.js
│   │   ├── CallDetail.js
│   │   ├── Reports.js
│   │   ├── ReportDetail.js
│   │   ├── Users.js
│   │   ├── UserDetail.js
│   │   ├── Profile.js
│   │   ├── Analytics.js
│   │   ├── Settings.js
│   │   ├── MetaIntegration.js
│   │   ├── Login.js
│   │   ├── Register.js
│   │   └── NotFound.js
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend server running (see backend README)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd telecaller-crm/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the client directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm start`: Start development server
- `npm build`: Build for production
- `npm test`: Run tests
- `npm eject`: Eject from Create React App

## Key Components

### Contexts

#### AuthContext
Manages authentication state and provides:
- User authentication status
- Login/logout functions
- Role-based access control
- Token management

#### SocketContext
Handles real-time communication:
- WebSocket connections
- Real-time notifications
- Live updates for leads, calls, and reports
- User status tracking

### Pages

#### Dashboard
Main dashboard with:
- Key performance indicators
- Real-time statistics
- Recent activities
- Performance charts

#### Leads
Lead management with:
- Lead listing and filtering
- Lead creation and editing
- Lead assignment
- Lead scoring and quality assessment

#### Calls
Call management featuring:
- Call logging and tracking
- One-click calling integration
- Call recording playback
- Call analytics

#### Reports
Reporting system with:
- Daily/weekly/monthly reports
- Performance analytics
- Export functionality (PDF/Excel)
- Report templates

#### Users
User management for admins:
- User listing and filtering
- User creation and editing
- Role assignment
- User status management

#### Analytics
Comprehensive analytics with:
- Performance metrics
- Trend analysis
- Team comparisons
- Data visualization

## API Integration

The frontend integrates with the backend API through:

- **RESTful API calls** using Axios
- **WebSocket connections** for real-time updates
- **JWT authentication** for secure access
- **File uploads** for recordings and documents

## State Management

The application uses React Context API for global state management:

- **AuthContext**: Authentication and user state
- **SocketContext**: Real-time communication state
- **Local state**: Component-specific state using React hooks

## Styling

The application uses Material-UI (MUI) for:
- Consistent design system
- Responsive layouts
- Pre-built components
- Custom theming

## Real-time Features

- **Live notifications** for new leads and calls
- **Real-time user status** tracking
- **Live dashboard updates**
- **Instant call status updates**

## Security Features

- **JWT token authentication**
- **Role-based access control**
- **Secure API communication**
- **Input validation and sanitization**

## Performance Optimizations

- **Code splitting** with React.lazy()
- **Memoization** for expensive components
- **Optimized re-renders** with React.memo()
- **Efficient data fetching** with proper caching

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.