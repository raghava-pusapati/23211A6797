# Setup Instructions

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn

## Step 1: Register with AffordMed

1. Register at: `http://4.224.186.213/evaluation-service/register`
2. Request body:
```json
{
  "email": "your_college_email@domain.edu",
  "name": "Your Name",
  "mobileNo": "9999999999",
  "githubUsername": "your_github_username",
  "rollNo": "your_roll_number",
  "accessCode": "your_access_code_from_email"
}
```
3. Save the `clientID` and `clientSecret` from response

## Step 2: Get Bearer Token

1. Authenticate at: `http://4.224.186.213/evaluation-service/auth`
2. Request body:
```json
{
  "email": "your_email@domain.edu",
  "name": "Your Name",
  "rollNo": "your_roll_number",
  "accessCode": "your_access_code",
  "clientID": "your_client_id",
  "clientSecret": "your_client_secret"
}
```
3. Save the `access_token` from response

## Step 3: Configure Environment

Update `notification-app-be/.env` with your credentials:
```
PORT=5000
AFFORDMED_API_URL=http://4.224.186.213
CLIENT_ID=your_actual_client_id
CLIENT_SECRET=your_actual_client_secret
BEARER_TOKEN=your_actual_bearer_token
```

## Step 4: Install Dependencies

### Logging Middleware
```bash
cd logging-middleware
npm install
```

### Backend
```bash
cd notification-app-be
npm install
```

### Frontend
```bash
cd notification-app-fe
npm install
```

## Step 5: Run the Application

### Terminal 1 - Backend
```bash
cd notification-app-be
npm start
```
Backend will run on `http://localhost:5000`

### Terminal 2 - Frontend
```bash
cd notification-app-fe
npm run dev
```
Frontend will run on `http://localhost:3000`

## Step 6: Test Stage 6 Priority Script

```bash
cd notification-app-be
node stage6-priority.js 10
```

## API Endpoints

### Backend (http://localhost:5000/api)

- `GET /notifications` - Get all notifications with pagination
- `GET /notifications/priority` - Get priority notifications
- `GET /notifications/unread/count` - Get unread count
- `GET /notifications/:id` - Get single notification
- `POST /notifications` - Create notification
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/read-all` - Mark all as read

### Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `notification_type` - Filter by type (Placement, Result, Event)

## Troubleshooting

### Port Already in Use
If port 3000 or 5000 is already in use, kill the process:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### CORS Issues
Make sure backend is running on port 5000 and frontend on port 3000.

### Authentication Errors
Verify your bearer token is correct in `.env` file.
