# TeleCaller CRM - API Documentation

## 🔗 Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "details": "Additional error details"
  }
}
```

---

## 🔐 Authentication Endpoints

### POST /auth/login
Login user and get JWT token.

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
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "admin|supervisor|telecaller",
      "department": "sales",
      "currentStatus": "available"
    }
  }
}
```

### POST /auth/register
Register new user (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@telecaller.com",
  "password": "password123",
  "role": "telecaller",
  "department": "sales",
  "phone": "1234567890"
}
```

### GET /auth/me
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "telecaller",
      "department": "sales",
      "currentStatus": "available",
      "totalCalls": 150,
      "successfulCalls": 45,
      "conversionRate": 30
    }
  }
}
```

### POST /auth/logout
Logout current user.

**Headers:** `Authorization: Bearer <token>`

### PUT /auth/change-password
Change user password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

### PUT /auth/status
Update user status.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "available|busy|break|offline"
}
```

---

## 👥 User Management Endpoints

### GET /users
Get all users with filtering and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `role` (string): Filter by role
- `department` (string): Filter by department
- `isActive` (boolean): Filter by active status
- `search` (string): Search by name or email

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "name": "User Name",
        "email": "user@example.com",
        "role": "telecaller",
        "department": "sales",
        "currentStatus": "available",
        "isActive": true,
        "totalCalls": 100,
        "successfulCalls": 30
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /users/:id
Get specific user details.

**Headers:** `Authorization: Bearer <token>`

### PUT /users/:id
Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "department": "marketing",
  "phone": "9876543210"
}
```

### DELETE /users/:id
Delete user (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

### GET /users/team
Get team members (Supervisor only).

**Headers:** `Authorization: Bearer <supervisor_token>`

### GET /users/:id/analytics
Get user performance analytics.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "totalCalls": 200,
      "successfulCalls": 60,
      "conversionRate": 30,
      "averageCallDuration": 450,
      "leadsAssigned": 80,
      "leadsConverted": 24,
      "monthlyStats": [
        {
          "month": "2024-01",
          "calls": 50,
          "conversions": 15
        }
      ]
    }
  }
}
```

---

## 📞 Lead Management Endpoints

### GET /leads
Get leads with filtering and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status
- `assignedTo` (string): Filter by assigned user
- `source` (string): Filter by source
- `priority` (string): Filter by priority

**Response:**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": "lead_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "status": "new|contacted|qualified|converted|lost",
        "priority": "low|medium|high",
        "source": "meta|manual|referral",
        "assignedTo": "user_id",
        "createdAt": "2024-01-15T10:30:00Z",
        "score": 75
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalLeads": 100
    }
  }
}
```

### GET /leads/:id
Get specific lead details with call history.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "lead": {
      "id": "lead_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "status": "qualified",
      "assignedTo": {
        "id": "user_id",
        "name": "Telecaller Name"
      },
      "callHistory": [
        {
          "id": "call_id",
          "date": "2024-01-15T14:30:00Z",
          "duration": 300,
          "outcome": "interested",
          "notes": "Customer showed interest"
        }
      ]
    }
  }
}
```

### POST /leads
Create new lead.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "9876543210",
  "source": "manual",
  "priority": "medium",
  "product": "Product Name",
  "notes": "Lead notes"
}
```

### PUT /leads/:id
Update lead information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "qualified",
  "priority": "high",
  "notes": "Updated notes"
}
```

### PUT /leads/:id/assign
Reassign lead (Supervisor/Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "assignedTo": "new_user_id",
  "reason": "Reassignment reason"
}
```

### DELETE /leads/:id
Delete lead (Supervisor/Admin only).

**Headers:** `Authorization: Bearer <token>`

### GET /leads/dashboard
Get user-specific lead dashboard.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "dashboard": {
      "totalLeads": 25,
      "newLeads": 5,
      "qualifiedLeads": 10,
      "convertedLeads": 8,
      "lostLeads": 2,
      "recentLeads": [
        // Recent leads array
      ]
    }
  }
}
```

---

## 📱 Call Management Endpoints

### GET /calls
Get call logs with filtering.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `leadId` (string): Filter by lead
- `userId` (string): Filter by user
- `outcome` (string): Filter by outcome
- `dateFrom` (string): Filter by date range
- `dateTo` (string): Filter by date range

### GET /calls/:id
Get specific call details.

**Headers:** `Authorization: Bearer <token>`

### POST /calls
Create new call log.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "leadId": "lead_id",
  "purpose": "follow_up|initial_contact|closing",
  "outcome": "interested|not_interested|callback|converted|no_answer",
  "duration": 300,
  "notes": "Call notes",
  "followUpDate": "2024-01-20T10:00:00Z"
}
```

### PUT /calls/:id
Update call information.

**Headers:** `Authorization: Bearer <token>`

### PUT /calls/:id/review
Review call (Supervisor/Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "rating": 4,
  "feedback": "Good call handling",
  "approved": true
}
```

### DELETE /calls/:id
Delete call log (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

### GET /calls/dashboard
Get user-specific call dashboard.

**Headers:** `Authorization: Bearer <token>`

---

## 📊 Reports Endpoints

### GET /reports
Get reports with filtering.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `userId` (string): Filter by user
- `type` (string): Filter by report type
- `status` (string): Filter by status
- `dateFrom` (string): Date range filter
- `dateTo` (string): Date range filter

### GET /reports/:id
Get specific report details.

**Headers:** `Authorization: Bearer <token>`

### POST /reports
Create/update daily report.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "date": "2024-01-15",
  "callsMade": 20,
  "leadsContacted": 15,
  "conversions": 3,
  "workHours": 8,
  "activities": "Daily activities summary",
  "challenges": "Any challenges faced",
  "achievements": "Key achievements"
}
```

### PUT /reports/:id/submit
Submit report for review.

**Headers:** `Authorization: Bearer <token>`

### PUT /reports/:id/review
Review report (Supervisor/Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "approved|rejected",
  "feedback": "Review feedback",
  "rating": 4
}
```

### GET /reports/today
Get today's report for current user.

**Headers:** `Authorization: Bearer <token>`

### GET /reports/analytics
Get team analytics (Supervisor/Admin only).

**Headers:** `Authorization: Bearer <token>`

### GET /reports/export
Export reports as Excel/PDF.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `format` (string): "excel" or "pdf"
- `dateFrom` (string): Start date
- `dateTo` (string): End date
- `userId` (string): Specific user (optional)

---

## 🔗 Meta Integration Endpoints

### POST /meta/webhook
Facebook webhook endpoint for receiving leads.

**Request Body:** (Sent by Facebook)
```json
{
  "entry": [
    {
      "changes": [
        {
          "field": "leadgen",
          "value": {
            "leadgen_id": "lead_id",
            "page_id": "page_id",
            "form_id": "form_id",
            "created_time": 1642251600
          }
        }
      ]
    }
  ]
}
```

### GET /meta/webhook
Webhook verification endpoint.

**Query Parameters:**
- `hub.mode` (string): Verification mode
- `hub.challenge` (string): Challenge string
- `hub.verify_token` (string): Verification token

### GET /meta/leads
Fetch Meta leads.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (number): Number of leads to fetch
- `after` (string): Pagination cursor

### POST /meta/process-lead
Process Meta lead into the system.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "leadId": "meta_lead_id",
  "autoAssign": true
}
```

### GET /meta/campaigns
Get Facebook campaigns.

**Headers:** `Authorization: Bearer <token>`

### GET /meta/forms
Get lead generation forms.

**Headers:** `Authorization: Bearer <token>`

### POST /meta/test-lead
Create test lead for testing.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Test Lead",
  "email": "test@example.com",
  "phone": "1234567890"
}
```

### GET /meta/stats
Get Meta integration statistics.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalLeadsReceived": 150,
      "leadsThisMonth": 45,
      "averageLeadsPerDay": 5,
      "conversionRate": 25,
      "lastLeadReceived": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

## 🔧 Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation errors |
| 500 | Internal Server Error - Server error |

---

## 📝 Data Models

### User Model
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "admin|supervisor|telecaller",
  "department": "sales|marketing|support|lead_generation|follow_up",
  "phone": "string",
  "isActive": "boolean",
  "currentStatus": "available|busy|break|offline",
  "totalCalls": "number",
  "successfulCalls": "number",
  "conversionRate": "number",
  "supervisor": "string|null",
  "teamMembers": ["string"],
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Lead Model
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "status": "new|contacted|qualified|converted|lost",
  "priority": "low|medium|high",
  "source": "meta|manual|referral|website",
  "assignedTo": "string",
  "product": "string",
  "notes": "string",
  "score": "number",
  "metaData": {
    "campaignId": "string",
    "adSetId": "string",
    "formId": "string"
  },
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Call Model
```json
{
  "id": "string",
  "leadId": "string",
  "userId": "string",
  "purpose": "follow_up|initial_contact|closing",
  "outcome": "interested|not_interested|callback|converted|no_answer",
  "duration": "number",
  "notes": "string",
  "followUpDate": "datetime",
  "rating": "number",
  "reviewedBy": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Report Model
```json
{
  "id": "string",
  "userId": "string",
  "date": "date",
  "type": "daily|weekly|monthly",
  "callsMade": "number",
  "leadsContacted": "number",
  "conversions": "number",
  "workHours": "number",
  "activities": "string",
  "status": "draft|submitted|approved|rejected",
  "reviewedBy": "string",
  "feedback": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

## 🚀 Rate Limits

- **General API**: 100 requests per minute per IP
- **Authentication**: 10 requests per minute per IP
- **File Upload**: 5 requests per minute per user
- **Webhook**: No rate limit (external service)

---

**API Version: 1.0.0**
**Last Updated: January 2024**