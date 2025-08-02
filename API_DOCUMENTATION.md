# 📚 API Documentation - Telecaller CRM

Complete API reference for the Telecaller CRM application.

## 🔐 Authentication

All API endpoints (except login/register) require authentication using JWT tokens.

### Authentication Header
```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d5ecb8b5c9c62b3c7c1b5e",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "telecaller",
    "department": "sales"
  }
}
```

## 👥 Authentication Endpoints

### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "telecaller",
    "department": "sales",
    "phone": "9876543210",
    "isActive": true
  }
}
```

### POST /api/auth/register
Register a new user (Admin only).

**Request:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "telecaller",
  "department": "sales",
  "phone": "9876543210",
  "supervisor": "supervisor-id"
}
```

### GET /api/auth/profile
Get current user profile.

**Response:**
```json
{
  "user": {
    "_id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "telecaller",
    "department": "sales",
    "phone": "9876543210",
    "isActive": true,
    "avatar": "avatar-url",
    "performance": {
      "totalCalls": 150,
      "successfulCalls": 120,
      "conversionRate": 80
    }
  }
}
```

### PUT /api/auth/profile
Update user profile.

**Request:**
```json
{
  "name": "Updated Name",
  "phone": "9876543211",
  "department": "marketing"
}
```

### POST /api/auth/change-password
Change user password.

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

## 📊 Dashboard Endpoints

### GET /api/dashboard
Get dashboard data based on user role.

**Response:**
```json
{
  "stats": {
    "totalLeads": 45,
    "newLeadsToday": 8,
    "totalCalls": 123,
    "todayCalls": 15,
    "conversions": 12,
    "conversionRate": 15.5,
    "successRate": 85.2,
    "pendingFollowups": 5,
    "overdueFollowups": 2
  },
  "recentLeads": [
    {
      "_id": "lead-id",
      "name": "John Smith",
      "phone": "9876543210",
      "email": "john@example.com",
      "status": "new",
      "priority": "high",
      "source": "facebook",
      "assignedTo": "User Name"
    }
  ],
  "recentCalls": [
    {
      "_id": "call-id",
      "phoneNumber": "9876543210",
      "duration": "15:30",
      "outcome": "connected",
      "startTime": "2024-01-15T10:30:00Z",
      "isSuccessful": true,
      "leadName": "John Smith"
    }
  ],
  "upcomingFollowups": [
    {
      "_id": "lead-id",
      "leadName": "Jane Doe",
      "phone": "9876543211",
      "nextFollowupDate": "2024-01-16T14:00:00Z",
      "telecallerName": "Telecaller Name"
    }
  ],
  "leadPipeline": [
    { "name": "new", "value": 15 },
    { "name": "contacted", "value": 12 },
    { "name": "qualified", "value": 8 },
    { "name": "interested", "value": 5 },
    { "name": "converted", "value": 5 }
  ],
  "callTrends": [
    {
      "date": "2024-01-09",
      "calls": 25,
      "successful": 20
    }
  ],
  "teamPerformance": [
    {
      "name": "Telecaller 1",
      "calls": 45,
      "conversions": 8
    }
  ],
  "notifications": [
    {
      "type": "warning",
      "message": "2 follow-up(s) overdue",
      "priority": "high"
    }
  ]
}
```

### GET /api/dashboard/analytics
Get detailed analytics (Admin/Supervisor only).

**Query Parameters:**
- `startDate`: Start date (ISO string)
- `endDate`: End date (ISO string)

**Response:**
```json
{
  "callAnalytics": [
    {
      "_id": {
        "date": "2024-01-15",
        "outcome": "connected"
      },
      "count": 25,
      "totalDuration": 7200
    }
  ],
  "leadAnalytics": [
    {
      "_id": {
        "date": "2024-01-15",
        "status": "new",
        "source": "facebook"
      },
      "count": 8
    }
  ],
  "dateRange": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  }
}
```

## 👥 Users Endpoints

### GET /api/users
Get all users (Admin/Supervisor only).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `role`: Filter by role
- `department`: Filter by department
- `search`: Search by name or email

**Response:**
```json
{
  "users": [
    {
      "_id": "user-id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "telecaller",
      "department": "sales",
      "phone": "9876543210",
      "isActive": true,
      "avatar": "avatar-url",
      "performance": {
        "totalCalls": 150,
        "successfulCalls": 120,
        "conversionRate": 80
      },
      "availability": {
        "isAvailable": true,
        "currentStatus": "available",
        "lastActive": "2024-01-15T10:30:00Z"
      }
    }
  ],
  "total": 25,
  "page": 1,
  "pages": 3
}
```

### GET /api/users/:id
Get specific user.

**Response:**
```json
{
  "user": {
    "_id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "telecaller",
    "department": "sales",
    "phone": "9876543210",
    "isActive": true,
    "supervisor": {
      "_id": "supervisor-id",
      "name": "Supervisor Name"
    },
    "teamMembers": [
      {
        "_id": "member-id",
        "name": "Team Member Name"
      }
    ]
  }
}
```

### PUT /api/users/:id
Update user (Admin/Supervisor only).

**Request:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "supervisor",
  "department": "marketing",
  "phone": "9876543211",
  "isActive": true
}
```

### DELETE /api/users/:id
Delete user (Admin only).

### GET /api/users/team/:supervisorId
Get team members for a supervisor.

**Response:**
```json
{
  "teamMembers": [
    {
      "_id": "member-id",
      "name": "Team Member Name",
      "email": "member@example.com",
      "role": "telecaller",
      "performance": {
        "totalCalls": 120,
        "successfulCalls": 95,
        "conversionRate": 79
      }
    }
  ]
}
```

## 📞 Leads Endpoints

### GET /api/leads
Get all leads with filtering and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status
- `priority`: Filter by priority
- `source`: Filter by source
- `assignedTo`: Filter by assigned user
- `search`: Search by name, email, or phone

**Response:**
```json
{
  "leads": [
    {
      "_id": "lead-id",
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "9876543210",
      "source": "facebook",
      "status": "new",
      "priority": "high",
      "quality": "hot",
      "assignedTo": {
        "_id": "user-id",
        "name": "Telecaller Name"
      },
      "assignedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T09:00:00Z",
      "nextFollowupDate": "2024-01-16T14:00:00Z",
      "notes": "Interested in premium package",
      "score": 85
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 5
}
```

### POST /api/leads
Create new lead.

**Request:**
```json
{
  "name": "New Lead",
  "email": "newlead@example.com",
  "phone": "9876543210",
  "source": "manual",
  "priority": "medium",
  "quality": "warm",
  "product": "Premium Package",
  "requirements": "Looking for premium features",
  "notes": "Initial contact made"
}
```

### GET /api/leads/:id
Get specific lead.

**Response:**
```json
{
  "lead": {
    "_id": "lead-id",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "9876543210",
    "source": "facebook",
    "status": "new",
    "priority": "high",
    "quality": "hot",
    "assignedTo": {
      "_id": "user-id",
      "name": "Telecaller Name"
    },
    "assignedBy": {
      "_id": "admin-id",
      "name": "Admin Name"
    },
    "assignedAt": "2024-01-15T10:30:00Z",
    "product": "Premium Package",
    "requirements": "Looking for premium features",
    "notes": "Interested in premium package",
    "nextFollowupDate": "2024-01-16T14:00:00Z",
    "followupCount": 2,
    "score": 85,
    "metaData": {
      "adName": "Premium Campaign",
      "campaignName": "Q4 Premium Sales",
      "leadGenFormName": "Premium Lead Form"
    },
    "createdAt": "2024-01-15T09:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /api/leads/:id
Update lead.

**Request:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone": "9876543211",
  "status": "contacted",
  "priority": "high",
  "notes": "Updated notes"
}
```

### DELETE /api/leads/:id
Delete lead (Admin only).

### POST /api/leads/:id/assign
Assign lead to telecaller.

**Request:**
```json
{
  "telecallerId": "user-id"
}
```

### GET /api/leads/assigned/:userId
Get leads assigned to specific user.

## 📞 Calls Endpoints

### GET /api/calls
Get all calls with filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `telecallerId`: Filter by telecaller
- `leadId`: Filter by lead
- `outcome`: Filter by call outcome
- `status`: Filter by call status
- `startDate`: Filter by start date
- `endDate`: Filter by end date

**Response:**
```json
{
  "calls": [
    {
      "_id": "call-id",
      "leadId": {
        "_id": "lead-id",
        "name": "John Smith",
        "phone": "9876543210"
      },
      "telecallerId": {
        "_id": "user-id",
        "name": "Telecaller Name"
      },
      "phoneNumber": "9876543210",
      "callType": "outbound",
      "callPurpose": "initial_contact",
      "startTime": "2024-01-15T10:30:00Z",
      "endTime": "2024-01-15T10:45:00Z",
      "duration": 900,
      "formattedDuration": "15:00",
      "status": "completed",
      "outcome": "connected",
      "notes": "Customer was interested",
      "summary": "Positive response",
      "nextFollowupDate": "2024-01-16T14:00:00Z",
      "leadStatusBefore": "new",
      "leadStatusAfter": "interested",
      "callQuality": "excellent",
      "customerSatisfaction": 5,
      "isSuccessful": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 123,
  "page": 1,
  "pages": 13
}
```

### POST /api/calls
Create new call.

**Request:**
```json
{
  "leadId": "lead-id",
  "phoneNumber": "9876543210",
  "callType": "outbound",
  "callPurpose": "initial_contact",
  "startTime": "2024-01-15T10:30:00Z",
  "endTime": "2024-01-15T10:45:00Z",
  "outcome": "connected",
  "notes": "Customer was interested",
  "summary": "Positive response",
  "nextFollowupDate": "2024-01-16T14:00:00Z",
  "leadStatusAfter": "interested",
  "callQuality": "excellent",
  "customerSatisfaction": 5
}
```

### GET /api/calls/:id
Get specific call.

### PUT /api/calls/:id
Update call.

### DELETE /api/calls/:id
Delete call (Admin only).

### GET /api/calls/user/:userId
Get calls for specific user.

### POST /api/calls/start
Start call timer.

**Request:**
```json
{
  "leadId": "lead-id",
  "phoneNumber": "9876543210"
}
```

### POST /api/calls/end
End call timer.

**Request:**
```json
{
  "callId": "call-id",
  "outcome": "connected",
  "notes": "Call notes"
}
```

## 📊 Reports Endpoints

### GET /api/reports
Get all reports.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `userId`: Filter by user
- `reportType`: Filter by report type
- `startDate`: Filter by start date
- `endDate`: Filter by end date

**Response:**
```json
{
  "reports": [
    {
      "_id": "report-id",
      "userId": {
        "_id": "user-id",
        "name": "User Name"
      },
      "reportDate": "2024-01-15T00:00:00Z",
      "reportType": "daily",
      "callMetrics": {
        "totalCalls": 25,
        "completedCalls": 20,
        "missedCalls": 5,
        "successfulCalls": 15,
        "totalCallDuration": 7200,
        "averageCallDuration": 360
      },
      "leadMetrics": {
        "newLeads": 8,
        "contactedLeads": 15,
        "qualifiedLeads": 10,
        "interestedLeads": 5,
        "convertedLeads": 2,
        "followupsScheduled": 8,
        "followupsCompleted": 12
      },
      "performanceMetrics": {
        "connectionRate": 80,
        "conversionRate": 13.3,
        "leadResponseTime": 45,
        "customerSatisfactionAvg": 4.2
      },
      "workMetrics": {
        "startTime": "09:00",
        "endTime": "18:00",
        "totalWorkHours": 8,
        "breakTime": 60,
        "productiveHours": 7
      },
      "activities": [
        {
          "time": "09:00",
          "activity": "Login",
          "description": "Started work day",
          "outcome": "Ready for calls",
          "duration": 5
        }
      ],
      "targets": {
        "callTarget": 30,
        "leadTarget": 20,
        "conversionTarget": 3,
        "revenueTarget": 50000
      },
      "achievements": {
        "callsAchieved": 25,
        "leadsAchieved": 15,
        "conversionsAchieved": 2,
        "revenueAchieved": 35000
      },
      "notes": "Good day overall",
      "status": "submitted",
      "createdAt": "2024-01-15T18:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 5
}
```

### POST /api/reports
Create new report.

**Request:**
```json
{
  "reportDate": "2024-01-15T00:00:00Z",
  "reportType": "daily",
  "callMetrics": {
    "totalCalls": 25,
    "completedCalls": 20,
    "missedCalls": 5,
    "successfulCalls": 15,
    "totalCallDuration": 7200,
    "averageCallDuration": 360
  },
  "leadMetrics": {
    "newLeads": 8,
    "contactedLeads": 15,
    "qualifiedLeads": 10,
    "interestedLeads": 5,
    "convertedLeads": 2,
    "followupsScheduled": 8,
    "followupsCompleted": 12
  },
  "workMetrics": {
    "startTime": "09:00",
    "endTime": "18:00",
    "totalWorkHours": 8,
    "breakTime": 60,
    "productiveHours": 7
  },
  "activities": [
    {
      "time": "09:00",
      "activity": "Login",
      "description": "Started work day",
      "outcome": "Ready for calls",
      "duration": 5
    }
  ],
  "notes": "Good day overall",
  "challenges": "Some leads unavailable",
  "improvements": "Will try different calling times"
}
```

### GET /api/reports/:id
Get specific report.

### PUT /api/reports/:id
Update report.

### DELETE /api/reports/:id
Delete report (Admin only).

### GET /api/reports/export/:format
Export reports in Excel or PDF format.

**Query Parameters:**
- `startDate`: Start date for export
- `endDate`: End date for export
- `userId`: Filter by user
- `reportType`: Filter by report type

**Response:** File download (Excel or PDF)

### GET /api/reports/analytics
Get report analytics.

**Query Parameters:**
- `startDate`: Start date
- `endDate`: End date
- `userId`: Filter by user

**Response:**
```json
{
  "totalReports": 45,
  "averageConnectionRate": 78.5,
  "averageConversionRate": 12.3,
  "totalWorkHours": 360,
  "topPerformers": [
    {
      "name": "Top Performer",
      "connectionRate": 85,
      "conversionRate": 15
    }
  ]
}
```

## 🔗 Meta Integration Endpoints

### POST /api/meta/webhook
Meta Ads webhook endpoint for lead capture.

**Request:**
```json
{
  "lead_id": "fb123",
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "ad_name": "Campaign A",
  "campaign_name": "Q4 Sales",
  "lead_gen_form_name": "Lead Form"
}
```

### GET /api/meta/campaigns
Get Meta campaigns (Admin only).

### POST /api/meta/sync
Sync Meta leads (Admin only).

### GET /api/meta/analytics
Get Meta analytics (Admin only).

## 🔧 Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Insufficient permissions.",
  "requiredRoles": ["admin", "supervisor"],
  "userRole": "telecaller"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Something went wrong!",
  "error": "Error details (development only)"
}
```

## 📡 WebSocket Events

### Client to Server Events

#### join-user-room
Join user-specific room for notifications.
```json
{
  "userId": "user-id"
}
```

#### update-status
Update user availability status.
```json
{
  "status": "available"
}
```

#### start-call
Start a call timer.
```json
{
  "leadId": "lead-id",
  "phoneNumber": "9876543210"
}
```

#### end-call
End a call timer.
```json
{
  "callId": "call-id",
  "outcome": "connected",
  "notes": "Call notes"
}
```

#### assign-lead
Assign lead to telecaller.
```json
{
  "leadId": "lead-id",
  "telecallerId": "user-id"
}
```

#### submit-report
Submit daily report.
```json
{
  "reportData": {
    "reportDate": "2024-01-15T00:00:00Z",
    "callMetrics": { ... },
    "leadMetrics": { ... }
  }
}
```

### Server to Client Events

#### notification
General notification.
```json
{
  "type": "success",
  "message": "Lead assigned successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### new-lead-assigned
New lead assigned to telecaller.
```json
{
  "leadId": "lead-id",
  "name": "John Smith",
  "phone": "9876543210",
  "assignedTo": "user-id"
}
```

#### call-status-updated
Call status updated.
```json
{
  "callId": "call-id",
  "status": "completed",
  "phoneNumber": "9876543210"
}
```

#### report-submitted
Report submitted (for supervisors).
```json
{
  "reportId": "report-id",
  "telecallerName": "Telecaller Name",
  "reportDate": "2024-01-15T00:00:00Z"
}
```

#### user-status-changed
User status changed.
```json
{
  "userId": "user-id",
  "userName": "User Name",
  "status": "available"
}
```

#### dashboard-update
Dashboard data updated.
```json
{
  "stats": { ... },
  "recentLeads": [ ... ],
  "recentCalls": [ ... ]
}
```

## 📝 Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 10 requests per 15 minutes
- **File upload endpoints**: 50 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

## 🔒 Security

### CORS Configuration
- Allowed origins: `http://localhost:3000` (development)
- Credentials: true
- Methods: GET, POST, PUT, DELETE, OPTIONS

### JWT Token Security
- Algorithm: HS256
- Expiration: 24 hours (configurable)
- Refresh tokens: Not implemented (can be added)

### Input Validation
- All inputs are validated using express-validator
- SQL injection protection via Mongoose
- XSS protection via helmet middleware

### File Upload Security
- File size limits: 5MB
- Allowed file types: images, documents
- Virus scanning: Not implemented (can be added)

## 📊 Response Formats

### Pagination
All list endpoints support pagination:

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "pages": 10,
  "limit": 10
}
```

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details (development only)"
}
```

## 🚀 Testing

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### API Documentation
The API documentation is available at `/api/docs` when running in development mode.

---

This documentation covers all the main API endpoints. For additional endpoints or specific use cases, please refer to the source code or contact the development team.