# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WorkNest is a full-stack task management system with real-time chat, calendar, and notification features. The application supports both regular users and admins with role-based access control and dual authentication (local + Google OAuth).

**Tech Stack:**
- **Backend:** Node.js + Express.js
- **Frontend:** React 19 + Vite
- **Database:** PostgreSQL 14
- **Real-time:** Socket.IO for chat and notifications
- **Deployment:** Docker Compose with 3 services (postgres, backend, frontend)

## Development Commands

### Docker (Primary Method)

```bash
# Start all services (first time will initialize database)
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f              # All services
docker-compose logs -f backend      # Backend only
docker-compose logs -f frontend     # Frontend only

# Rebuild after code changes
docker-compose up --build

# Stop and remove containers + volumes (fresh start)
docker-compose down -v

# Restart specific service
docker-compose restart backend
```

**Access URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger API Docs: http://localhost:3000/api-docs

**Test Accounts (from init.sql):**
- Admin: `thanh1212` / `Password123`
- User: `john` / `password123`
- User: `jane` / `password123`

### Local Development (Without Docker)

```bash
# Backend
cd backend
npm install
npm run dev        # Uses nodemon for auto-reload

# Frontend
cd frontend
npm install
npm run dev        # Vite dev server

# Database
# Manually run PostgreSQL and execute schema.sql, then database/init.sql
```

## Architecture

### Backend Structure

```
backend/
├── config/          # Database, Swagger, roles, upload configs
├── controllers/     # Business logic controllers
├── middleware/      # Auth, security, rate limiting, file uploads
├── models/          # Database models and queries
├── routes/          # API routes (auth, users, admin, tasks, chat, etc.)
├── socket/          # Socket.IO server and chat handlers
├── utils/           # JWT helpers, validators
└── server.js        # Main entry point
```

**Key Backend Patterns:**

1. **Dual User System:** The app has TWO separate user tables:
   - `users` table: Regular users (can be local or Google OAuth)
   - `user_admin` table: Admins (local auth only)
   - Authentication middleware sets `req.user.role` to 'admin' or 'user'
   - Use `req.user.userType` to determine which table to query

2. **JWT Authentication:**
   - Access tokens (short-lived) + Refresh tokens (long-lived)
   - Middleware: `authenticateToken` in middleware/auth.js
   - Admin routes protected by `requireAdmin` middleware
   - Tokens stored in `refresh_tokens` table with `user_type` column ('admin' or 'user')

3. **Socket.IO Real-time Features:**
   - Initialized in socket/socketServer.js
   - Chat messaging between users/admins
   - Real-time notifications
   - User online/offline status
   - Socket authentication uses JWT tokens

4. **File Uploads:**
   - Task attachments: `backend/uploads/tasks/`
   - Chat files: `backend/uploads/chat/`
   - User avatars: `backend/public/uploads/avatars/`
   - Report files: `backend/uploads/reports/`
   - Uses multer middleware with different configs per route:
     - `middleware/upload.js` - Avatar uploads (5MB limit, images only)
     - `middleware/uploadChat.js` - Chat file uploads
     - `middleware/uploadReport.js` - Report file uploads

5. **API Routes:**
   - All mounted under `/api` prefix (in server.js)
   - `/api/auth` - Login, register, refresh tokens, Google OAuth
   - `/api/users` - User CRUD (protected)
   - `/api/admin` - Admin operations
   - `/api/tasks` - Task management
   - `/api/projects` - Project management
   - `/api/events` - Calendar events
   - `/api/chat` - Chat conversations and messages
   - `/api/notifications` - Real-time notifications
   - `/api/*-reports` - Task reports (taskReports.js)

### Frontend Structure

```
frontend/src/
├── components/      # Reusable UI components
│   ├── auth/       # Login, register forms
│   ├── chat/       # Chat UI components
│   ├── tasks/      # Task cards, forms, charts
│   ├── common/     # Shared components (notifications, pagination)
│   └── theme/      # Theme provider
├── context/        # React Context providers
│   ├── AuthContext.jsx      # User authentication state
│   ├── SocketContext.jsx    # Socket.IO connection
│   ├── ChatContext.jsx      # Chat state management
│   └── SettingsContext.jsx  # User settings (theme, etc.)
├── pages/          # Main page components
├── layouts/        # MainLayout with sidebar
├── router/         # React Router configuration
├── services/       # API service layer (axios)
└── main.jsx        # App entry point
```

**Key Frontend Patterns:**

1. **Context Hierarchy (Important!):**
   The providers are nested in this specific order in main.jsx:
   ```
   GoogleOAuthProvider
     → AuthProvider
       → SocketProvider (depends on auth)
         → ChatProvider (depends on socket)
           → SettingsProvider
             → ThemeProvider
   ```
   Do NOT reorder these - Socket needs auth tokens, Chat needs socket connection.

2. **Protected Routes:**
   - `ProtectedRoute` component wraps authenticated pages
   - `requireAuth={true}` for user/admin access
   - `requireAdmin={true}` for admin-only pages (e.g., TaskControlPage, UserManagement)

3. **Real-time Updates:**
   - useSocket() hook from SocketContext for socket operations
   - useChat() hook from ChatContext for chat state
   - Components subscribe to socket events in useEffect

4. **API Communication:**
   - Services in `/services` directory use axios
   - Auth token automatically attached via interceptors
   - Base URL configured via VITE_API_URL env var

### Database Architecture

**Core Tables:**
- `users` - Regular users (local + Google OAuth)
- `user_admin` - Admin users (local only)
- `tasks` - Tasks with assignee, creator, watcher, project references
- `projects` - Project groupings
- `events` - Calendar events
- `notifications` - Real-time notifications
- `task_reports` - User-submitted task reports with approval workflow
- `task_files` - File attachments for tasks
- `task_attachments` - Additional task file attachments
- `task_tags` - Tags for task organization
- `refresh_tokens` - JWT refresh token storage with user_type tracking

**Chat System (Polymorphic Design):**
- `conversations` - Direct (1-1) or group chats
- `conversation_participants` - Joins users/admins to conversations
  - Uses `participant_type` ENUM ('user', 'admin') + `participant_id` for polymorphic relationships
  - Tracks `last_read_at` for unread counts
- `messages` - Chat messages with sender polymorphism (`sender_type` + `sender_id`)
  - Message types: 'text', 'file', 'image'
- `message_attachments` - File attachments in messages

**Database Functions:**
- `create_direct_conversation()` - Creates or returns existing 1-1 conversation
- `get_unread_count()` - Calculates unread messages for a participant
- `mark_conversation_as_read()` - Updates last_read_at timestamp
- `update_conversation_timestamp()` - Trigger to update conversation.updated_at on new message

**Views:**
- `v_participant_info` - Union of users and admins for easy participant lookup
- `v_conversation_details` - Conversation with participant details
- `v_message_details` - Messages with sender info

## Common Development Tasks

### Adding a New API Endpoint

1. Create route handler in `backend/routes/[resource].js`
2. Add authentication middleware: `authenticateToken` or `requireAdmin`
3. Add Swagger JSDoc comments for API documentation
4. Register route in `backend/routes/index.js` if new resource
5. Create corresponding service in `frontend/src/services/`

### Adding a New Real-time Feature

1. Add socket event handler in `backend/socket/socketServer.js` or create new handler file
2. Emit events from relevant API routes using `io.to(userId).emit()`
3. Subscribe to events in frontend using `socket.on()` in useEffect
4. Update SocketContext if new socket state needed

### Database Migrations

This project uses raw SQL schema files (schema.sql). To modify database:
1. Update `schema.sql` with new tables/columns
2. Update `database/init.sql` if seed data needed
3. Run `docker-compose down -v` then `docker-compose up` for fresh database
4. For production, create migration scripts manually

### Working with the Dual User System

When querying users, always check `userType` or `role`:

```javascript
// Backend example
const getUserById = async (userId, userType) => {
    const table = userType === 'admin' ? 'user_admin' : 'users';
    const query = `SELECT * FROM ${table} WHERE id = $1`;
    // ...
};

// Frontend: Check user.role from AuthContext
const { user } = useAuth();
if (user.role === 'admin') {
    // Admin-specific logic
}
```

### Password Handling

- Passwords are hashed with bcrypt/bcryptjs (both installed)
- Use bcrypt rounds: 10
- Google OAuth users may have NULL password_hash
- Always check `auth_provider` column ('local' or 'google') before password operations

## Important Notes

- **PostgreSQL Version:** Schema uses PostgreSQL 14. Some syntax (like `transaction_timeout`) may not work on newer versions - it's commented out in schema.sql
- **File Paths:** Upload paths are hardcoded in middleware. Be careful when changing directory structure
- **CORS:** Backend has CORS enabled for frontend URL. Update `corsOptions` in middleware/security.js if frontend URL changes
- **Rate Limiting:** General rate limiter applied to all requests. Specific routes may have stricter limits
- **Socket Authentication:** Sockets authenticate via token in handshake query. Don't connect socket before user is authenticated
- **Notification Types:** Multiple types supported in notifications table
- **Task Status Flow:** not_started → in_progress → completed/cancelled
- **Task Confirmation:** Admins can confirm tasks (is_confirmed flag, confirmed_by, confirmed_at)
- **Report Resolution:** Task reports have is_resolved flag, only admins can resolve (resolved_by references user_admin table)

## Environment Variables

Backend (.env):
```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
PORT, NODE_ENV, FRONTEND_URL
```

Frontend (.env):
```
VITE_API_URL          # Backend API base URL
VITE_SOCKET_URL       # Socket.IO server URL
VITE_GOOGLE_CLIENT_ID # Google OAuth client ID
```

Docker uses `.env` file at root level for docker-compose variables.
