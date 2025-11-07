# WorkNest - Task Management System Demo

## 🔗 Live Demo
- **Frontend:** [YOUR_FRONTEND_URL_HERE]
- **Backend API:** [YOUR_BACKEND_URL_HERE]
- **API Documentation:** [YOUR_BACKEND_URL_HERE]/api-docs

## 👤 Test Accounts

### Admin Account
```
Username: thanh1212
Password: Password123
```
**Permissions:**
- Full system administration
- User management (create, edit, delete users)
- Task confirmation and oversight
- Resolve task reports
- Access to all features

### Regular Users
```
Username: john
Password: password123
```
```
Username: jane
Password: password123
```
**Permissions:**
- Personal task management
- Real-time chat with other users/admins
- Calendar events
- Submit task reports
- File uploads

## ✨ Key Features to Explore

### 1. 🔐 Authentication System
- **Local Authentication:** Login with username/password
- **Google OAuth:** One-click social login (if configured)
- **Dual User System:** Separate admin and user roles
- **JWT Tokens:** Secure access + refresh token mechanism

### 2. 📋 Task Management
- **CRUD Operations:** Create, read, update, delete tasks
- **Task Assignment:** Assign tasks to specific users
- **Priority Levels:** High, Medium, Low
- **Status Tracking:** Not Started → In Progress → Completed/Cancelled
- **Due Dates:** Set start and end dates
- **Project Grouping:** Organize tasks by projects
- **File Attachments:** Upload files to tasks
- **Task Confirmation:** Admins can confirm task completion

### 3. 💬 Real-time Chat
- **Direct Messaging:** 1-on-1 conversations
- **Group Chats:** Multiple participants
- **File Sharing:** Send images and files
- **Online Status:** See who's online
- **Unread Counts:** Track unread messages
- **Cross-role Chat:** Users can chat with admins

### 4. 📅 Calendar Integration
- **Event Management:** Create and manage calendar events
- **Visual Calendar:** Month/week/day views
- **Task Integration:** See tasks on calendar
- **Drag & Drop:** Easy event scheduling

### 5. 🔔 Real-time Notifications
- **Task Updates:** Get notified of task changes
- **New Messages:** Chat notifications
- **System Alerts:** Important system notifications
- **Live Updates:** No refresh needed

### 6. 📊 Reports & Analytics
- **Task Reports:** Users can submit task reports
- **Admin Review:** Admins can approve/reject reports
- **Dashboard Stats:** Overview of tasks, projects, users
- **Charts:** Visual representation of data

### 7. 👥 User Management (Admin Only)
- **User CRUD:** Create, edit, delete users
- **Role Management:** Assign user/admin roles
- **Activity Monitoring:** Track user activities
- **Account Status:** Enable/disable accounts

## 🛠️ Technology Stack

### Frontend
- **React 19** - Latest React with modern hooks
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time bidirectional communication
- **FullCalendar** - Calendar UI component
- **Recharts** - Data visualization

### Backend
- **Node.js + Express 5** - REST API server
- **Socket.IO** - WebSocket server for real-time features
- **PostgreSQL 14** - Relational database
- **JWT** - Token-based authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Swagger** - API documentation

### DevOps
- **Docker + Docker Compose** - Containerization
- **Multi-stage Builds** - Optimized images
- **Nginx** - Frontend static file serving
- **GitHub** - Version control

## 🏗️ Architecture Highlights

### Dual User System
- Separate tables for regular users (`users`) and admins (`user_admin`)
- Polymorphic relationships for chat and notifications
- Role-based access control throughout

### Real-time Features
- Socket.IO with JWT authentication
- Room-based messaging for conversations
- Targeted notifications per user
- Automatic reconnection handling

### Security
- JWT access + refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting on API endpoints
- CORS protection
- Input validation
- SQL injection prevention (parameterized queries)
- File upload restrictions

### Database Design
- Normalized schema with foreign keys
- Database functions for complex operations
- Views for simplified queries
- Triggers for automatic updates
- Polymorphic participant system for chat

## 📱 How to Test

### Scenario 1: Admin Workflow
1. Login as `thanh1212`
2. Go to User Management → View all users
3. Create a new task and assign to `john`
4. Check real-time notification system
5. View dashboard statistics
6. Confirm completed tasks

### Scenario 2: User Workflow
1. Login as `john`
2. View assigned tasks
3. Update task status to "In Progress"
4. Upload a file attachment
5. Submit a task report
6. Chat with admin or other users

### Scenario 3: Real-time Collaboration
1. Open app in two browsers
2. Login as `john` in browser 1
3. Login as `jane` in browser 2
4. Send chat messages between them
5. Watch notifications appear in real-time
6. Create/update tasks and see live updates

## 📂 Source Code

- **Repository:** [YOUR_GITHUB_REPO_URL]
- **Documentation:** See `README.md` and `CLAUDE.md`
- **API Docs:** Available at `/api-docs` endpoint

## 💡 Development Highlights

- **Clean Architecture:** Separation of concerns (routes, controllers, models)
- **Code Quality:** ESLint configured, consistent code style
- **Documentation:** Swagger API docs, inline comments
- **Error Handling:** Centralized error middleware
- **Logging:** Request logging and security event tracking
- **Scalability:** Stateless backend, horizontal scaling ready

## 📧 Contact

For questions about this project or technical discussion:
- **Email:** [YOUR_EMAIL]
- **GitHub:** [YOUR_GITHUB_PROFILE]
- **LinkedIn:** [YOUR_LINKEDIN]

---

**Note:** This is a demonstration project. Test accounts are pre-configured with sample data. Feel free to create new users, tasks, and test all features!
