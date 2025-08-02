# Telecaller CRM API Documentation

Complete API documentation for the Telecaller CRM system with authentication, lead management, calling, reporting, and Meta Ads integration.

## 🔐 Authentication

All API endpoints require authentication except for login and register. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📋 Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## 🔑 Authentication Endpoints

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@telecaller.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "Admin User",
    "email": "admin@telecaller.com",
    "role": "admin",
    "department": "management",
    "isActive": true
  }
}
```

### POST /api/auth/register
Register a new user (Admin only).

**Request Body:**
```json
{
  "name": "New Telecaller",
  "email": "new@telecaller.com",
  "password": "password123",
  "role": "telecaller",
  "department": "lead_generation",
  "phone": "9876543210",
  "supervisor": "60f7b3b3b3b3b3b3b3b3b3b4"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
    "name": "New Telecaller",
    "email": "new@telecaller.com",
    "role": "telecaller"
  }
}
```

### POST /api/auth/logout
Logout user (optional - client-side token removal).

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 👥 User Management

### GET /api/users
Get all users (Admin/Supervisor only).

**Query Parameters:**
- `role`: Filter by role (admin, supervisor, telecaller)
- `department`: Filter by department
- `isActive`: Filter by active status
- `page`: Page number for pagination
- `limit`: Number of users per page

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Admin User",
      "email": "admin@telecaller.com",
      "role": "admin",
      "department": "management",
      "isActive": true,
      "totalCalls": 150,
      "successfulCalls": 120,
      "totalLeads": 50,
      "convertedLeads": 15,
      "successRate": 80,
      "conversionRate": 30
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

### GET /api/users/:id
Get specific user details.

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "Admin User",
    "email": "admin@telecaller.com",
    "role": "admin",
    "department": "management",
    "phone": "9876543210",
    "isActive": true,
    "supervisor": null,
    "teamMembers": [],
    "performance": {
      "totalCalls": 150,
      "successfulCalls": 120,
      "totalLeads": 50,
      "convertedLeads": 15,
      "successRate": 80,
      "conversionRate": 30
    }
  }
}
```

### PUT /api/users/:id
Update user details.

**Request Body:**
```json
{
  "name": "Updated Name",
  "department": "sales",
  "phone": "9876543211",
  "isActive": true
}
```

### DELETE /api/users/:id
Delete user (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## 🧾 Lead Management

### GET /api/leads
Get all leads with filtering and pagination.

**Query Parameters:**
- `status`: Filter by status (new, contacted, qualified, interested, converted)
- `source`: Filter by source (facebook, instagram, manual, website)
- `priority`: Filter by priority (low, medium, high, urgent)
- `quality`: Filter by quality (hot, warm, cold)
- `assignedTo`: Filter by assigned telecaller
- `dateFrom`: Filter by creation date from
- `dateTo`: Filter by creation date to
- `page`: Page number
- `limit`: Number of leads per page

**Response:**
```json
{
  "success": true,
  "leads": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "9876543210",
      "source": "facebook",
      "status": "new",
      "priority": "high",
      "quality": "hot",
      "assignedTo": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
        "name": "Alice Johnson"
      },
      "assignedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:00:00Z",
      "score": 85
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### POST /api/leads
Create a new lead.

**Request Body:**
```json
{
  "name": "New Lead",
  "email": "newlead@example.com",
  "phone": "9876543210",
  "source": "manual",
  "priority": "medium",
  "quality": "warm",
  "requirements": "Looking for software development",
  "notes": "Interested in custom solutions"
}
```

### GET /api/leads/:id
Get specific lead details.

**Response:**
```json
{
  "success": true,
  "lead": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "source": "facebook",
    "status": "new",
    "priority": "high",
    "quality": "hot",
    "assignedTo": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
      "name": "Alice Johnson"
    },
    "assignedAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "lastContactDate": null,
    "followupCount": 0,
    "score": 85,
    "requirements": "Looking for software development",
    "notes": "Interested in custom solutions",
    "metaData": {
      "adName": "Premium Campaign",
      "campaignName": "Q4 Sales",
      "leadGenFormName": "Contact Form"
    }
  }
}
```

### PUT /api/leads/:id
Update lead details.

**Request Body:**
```json
{
  "status": "contacted",
  "priority": "high",
  "notes": "Updated notes",
  "requirements": "Updated requirements"
}
```

### DELETE /api/leads/:id
Delete lead (Admin only).

### POST /api/leads/:id/assign
Assign lead to telecaller.

**Request Body:**
```json
{
  "assignedTo": "60f7b3b3b3b3b3b3b3b3b3b7"
}
```

### GET /api/leads/assigned/:userId
Get leads assigned to specific user.

## 📞 Call Management

### GET /api/calls
Get all calls with filtering.

**Query Parameters:**
- `status`: Filter by call status
- `callType`: Filter by call type (outbound, inbound)
- `telecaller`: Filter by telecaller ID
- `dateFrom`: Filter by date from
- `dateTo`: Filter by date to
- `page`: Page number
- `limit`: Number of calls per page

**Response:**
```json
{
  "success": true,
  "calls": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b8",
      "telecaller": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
        "name": "Alice Johnson"
      },
      "lead": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
        "name": "John Doe",
        "phone": "9876543210"
      },
      "callType": "outbound",
      "status": "completed",
      "duration": 300,
      "startTime": "2024-01-15T10:30:00Z",
      "endTime": "2024-01-15T10:35:00Z",
      "recordingUrl": "https://api.twilio.com/recordings/RE123...",
      "notes": "Customer showed interest"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### POST /api/calls/initiate
Initiate a call to a lead.

**Request Body:**
```json
{
  "leadId": "60f7b3b3b3b3b3b3b3b3b3b6",
  "callType": "outbound"
}
```

**Response:**
```json
{
  "success": true,
  "call": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b8",
    "status": "initiated",
    "twilioCallSid": "CA1234567890abcdef",
    "startTime": "2024-01-15T10:30:00Z"
  },
  "twilioCall": {
    "sid": "CA1234567890abcdef",
    "status": "initiated"
  }
}
```

### GET /api/calls/:id
Get specific call details.

### PUT /api/calls/:id
Update call details.

**Request Body:**
```json
{
  "status": "completed",
  "duration": 300,
  "notes": "Call completed successfully"
}
```

### POST /api/calls/status-callback
Twilio webhook for call status updates.

### POST /api/calls/recording-status
Twilio webhook for recording status updates.

## 📊 Reports

### GET /api/reports
Get all reports.

**Query Parameters:**
- `userId`: Filter by user ID
- `reportType`: Filter by report type (daily, weekly, monthly)
- `dateFrom`: Filter by date from
- `dateTo`: Filter by date to
- `page`: Page number
- `limit`: Number of reports per page

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b9",
      "user": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
        "name": "Alice Johnson"
      },
      "reportDate": "2024-01-15T00:00:00Z",
      "reportType": "daily",
      "totalCalls": 15,
      "completedCalls": 12,
      "followUpsCompleted": 8,
      "convertedLeads": 2,
      "dailyNotes": "Good day overall, converted 2 leads"
    }
  ]
}
```

### POST /api/reports
Create a new report.

**Request Body:**
```json
{
  "reportDate": "2024-01-15",
  "reportType": "daily",
  "totalCalls": 15,
  "completedCalls": 12,
  "followUpsCompleted": 8,
  "convertedLeads": 2,
  "dailyNotes": "Good day overall, converted 2 leads"
}
```

### GET /api/reports/:id
Get specific report details.

### PUT /api/reports/:id
Update report details.

### GET /api/reports/export/:type
Export reports in Excel or PDF format.

**Query Parameters:**
- `format`: Export format (excel, pdf)
- `dateFrom`: Start date
- `dateTo`: End date
- `userId`: Filter by user ID

**Response:**
```json
{
  "success": true,
  "downloadUrl": "/api/reports/download/report_2024-01-15.xlsx",
  "filename": "report_2024-01-15.xlsx"
}
```

## 📱 Meta Ads Integration

### POST /api/meta/webhook
Meta Ads webhook endpoint for lead capture.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "phone_number": "9876543210",
  "email": "john.doe@example.com",
  "campaign_id": "123456789",
  "ad_id": "987654321",
  "form_id": "456789123",
  "lead_id": "789123456",
  "created_time": 1642234567,
  "field_data": [
    {
      "name": "requirements",
      "values": ["Software development"]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead processed successfully",
  "lead": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "assignment": {
    "success": true,
    "telecaller": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b7",
      "name": "Alice Johnson"
    }
  }
}
```

### GET /api/meta/stats
Get Meta Ads statistics.

**Query Parameters:**
- `dateFrom`: Start date
- `dateTo`: End date

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalLeads": 150,
    "convertedLeads": 25,
    "totalValue": 50000,
    "campaigns": ["Q4 Sales", "Premium Campaign"],
    "avgQuality": 2.5
  }
}
```

### GET /api/meta/campaigns
Get Meta Ads campaigns.

**Response:**
```json
{
  "success": true,
  "campaigns": [
    {
      "campaignId": "123456789",
      "campaignName": "Q4 Sales",
      "totalLeads": 75,
      "convertedLeads": 12,
      "conversionRate": 16
    }
  ]
}
```

## 📈 Dashboard Analytics

### GET /api/dashboard/overview
Get dashboard overview statistics.

**Response:**
```json
{
  "success": true,
  "overview": {
    "totalLeads": 250,
    "newLeads": 45,
    "contactedLeads": 120,
    "convertedLeads": 35,
    "totalCalls": 500,
    "completedCalls": 420,
    "activeTelecallers": 8,
    "conversionRate": 14,
    "successRate": 84
  }
}
```

### GET /api/dashboard/performance
Get performance analytics.

**Query Parameters:**
- `dateFrom`: Start date
- `dateTo`: End date
- `userId`: Filter by user ID

**Response:**
```json
{
  "success": true,
  "performance": {
    "dailyStats": [
      {
        "date": "2024-01-15",
        "calls": 25,
        "leads": 8,
        "conversions": 2
      }
    ],
    "topPerformers": [
      {
        "user": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
          "name": "Alice Johnson"
        },
        "calls": 150,
        "conversions": 15,
        "conversionRate": 10
      }
    ],
    "leadSources": [
      {
        "source": "facebook",
        "count": 120,
        "conversions": 20
      }
    ]
  }
}
```

### GET /api/dashboard/leads
Get lead analytics.

**Response:**
```json
{
  "success": true,
  "leads": {
    "statusDistribution": [
      { "status": "new", "count": 45 },
      { "status": "contacted", "count": 120 },
      { "status": "converted", "count": 35 }
    ],
    "sourceDistribution": [
      { "source": "facebook", "count": 150 },
      { "source": "manual", "count": 50 },
      { "source": "website", "count": 50 }
    ],
    "qualityDistribution": [
      { "quality": "hot", "count": 80 },
      { "quality": "warm", "count": 120 },
      { "quality": "cold", "count": 50 }
    ]
  }
}
```

## 🔧 Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "success": false,
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
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Something went wrong!",
  "error": "Error details in development"
}
```

## 🔄 Real-time Events (Socket.io)

### Connection
```javascript
const socket = io('http://localhost:5000');
```

### Join User Room
```javascript
socket.emit('join-user-room', userId);
```

### Events

#### new-lead-assigned
Emitted when a new lead is assigned to a telecaller.

```javascript
socket.on('new-lead-assigned', (data) => {
  console.log('New lead assigned:', data);
  // data: { leadId, leadName, leadPhone, assignedAt }
});
```

#### call-status-updated
Emitted when call status changes.

```javascript
socket.on('call-status-updated', (data) => {
  console.log('Call status updated:', data);
  // data: { callId, status, duration }
});
```

#### user-status-updated
Emitted when user status changes.

```javascript
socket.on('user-status-updated', (data) => {
  console.log('User status updated:', data);
  // data: { userId, status, lastActive }
});
```

## 📝 Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **File upload endpoints**: 10 requests per 15 minutes

## 🔒 Security

- **JWT Authentication**: All endpoints require valid JWT tokens
- **Role-based Access**: Endpoints check user roles for authorization
- **Input Validation**: All inputs are validated and sanitized
- **CORS**: Configured for secure cross-origin requests
- **Helmet**: Security headers implemented
- **Rate Limiting**: Prevents API abuse

## 📞 Webhook Verification

### Meta Ads Webhook
Verify webhook signature to ensure authenticity:

```javascript
const crypto = require('crypto');

function verifyMetaWebhook(signature, body, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Twilio Webhook
Verify Twilio webhook signature:

```javascript
const twilio = require('twilio');

function verifyTwilioWebhook(signature, url, params, secret) {
  return twilio.validateRequest(secret, signature, url, params);
}
```

---

**Note**: This API documentation covers all major endpoints. For additional endpoints or specific implementation details, refer to the source code or contact the development team.