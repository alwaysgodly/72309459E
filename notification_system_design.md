# Campus Notification System Design
**Platform:** Real-time notifications for placements, events, and results | **Scale:** 50K students, 5M+ notifications

---

## Stage 1: REST API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/notifications | Create notification (Admin) |
| GET | /api/notifications | Fetch all (paginated) |
| GET | /api/notifications/:id | Fetch single |
| PUT | /api/notifications/:id | Update (Admin) |
| DELETE | /api/notifications/:id | Soft delete (Admin) |
| PATCH | /api/notifications/:id/read | Mark as read |
| PATCH | /api/notifications/read-all | Mark all as read |
| GET | /api/notifications/unread-count | Get unread count |

**Authorization:** Bearer token | Admin/Moderator: CRUD | Users: View/Read

---

## Stage 2: MongoDB Design

**Why MongoDB:** Flexible schema, horizontal scalability, native TTL, JSON alignment, real-time efficiency

**Collections:**
```javascript
notifications: { _id, title, message, category, priority, targetAudience, 
                 department, year, isActive, createdAt, updatedAt, expiresAt }

notification_reads: { _id, notificationId, studentId, isRead, readAt, createdAt }
```

**Indexes:**
```javascript
db.notifications.createIndex({ createdAt: -1 });
db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL
db.notification_reads.createIndex({ studentId: 1, isRead: 1 });
db.notification_reads.createIndex({ notificationId: 1, studentId: 1 }, { unique: true });
```

**Scaling:** Pagination, TTL auto-delete, Redis cache (unread counts), sharding by studentId

---

## Stage 3: SQL Query Optimization

**Problem:** 50K × 5M denormalized = full table scans, O(N) cost (~100ms)

**Solution:** Normalize → 3 tables: `students | notifications | notification_recipients(student_id, notification_id, is_read)`

**Optimized Query (O(log N + K) ~1-5ms):**
```sql
SELECT n.id, n.title FROM notification_recipients nr
JOIN notifications n ON n.id = nr.notification_id
WHERE nr.student_id = 1042 AND nr.is_read = false
ORDER BY n.created_at ASC;
```

**Composite Index:**
```sql
CREATE INDEX idx_recipients_student_read 
ON notification_recipients(student_id, is_read, notification_id);
```

---

## Stage 4: Performance Optimization

**Problem:** Every page load queries DB → overwhelming load

**8 Strategies:** Client cache | Redis cache | Pagination | ETag | Separate unread API | WebSocket/SSE | Background refresh | DB indexing

**Recommended Stack:**
- ✓ Paginate 20/page
- ✓ Redis cache (5min TTL) for unread counts
- ✓ Client-side cache (localStorage)
- ✓ WebSocket for real-time push
- ✓ Background refresh (2min interval)
- ✓ Composite indexes

**Result:** 90% fewer queries, <100ms load time, real-time updates

---

## Stage 5: Bulk Notification Reliability (50K Students)

**Problem:** Synchronous loop fails midway → 200 students lost, no recovery

**Issues:** Slow (5-10min) | No retry | No idempotency | Partial failures untraceable

**Solution:** Decouple via message queue with idempotent workers

```javascript
1. create_notification() → save once
2. bulk_insert_recipients() → atomic insert
3. enqueue_jobs() → with idempotency_key
4. email_worker() → check idempotency → send → mark delivered
   (On failure: retry with exponential backoff OR dead-letter queue)
```

**Result:** 30-second processing, zero duplicates, safe retries, failure isolation
