# Stage 1: REST API Design

## Endpoints

- **POST /api/notifications** - Create a new notification
- **GET /api/notifications** - Fetch all notifications (with pagination)
- **GET /api/notifications/:id** - Fetch a single notification
- **PUT /api/notifications/:id** - Update a notification
- **DELETE /api/notifications/:id** - Delete a notification
- **PATCH /api/notifications/:id/read** - Mark a notification as read
- **PATCH /api/notifications/read-all** - Mark all notifications as read
- **GET /api/notifications/unread-count** - Get unread notification count

---

# Stage 2: Database Design & Query Implementation

## MongoDB

**Why:** Flexible schema, horizontal scalability, TTL indexes, JSON alignment, real-time efficiency.

## Schemas

**notifications:** `_id, title, message, category (placement|event|result), priority (low|medium|high), targetAudience, department, year, isActive, createdAt, updatedAt, expiresAt`

**notification_reads:** `_id, notificationId, studentId, isRead, readAt, createdAt`

## Indexes

```javascript
db.notifications.createIndex({ createdAt: -1 });
db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });  // TTL
db.notifications.createIndex({ isActive: 1, createdAt: -1 });
db.notifications.createIndex({ category: 1, priority: -1 });
db.notifications.createIndex({ targetAudience: 1, department: 1, year: 1 });
db.notification_reads.createIndex({ notificationId: 1, studentId: 1 }, { unique: true });
db.notification_reads.createIndex({ studentId: 1, isRead: 1 });
```

## Scaling

**Issues:** High query volume, rapid data accumulation, expensive unread count queries.

**Solutions:** Pagination (20/page), TTL auto-delete, Redis caching for unread counts, sharding by `studentId`, message queue (RabbitMQ/Kafka).

## Queries

```javascript
// POST - Create
db.notifications.insertOne({ title, message, category, priority, targetAudience, isActive: true, createdAt: new Date(), expiresAt: new Date(Date.now() + 30*24*60*60*1000) })

// GET - Fetch paginated
db.notifications.find({ isActive: true }).sort({ createdAt: -1 }).skip(0).limit(20)

// GET - Fetch single
db.notifications.findOne({ _id: ObjectId("...") })

// PUT - Update
db.notifications.updateOne({ _id: ObjectId("...") }, { $set: { title, message, updatedAt: new Date() } })

// DELETE - Soft delete
db.notifications.updateOne({ _id: ObjectId("...") }, { $set: { isActive: false, updatedAt: new Date() } })

// PATCH - Mark read
db.notification_reads.updateOne({ notificationId: ObjectId("..."), studentId: "STU123" }, { $set: { isRead: true, readAt: new Date() } }, { upsert: true })

// PATCH - Mark all read
db.notification_reads.updateMany({ studentId: "STU123", isRead: false }, { $set: { isRead: true, readAt: new Date() } })

// GET - Unread count
db.notification_reads.countDocuments({ studentId: "STU123", isRead: false })
```

Campus notification platform (placements, events, results) - pre-authorized users, Socket.IO real-time, Logging Middleware only.

## Endpoints

**Common:** `Authorization: Bearer {token}`, Response: `{ success, statusCode, data, timestamp }`

**Status Codes:** 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 422 (Validation), 500 (Error)


### 1. POST /api/notifications (Create - Admin/Moderator)
```json
{ "title", "message", "category", "priority", "targetAudience", "expiresAt" }
```
**Response:** Notification object with id, isRead, timestamps

### 2. GET /api/notifications (Get All - Query: page, limit, category, priority, sortBy, sortOrder)
**Response:** Array + pagination metadata

### 3. GET /api/notifications/:id (Get Single)
**Response:** Notification object

### 4. PUT /api/notifications/:id (Update - Admin/Moderator)
**Request:** title, message, priority, expiresAt

### 5. DELETE /api/notifications/:id (Delete - Admin/Moderator)
**Response:** 204 No Content

### 6. PATCH /api/notifications/:id/read (Mark Read)
**Response:** `{ id, isRead: true, updatedAt }`

### 7. PATCH /api/notifications/read-all (Mark All Read)
**Response:** `{ updatedCount }`

### 8. GET /api/notifications/unread-count (Get Unread Count)
**Response:** `{ unreadCount, byCategory, byPriority }`

## Schema

**Notification:** id (UUID), title (5-200), message (10-2000), category (placement|event|result), priority (low|medium|high), targetAudience (string), isRead (boolean), createdAt, updatedAt, expiresAt (ISO 8601)

## Real-Time (Socket.IO)

**Event:** `notification:new`
**Payload:** Full notification object

**Listener:**
```javascript
socket.on('notification:new', (notification) => { /* update UI */ });
```

## Logging

**Middleware:** `Log(source, level, module, message, metadata)`
- source: "backend" | "frontend"
- level: "info" | "warn" | "error" | "debug"

**Examples:**
```
Log("backend", "info", "controller", "Notification created", { notificationId, category })
Log("frontend", "error", "api", "Failed to fetch", { error, endpoint })
```
**Rule:** Middleware only, no console logging

## Authorization

- Pre-authorized users (no login/registration)
- Bearer token in Authorization header
- Admin/Moderator: Create, Update, Delete
- Users: View, Read, Count

---

# Stage 3: SQL Query Optimization

**Problem:** Original query stores notifications per student—50K students × 5M notifications = massive duplication, causes full table scans.

**1. Not accurate:** Violates normalization.

**2. Why slow:** Full table scan of 5M rows, inefficient sorting in memory.

**3. Solution:** Normalize into 3 tables:
```sql
students | notifications | notification_recipients(student_id, notification_id, is_read)
```

**4. Improved query:**
```sql
SELECT n.id, n.title, n.created_at FROM notification_recipients nr
JOIN notifications n ON n.id = nr.notification_id
WHERE nr.student_id = 1042 AND nr.is_read = false
ORDER BY n.created_at ASC;
```

**5. Cost:** Without index O(N) ~100ms+; with composite index O(log N + K) ~1-5ms.

**6. Indexes (not every column—wastes storage & slows writes):**
```sql
CREATE INDEX idx_recipients_student_read ON notification_recipients(student_id, is_read, notification_id);
CREATE INDEX idx_notifications_type_created ON notifications(notification_type, created_at);
```

**7. Placement in last 7 days:**
```sql
SELECT DISTINCT s.id, s.name, s.email FROM students s
JOIN notification_recipients nr ON nr.student_id = s.id
JOIN notifications n ON n.id = nr.notification_id
WHERE n.notification_type = 'placement' AND n.created_at >= NOW() - INTERVAL '7 days';
```

---

# Stage 4: Performance Optimization (Caching & Real-Time)

**Problem:** Every page load fetches all notifications, overwhelming the database and degrading UX.

## 8 Optimization Strategies

| Strategy | How It Helps | Tradeoff |
|----------|-------------|----------|
| **1. Client-side caching** | Avoid re-fetching same data on page revisit | Stale data risk; requires invalidation logic |
| **2. Redis server cache** | Cache frequent queries (unread counts, recent notifications) | Additional infra; cache invalidation complexity |
| **3. Pagination/infinite scroll** | Fetch only 20 notifications per request instead of all | UX requires scroll; network overhead per page |
| **4. ETag/Last-Modified** | Return 304 Not Modified for unchanged data; reduce payload | Server must track versions; client logic needed |
| **5. Separate unread count API** | Quick unread count without fetching full notifications | Extra API call; eventual consistency |
| **6. WebSocket/SSE** | Real-time push instead of repeated polling | Persistent connection overhead; graceful fallback needed |
| **7. Background refresh** | Load notifications async after page render | User sees stale data initially; async complexity |
| **8. Database indexing** | Fast query execution (covered in Stage 3) | Storage overhead; index maintenance |

## Recommended Approach

**Combine:** Paginated APIs + Redis cache + client-side cache + WebSocket + background refresh + DB indexes

**Implementation:**
```
1. API returns 20 notifications/page (pagination)
2. Cache unread count in Redis (5 min TTL)
3. Store fetched pages in localStorage (client)
4. Connect WebSocket for new notifications (real-time push)
5. Refresh unread count in background (every 2 min)
6. Composite indexes on (student_id, is_read), (created_at)
```

**Result:** 
- ~90% reduction in DB queries
- Sub-100ms load time
- Real-time updates
- Minimal stale data
