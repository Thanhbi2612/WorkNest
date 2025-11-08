# WorkNest 🚀

**WorkNest** là một hệ thống quản lý công việc (Task Management System) toàn diện với tính năng realtime, được xây dựng với công nghệ hiện đại cho phép quản lý task, dự án, lịch làm việc, chat và báo cáo một cách hiệu quả.

---

## 📋 Mục Lục

- [Tính Năng](#-tính-năng)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Cài Đặt & Chạy Dự Án](#-cài-đặt--chạy-dự-án)
- [Tài Khoản Test](#-tài-khoản-test)
- [API Documentation](#-api-documentation)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Các Lệnh Hữu Ích](#-các-lệnh-hữu-ích)
- [Troubleshooting](#-troubleshooting)
- [Production Deployment](#-production-deployment)

---

## ✨ Tính Năng

### 🎯 Quản Lý Task
- **Tạo & Phân Công Task** (Admin): Gán task cho user với độ ưu tiên (low, medium, high, urgent)
- **Theo Dõi Trạng Thái**: Not Started → In Progress → Completed / Cancelled
- **Quản Lý Deadline**: Start date và due date với validation
- **Đính Kèm File**: Tối đa 5 files/task cho tài liệu
- **Lọc & Tìm Kiếm**: Filter theo status, priority, project, user
- **Dashboard Thống Kê**: Overview tasks, completion rate, overdue tasks
- **Báo Cáo Task**: User submit báo cáo hoàn thành kèm file đính kèm

### 📊 Quản Lý Dự Án
- **Tổ Chức Project**: Admin tạo và quản lý projects
- **Nhóm Task Theo Project**: Sắp xếp tasks vào các dự án
- **CRUD Operations**: Tạo, đọc, cập nhật, xóa với cascade protection

### 💬 Chat Realtime
- **Direct Message**: Chat 1-1 giữa các user
- **Group Chat**: Chat nhóm với nhiều người
- **Chia Sẻ File**: Upload và chia sẻ images/documents
- **Chỉnh Sửa Message**: Edit tin nhắn trong giới hạn thời gian
- **Tìm Kiếm Tin Nhắn**: Full-text search trong conversations
- **Đếm Tin Chưa Đọc**: Real-time unread notification tracking
- **WebSocket**: Socket.IO cho instant messaging

### 📅 Lịch Công Việc
- **Tạo Event**: Events cá nhân/team với FullCalendar
- **Calendar View**: Giao diện lịch đầy đủ
- **Today's Events**: Xem nhanh events hôm nay
- **Event Management**: CRUD operations cho events

### 👥 Quản Lý User
- **Role-Based Access**: Phân quyền Admin và User
- **User Profile**: Tùy chỉnh profile với avatar
- **User Directory**: Xem danh sách tất cả users
- **Bảo Mật**: Password hashing với bcryptjs, JWT authentication

### 🔔 Thông Báo Realtime
- **Notification Types**:
  - `task_assigned`: Khi được gán task mới
  - `task_updated`: Khi task được cập nhật
  - `task_completed`: Khi task hoàn thành
  - `deadline_reminder`: Nhắc nhở deadline
  - `report_submitted`: Khi báo cáo được submit
- **Real-time Updates**: Socket.IO cho instant notifications
- **Mark as Read/Unread**: Đánh dấu đã đọc
- **Bulk Actions**: Đánh dấu tất cả đã đọc

### 📝 Báo Cáo Task
- **Submit Report**: User nộp báo cáo hoàn thành task
- **Report Workflow**: Draft → Submitted → Resolved (by Admin)
- **File Support**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, TXT, ZIP, RAR (max 10MB)
- **Admin Review**: Admin đánh giá và mark resolved

### 📈 Dashboard & Analytics
- **User Dashboard**:
  - Tổng số task
  - Task completed
  - Task in-progress
  - Overview by status (Not Started, In Progress, Overdue, Completed)

- **Admin Dashboard**:
  - Tổng số users
  - Task status pie chart
  - Task completion radial chart
  - System-wide statistics

### ⚙️ Settings & Customization
- **Theme**: Light/Dark mode
- **Profile Management**: Cập nhật thông tin cá nhân
- **Change Password**: Đổi mật khẩu an toàn
- **Logout Options**: Logout single session hoặc all devices
- **Google OAuth**: Tùy chọn đăng nhập bằng Google

---

## 🛠 Công Nghệ Sử Dụng

### Backend
```
⚡ Express.js v5.1.0       - Web framework
🐘 PostgreSQL 14+          - Relational database
🔌 Socket.IO v4.8.1        - Real-time bidirectional communication
🔐 JWT (jsonwebtoken)      - Token-based authentication
🔒 bcrypt/bcryptjs         - Password hashing
📁 Multer v2.0.2          - File upload handling
🖼️  Sharp v0.34.4          - Image processing & optimization
📚 Swagger/OpenAPI        - API documentation
🌐 CORS                   - Cross-origin resource sharing
🛡️  express-rate-limit     - API rate limiting
```

### Frontend
```
⚛️  React v18+             - UI library
⚡ Vite                   - Build tool & dev server
🧭 React Router v6        - Client-side routing
📅 FullCalendar v6.1.19   - Calendar component
📊 Recharts               - Charts & analytics visualization
🔌 Socket.IO Client       - Real-time client
🔔 React Hot Toast        - Toast notifications
🔑 Google OAuth           - Social authentication
🌐 Axios                  - HTTP client
🎨 Tailwind CSS           - Utility-first CSS framework
```

### Database
```
🐘 PostgreSQL 14+
   - Custom PL/pgSQL Functions
   - Enum Types (conversation_type, message_type, participant_type)
   - Optimized queries with indexes
```

### DevOps
```
🐳 Docker & Docker Compose - Containerization
🌐 Nginx                   - Reverse proxy & static file serving
```

---

## 🏗 Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Compose                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ PostgreSQL   │  │   Backend    │  │      Frontend        │ │
│  │   :5432      │◄─│   :3000      │◄─│   Nginx :80          │ │
│  │              │  │              │  │   (React + Vite)     │ │
│  │  - Database  │  │  - REST API  │  │                      │ │
│  │  - Volume    │  │  - Socket.IO │  │  - SPA               │ │
│  │    Persist   │  │  - JWT Auth  │  │  - Real-time UI      │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               ▲
                               │
                        localhost:5173
                    (Frontend) & :3000 (API)
```

**Luồng Dữ Liệu:**
1. User truy cập `localhost:5173` → Nginx serve React app
2. React app gọi API → `localhost:3000/api/*`
3. Backend xử lý request → Query PostgreSQL
4. Socket.IO handle real-time events → Notifications, Chat
5. Response trả về → Update UI real-time

---

## 📦 Yêu Cầu Hệ Thống

- **Docker**: Version 20.x trở lên
- **Docker Compose**: Version 2.x trở lên
- **Git**: Để clone repository
- **Port Available**: 3000 (Backend), 5173 (Frontend), 5432 (PostgreSQL)

Kiểm tra version:
```bash
docker --version
docker-compose --version
git --version
```

---

## 🚀 Cài Đặt & Chạy Dự Án

### Bước 1: Clone Repository

```bash
git clone <repository-url>
cd WorkNest
```

### Bước 2: Cấu Hình Environment Variables

```bash
# Copy file .env.example thành .env
cp .env.example .env
```

**💡 Để test nhanh:** File `.env.example` đã có sẵn giá trị mặc định, bạn có thể dùng luôn!

**Các biến môi trường quan trọng:**

✅ **Sử dụng được ngay (Development):**
- `POSTGRES_PASSWORD=postgres123` - Password database
- `JWT_SECRET=dev-secret-key...` - Secret key cho JWT tokens
- `DATABASE_URL` - Connection string cho PostgreSQL

⚠️ **TÙY CHỌN:**
- `GOOGLE_CLIENT_ID` - Google OAuth (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret (optional)

**🔒 Lưu ý bảo mật:**
- ⚠️ Giá trị mặc định CHỈ dùng cho development/testing
- 🚨 Deploy production BẮT BUỘC đổi `POSTGRES_PASSWORD` và `JWT_SECRET`
- 🔑 Tạo JWT_SECRET an toàn: `openssl rand -base64 32`

### Bước 3: Khởi Động Services

```bash
docker-compose up
```

**Lần đầu chạy sẽ mất 2-3 phút để:**
- 🔨 Build Docker images
- 📥 Download PostgreSQL image
- 🗄️ Khởi tạo database schema
- 📊 Chạy schema.sql và init data

### Bước 4: Truy Cập Ứng Dụng

Sau khi thấy log **"Server is running on port 3000"**, truy cập:

| Service | URL | Mô tả |
|---------|-----|-------|
| 🎨 **Frontend** | http://localhost:5173 | Giao diện người dùng |
| 🔧 **Backend API** | http://localhost:3000 | REST API endpoints |
| 📚 **API Docs** | http://localhost:3000/api-docs | Swagger documentation |
| 🗄️ **Database** | localhost:5432 | PostgreSQL (internal) |

---

## 👤 Tài Khoản Test

Database đã có sẵn các tài khoản để test:

### Admin Account
```
Username: thanh1212
Password: Password123
```
**Quyền:** Tạo task, phân công, quản lý users, approve reports

### User Accounts
```
Username: john
Password: password123

Username: jane
Password: password123
```
**Quyền:** Xem tasks được gán, update status, submit reports, chat

---

## 📚 API Documentation

### Swagger/OpenAPI
Truy cập: **http://localhost:3000/api-docs**

### Main API Endpoints

#### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/user/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout current session
- `POST /api/auth/logout-all` - Logout all devices
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/change-password` - Change password

#### 📋 Tasks (`/api/tasks`)
- `GET /api/tasks` - Get all tasks (Admin)
- `GET /api/tasks/my-tasks` - Get user's tasks
- `GET /api/tasks/dashboard/stats` - Dashboard statistics
- `POST /api/tasks` - Create task (Admin)
- `PUT /api/tasks/:id` - Update task (Admin)
- `PUT /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task (Admin)

#### 📊 Projects (`/api/projects`)
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project (Admin)
- `PUT /api/projects/:id` - Update project (Admin)
- `DELETE /api/projects/:id` - Delete project (Admin)

#### 📅 Events (`/api/events`)
- `GET /api/events` - Get all events
- `GET /api/events/today` - Get today's events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

#### 💬 Chat (`/api/chat`)
- `GET /api/chat/conversations` - Get conversations
- `POST /api/chat/conversations` - Create conversation
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message
- `PUT /api/chat/messages/:id` - Edit message
- `DELETE /api/chat/messages/:id` - Delete message

#### 🔔 Notifications (`/api/notifications`)
- `GET /api/notifications` - Get notifications (paginated)
- `GET /api/notifications/unread/count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read

#### 📝 Task Reports (`/api/tasks/:taskId/reports`)
- `GET /api/tasks/:taskId/reports/my-reports` - User's reports
- `POST /api/tasks/:taskId/reports` - Create report
- `PUT /api/tasks/:taskId/reports/:reportId` - Update report
- `POST /api/tasks/:taskId/reports/:reportId/submit` - Submit report
- `PUT /api/reports/:id/resolve` - Resolve report (Admin)

---

## 📁 Cấu Trúc Dự Án

```
WorkNest/
├── 📂 backend/                    # Backend Node.js
│   ├── 📂 controllers/           # Request handlers
│   ├── 📂 routes/               # API route definitions
│   ├── 📂 models/               # Database models
│   ├── 📂 middleware/           # Auth, validation, error handling
│   ├── 📂 socket/               # Socket.IO event handlers
│   ├── 📂 config/               # Database, upload, swagger config
│   ├── 📂 utils/                # Helper functions
│   ├── 📂 public/               # Static files
│   ├── 📂 uploads/              # File storage
│   ├── 📄 server.js             # Entry point
│   ├── 📄 package.json          # Dependencies
│   └── 📄 Dockerfile            # Backend container
│
├── 📂 frontend/                   # Frontend React
│   ├── 📂 src/
│   │   ├── 📂 components/       # React components
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── tasks/          # Task components
│   │   │   ├── chat/           # Chat UI
│   │   │   ├── calendar/       # Calendar components
│   │   │   └── common/         # Shared components
│   │   ├── 📂 pages/            # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── Calendar.jsx
│   │   ├── 📂 services/         # API service layer
│   │   ├── 📂 context/          # React Context (Auth, Socket, Chat)
│   │   ├── 📂 hooks/            # Custom React hooks
│   │   ├── 📂 router/           # Route configuration
│   │   ├── 📄 main.jsx          # Entry point
│   │   └── 📄 App.jsx           # Root component
│   ├── 📄 package.json          # Dependencies
│   ├── 📄 vite.config.js        # Vite configuration
│   └── 📄 Dockerfile            # Frontend container
│
├── 📂 database/                   # Database scripts
├── 📄 schema.sql                 # Database schema
├── 📄 docker-compose.yml         # Container orchestration
├── 📄 .env.example              # Environment variables template
├── 📄 .gitignore                # Git ignore rules
└── 📄 README.md                 # This file
```

---

## 🔧 Các Lệnh Hữu Ích

### Development Commands

```bash
# Chạy ở background (detached mode)
docker-compose up -d

# Xem logs tất cả services
docker-compose logs -f

# Xem logs service cụ thể
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Dừng services
docker-compose down

# Dừng và xóa volumes (reset database)
docker-compose down -v

# Rebuild sau khi sửa code
docker-compose up --build

# Restart một service cụ thể
docker-compose restart backend
docker-compose restart frontend
```

### Database Commands

```bash
# Truy cập PostgreSQL shell
docker exec -it taskmanagement_postgres psql -U postgres -d task_management

# Backup database
docker exec taskmanagement_postgres pg_dump -U postgres task_management > backup.sql

# Restore database
docker exec -i taskmanagement_postgres psql -U postgres task_management < backup.sql
```

### Container Management

```bash
# Xem containers đang chạy
docker ps

# Truy cập vào container
docker exec -it taskmanagement_backend sh
docker exec -it taskmanagement_frontend sh

# Xem resource usage
docker stats

# Xem disk usage
docker system df
```

### Cleanup Commands

```bash
# Xóa containers đã dừng
docker container prune

# Xóa images không dùng
docker image prune

# Xóa volumes không dùng
docker volume prune

# Xóa tất cả (⚠️ Cẩn thận!)
docker system prune -a
```

---

## 🐛 Troubleshooting

### ❌ Port Already in Use

**Vấn đề:** Port 5173, 3000, hoặc 5432 đã được sử dụng

**Giải pháp:** Sửa port trong `docker-compose.yml`
```yaml
frontend:
  ports:
    - "8080:80"  # Thay 5173 bằng 8080
backend:
  ports:
    - "3001:3000"  # Thay 3000 bằng 3001
```

### ❌ Database Không Khởi Tạo

**Giải pháp:**
```bash
docker-compose down -v
docker-compose up
```

### ❌ Permission Denied (Linux/Mac)

**Giải pháp:**
```bash
sudo chown -R $USER:$USER backend/uploads
sudo chown -R $USER:$USER backend/public
```

### ❌ Cannot Connect to Database

**Kiểm tra:**
1. PostgreSQL container đang chạy: `docker ps`
2. Check logs: `docker-compose logs postgres`
3. Verify connection string trong `.env`

### ❌ Frontend Không Load

**Giải pháp:**
```bash
# Rebuild frontend
docker-compose up --build frontend

# Clear browser cache
# Check browser console for errors
```

---

## 🚀 Production Deployment

### Checklist Trước Khi Deploy

- [ ] **Đổi JWT_SECRET**: Generate strong secret
  ```bash
  openssl rand -base64 32
  ```
- [ ] **Đổi Database Password**: Strong password cho production
- [ ] **Set NODE_ENV=production**
- [ ] **Configure CORS**: Chỉ allow production domain
- [ ] **Enable HTTPS**: Setup SSL certificate (Let's Encrypt)
- [ ] **Setup Reverse Proxy**: Nginx/Caddy với HTTPS
- [ ] **Database Backup**: Automated backup strategy
- [ ] **Monitoring**: Setup logging và monitoring (PM2, New Relic, etc.)
- [ ] **Rate Limiting**: Adjust limits cho production traffic
- [ ] **File Storage**: Consider cloud storage (S3, Cloudinary) thay vì local
- [ ] **Environment Variables**: Use secrets manager (Vault, AWS Secrets)

### Recommended Production Setup

```yaml
# docker-compose.prod.yml example
version: '3.8'
services:
  postgres:
    environment:
      - POSTGRES_PASSWORD=${STRONG_POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  backend:
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${STRONG_JWT_SECRET}
    restart: always

  frontend:
    restart: always
```

### Deploy Lên Cloud

**Vercel (Frontend):**
- Build command: `cd frontend && npm run build`
- Output: `frontend/dist`

**Railway/Render (Backend + Database):**
- Auto-deploy từ Git
- Environment variables qua dashboard
- Managed PostgreSQL

**Docker-based (VPS):**
- DigitalOcean, AWS EC2, Google Cloud
- Docker Compose với production config
- Nginx reverse proxy với SSL

---

## 📄 License

This project is licensed under the ISC License.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Contact

For questions or support, please open an issue in the repository.

---

**Happy Coding! 🎉**
