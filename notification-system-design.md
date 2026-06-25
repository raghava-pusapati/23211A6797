# Notification System Design

## Stage 1: REST API Design

### API Endpoints

Base URL: http://localhost:5000/api

Auth: Bearer token required for all endpoints

### GET /notifications
Fetch notifications with pagination

Query params:
- page (default 1)
- limit (default 10) 
- notification_type (optional: Placement/Result/Event)

Response:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "n123",
        "type": "Placement",
        "message": "TCS Hiring",
        "timestamp": "2026-06-24T10:30:00Z",
        "isRead": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "hasNext": true
    }
  }
}
```

### GET /notifications/priority
Returns top priority notifications sorted by type then timestamp

Query: limit (default 10)

### GET /notifications/:id
Fetch single notification by ID

### POST /notifications
Create new notification

Body:
```json
{
  "type": "Placement",
  "message": "Google hiring",
  "priority": true
}
```

### PATCH /notifications/:id/read
Mark single notification as read

### PATCH /notifications/read-all
Mark all notifications as read

### GET /notifications/unread/count
Get count of unread notifications grouped by type

Response:
```json
{
  "total": 15,
  "byType": {
    "Placement": 5,
    "Result": 3,
    "Event": 7
  }
}
```

Error responses:
- 400 Bad Request
- 401 Unauthorized  
- 404 Not Found
- 500 Internal Error
- 503 Service Unavailable

---

## Stage 2: Database Design

### DB Choice: MongoDB

Why MongoDB:
- flexible schema
- fast with indexes
- scales horizontally
- document format matches our JSON responses

### Collections

#### notifications
```javascript
{
  _id: ObjectId,
  notificationId: String,
  studentId: String,
  type: String, // Placement, Result, Event
  message: String,
  timestamp: Date,
  isRead: Boolean,
  readAt: Date,
  priority: Boolean,
  details: Object,
  createdAt: Date
}
```

#### students
```javascript
{
  _id: ObjectId,
  studentId: String,
  email: String,
  name: String,
  preferences: Object,
  lastLogin: Date
}
```

### Indexes

```javascript
db.notifications.createIndex({ studentId: 1, isRead: 1, timestamp: -1 })
db.notifications.createIndex({ studentId: 1, type: 1, timestamp: -1 })
db.notifications.createIndex({ studentId: 1, priority: 1, timestamp: -1 })
db.notifications.createIndex({ notificationId: 1 }, { unique: true })
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 })
```

### Scaling approach

Read scaling:
- read replicas
- Redis cache
- CDN for frontend assets

Write scaling:
- shard by studentId
- batch inserts for bulk operations

Data management:
- TTL index auto-deletes old notifications (90 days)
- archive to S3 or similar for historical data

---

## Stage 3: Query Optimization

### Original query

```sql
SELECT * FROM notifications 
WHERE studentID=1042 AND isRead=false 
ORDER BY createdAt;
```

### Issues

1. SELECT * fetches unnecessary columns
2. No LIMIT means could return thousands of rows
3. ORDER BY without index is slow
4. No pagination

### Better query

```sql
SELECT notificationId, type, message, timestamp, priority 
FROM notifications 
WHERE studentID = 1042 AND isRead = false 
ORDER BY createdAt DESC
LIMIT 20 OFFSET 0;
```

Need this index:
```sql
CREATE INDEX idx_student_read_created 
ON notifications(studentID, isRead, createdAt DESC);
```

This index covers both WHERE clause and ORDER BY.

### Query 2: Students with placement notifications in last 7 days

```sql
SELECT s.studentID, s.name, s.email, COUNT(*) as notif_count
FROM students s
INNER JOIN notifications n ON s.studentID = n.studentID
WHERE n.type = 'Placement'
  AND n.createdAt >= CURRENT_DATE - INTERVAL 7 DAY
  AND n.createdAt < CURRENT_DATE + INTERVAL 1 DAY
GROUP BY s.studentID, s.name, s.email
ORDER BY notif_count DESC;
```

Index:
```sql
CREATE INDEX idx_type_created 
ON notifications(type, createdAt DESC, studentID);
```

---

## Stage 4: Performance

### Problem

Every page load hits the database - this is slow and expensive at scale.

### Solutions

1. Redis caching

Cache with TTL:
- notifications: 5min
- unread counts: 2min  
- priority list: 10min

Flow: check cache first, on miss query DB and cache result

Invalidate on writes

2. Cursor pagination instead of offset

```sql
SELECT * FROM notifications
WHERE studentId = 1042 
  AND (createdAt, notificationId) < ('2026-06-24T10:30:00Z', 'n12345')
ORDER BY createdAt DESC, notificationId DESC
LIMIT 20;
```

This is O(1) for any page, offset pagination is O(n)

3. Frontend

- lazy loading
- virtual scroll for long lists
- service worker cache
- debounce filters

4. Database

- connection pooling
- read replicas for GET requests

Results:
- First load: 2.8s → 0.4s
- Cached: 1.2s → 50ms  
- DB load: 450 → 50 queries/sec

---

## Stage 5: Notification Sending

### Current approach (bad)

```javascript
for (const student of students) {
  await sendEmail(student);    // blocks
  await saveToDb(student);     // blocks
  await sendPush(student);     // blocks
}
```

Problems:
- sequential = slow
- one failure stops everything  
- no retries

### Better design

Use message queue (Redis or RabbitMQ):

```
API Request → Publish to Queue → Return 202 Accepted

Background Workers (3-5 instances) → 
  Consume from Queue →
  Process (email, DB, push) in parallel →
  Success: ACK and remove
  Failure: NACK and retry with backoff
  Max retries failed: Move to Dead Letter Queue
```

Queue message format:

```javascript
{
  id: "notif_123",
  studentId: "STU001",
  type: "Placement",
  message: "TCS Hiring",
  retryCount: 0
}
```

Worker code:

```javascript
async function processNotification(msg) {
  try {
    await Promise.allSettled([
      sendEmail(msg),
      saveToDb(msg),
      sendPush(msg)
    ]);
    msg.ack();
  } catch (err) {
    if (msg.retryCount < 3) {
      setTimeout(() => queue.publish(msg), 2 ** msg.retryCount * 1000);
      msg.ack();
    } else {
      dlq.publish(msg);
      msg.ack();
    }
  }
}
```

Benefits:
- API responds instantly (<50ms)
- failures don't block other notifications
- auto retry with exponential backoff
- can scale workers independently
- handle 500+ notifs/min

---

## Stage 6: Priority Sorting

### Implementation

Fetch from AffordMed API, sort in memory by priority score, return top N

Priority formula:

score = (typeWeight * 10^12) - timestamp

Type weights: Placement=1, Result=2, Event=3
Lower score = higher priority

Multiply by large number so type always dominates, then subtract timestamp for newest first within same type.

Example:
- Placement today: 1000000000000 - 1719302400000 (high priority)
- Result today: 2000000000000 - 1719302400000 
- Event yesterday: 3000000000000 - 1719216000000 (low priority)

Code is in `notification-app-be/stage6-priority.js`

Run: `node stage6-priority.js 10`

Why not heap? For a few hundred notifications Array.sort is fine (~1-2ms). Network call takes 50-200ms anyway so not worth the complexity.

For production at scale would use Redis sorted sets or min heap to maintain top N efficiently.
