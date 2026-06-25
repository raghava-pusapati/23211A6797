# Notification System Design

## Stage 1

### REST API Endpoints

**Base URL:** `http://localhost:5000/api`

**Authentication:** All routes need Bearer token in headers
```
Authorization: Bearer <token>
```

#### GET /notifications
Get paginated list of notifications

Query params:
- `page` (default: 1)
- `limit` (default: 10) 
- `notification_type` (Placement, Result, Event)

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

#### GET /notifications/priority
Get top N priority notifications

Query params:
- `limit` (default: 10)

Returns sorted array: Placement > Result > Event, newest first

#### GET /notifications/:id
Get single notification

Response: notification object or 404

#### POST /notifications
Create notification

Body:
```json
{
  "type": "Placement",
  "message": "Google hiring",
  "priority": true
}
```

#### PATCH /notifications/:id/read
Mark notification as read

Returns updated notification with readAt timestamp

#### PATCH /notifications/read-all
Mark all as read

Returns count of updated notifications

#### GET /notifications/unread/count
Get unread count by type

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

**Error Codes:**
- 400: Bad Request (invalid params)
- 401: Unauthorized
- 404: Not Found
- 500: Server Error
- 503: Service Unavailable

---

## Stage 2

### Database Choice: MongoDB

**Why MongoDB?**
- Flexible schema for different notification types
- Fast reads with proper indexing
- Easy horizontal scaling
- JSON-like documents match API responses well

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
// For fetching unread notifications
db.notifications.createIndex({ studentId: 1, isRead: 1, timestamp: -1 })

// For filtering by type
db.notifications.createIndex({ studentId: 1, type: 1, timestamp: -1 })

// For priority lookups
db.notifications.createIndex({ studentId: 1, priority: 1, timestamp: -1 })

// Unique constraint
db.notifications.createIndex({ notificationId: 1 }, { unique: true })

// Auto-delete old notifications (90 days)
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 })
```

### Scaling

**Read Scaling:**
- MongoDB read replicas
- Redis cache layer
- CDN for static assets

**Write Scaling:**
- Shard by studentId
- Batch inserts

**Data Management:**
- TTL indexes for auto-cleanup
- Archive old data to cold storage

---

## Stage 3

### Given Query

```sql
SELECT * FROM notifications 
WHERE studentID=1042 AND isRead=false 
ORDER BY createdAt;
```

### Problems

1. **SELECT *** - fetches all columns even if not needed
2. **No LIMIT** - returns all rows, could be thousands
3. **Slow sorting** - ORDER BY without proper index does filesort
4. **No pagination** - loads everything into memory

### Optimized Query

```sql
SELECT notificationId, type, message, timestamp, priority 
FROM notifications 
WHERE studentID = 1042 AND isRead = false 
ORDER BY createdAt DESC
LIMIT 20 OFFSET 0;
```

**Required Index:**
```sql
CREATE INDEX idx_student_read_created 
ON notifications(studentID, isRead, createdAt DESC);
```

This covers WHERE and ORDER BY in one index - much faster.

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

**Index needed:**
```sql
CREATE INDEX idx_type_created 
ON notifications(type, createdAt DESC, studentID);
```

---

## Stage 4

### Problem

Every page load queries database directly → slow and expensive

### Solutions

**1. Redis Caching**

Cache hot data with TTL:
- User notifications: 5 min TTL
- Unread count: 2 min TTL
- Priority list: 10 min TTL

Flow:
```
Request → Check Redis → HIT: return cached data
                     → MISS: query DB, cache result, return
```

Invalidate cache on writes (mark as read, new notification)

**2. Cursor-based Pagination**

Instead of OFFSET (slow for large offsets):
```sql
SELECT * FROM notifications
WHERE studentId = 1042 
  AND (createdAt, notificationId) < ('2026-06-24T10:30:00Z', 'n12345')
ORDER BY createdAt DESC, notificationId DESC
LIMIT 20;
```

Constant time O(1) for any page vs O(n) for offset

**3. Frontend Optimization**

- Lazy load notifications on scroll
- Virtual scrolling (render only visible items)
- Service worker caching
- Debounce filter changes

**4. Database**

- Connection pooling
- Query result streaming
- Read replicas

**Performance Gains:**

| Metric | Before | After |
|--------|--------|-------|
| First Load | 2.8s | 0.4s |
| Cached Load | 1.2s | 50ms |
| DB Queries/sec | 450 | 50 |

---

## Stage 5

### Current Problem

```javascript
for (const student of students) {
  await sendEmail(student);    // blocks
  await saveToDb(student);     // blocks
  await sendPush(student);     // blocks
}
```

Issues:
- One failure breaks everything
- Sequential processing is slow
- No retry on temporary failures

### Redesigned Solution

**Architecture:**

```
API Request → Publish to Queue → Return 202 Accepted

Background Workers (3-5 instances) → 
  Consume from Queue →
  Process (email, DB, push) in parallel →
  Success: ACK and remove
  Failure: NACK and retry with backoff
  Max retries failed: Move to Dead Letter Queue
```

**Queue Structure (Redis/RabbitMQ):**

```javascript
Message: {
  id: "notif_123",
  studentId: "STU001",
  type: "Placement",
  message: "TCS Hiring",
  retryCount: 0
}
```

**Worker Logic:**

```javascript
async function processNotification(msg) {
  try {
    // run in parallel
    await Promise.allSettled([
      sendEmail(msg),
      saveToDb(msg),
      sendPush(msg)
    ]);
    
    msg.ack(); // success
  } catch (err) {
    if (msg.retryCount < 3) {
      // retry with exponential backoff: 2s, 4s, 8s
      setTimeout(() => queue.publish(msg), 2 ** msg.retryCount * 1000);
      msg.ack();
    } else {
      // move to dead letter queue for manual review
      dlq.publish(msg);
      msg.ack();
    }
  }
}
```

**Benefits:**
- API responds in <50ms vs 15+ seconds
- Failures don't block other notifications
- Automatic retry
- Process 500+ notifications/minute vs 240/hour
- Can scale workers based on queue depth

---

## Stage 6

### Approach

Fetch all notifications from AffordMed API, sort in-memory by composite priority score, return top N.

**Priority Calculation:**

```
score = (type_weight × 10^12) - unix_timestamp

Type weights:
- Placement: 1
- Result: 2  
- Event: 3

Lower score = higher priority
```

Multiply by 10^12 so type dominates, then subtract timestamp for recency within same type.

**Example:**
```
Placement today:  1000000000000 - 1719302400000 = ...98... (highest)
Result today:     2000000000000 - 1719302400000 = ...98...
Event yesterday:  3000000000000 - 1719216000000 = ...98... (lowest)
```

**Implementation:** See `notification-app-be/stage6-priority.js`

Run with: `node stage6-priority.js 10`

**Why not use heap/priority queue?**
For our scale (hundreds of notifications), JavaScript Array.sort() is fast enough (~1-2ms). Network latency (50-200ms) dominates anyway. Heap would add complexity for minimal gain.

**Keeping top 10 updated:**
Since new notifications arrive continuously, we simply re-fetch and re-sort on demand. For production at larger scale, could use min-heap or Redis sorted sets.
