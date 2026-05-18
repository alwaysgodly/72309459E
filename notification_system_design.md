# Stage 1

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
