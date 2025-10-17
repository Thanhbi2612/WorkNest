# 📋 Task Management System

Hệ thống quản lý công việc toàn diện với tính năng real-time chat, thông báo, báo cáo và quản lý dự án.

## 🚀 Tính năng chính

### 👤 Quản lý người dùng
- Đăng ký/Đăng nhập với JWT authentication
- Google OAuth login
- Phân quyền Admin/User
- Quản lý profile với avatar upload
- Đổi mật khẩu

### ✅ Quản lý công việc
- Tạo, sửa, xóa tasks
- Phân công tasks cho users
- Trạng thái: Not Started, In Progress, Completed
- Priority: Low, Medium, High
- Due date với cảnh báo quá hạn
- Upload files đính kèm
- Lọc tasks: Today, Upcoming, Overdue, Completed

### 📊 Quản lý dự án
- Tạo và quản lý projects
- Assign tasks vào projects
- Theo dõi tiến độ dự án
- Thống kê tasks trong project

### 💬 Chat Real-time
- Chat 1-1 giữa users và admins
- Gửi text messages
- Upload và gửi files
- Trạng thái online/offline
- Thông báo tin nhắn chưa đọc
- Socket.io cho real-time communication

### 🔔 Thông báo
- Thông báo real-time khi:
  - Được assign task mới
  - Task sắp đến hạn
  - Có tin nhắn mới
  - Có báo cáo mới
- Đánh dấu đã đọc/chưa đọc
- Badge count hiển thị số lượng

### 📈 Báo cáo
- User gửi báo cáo task completion
- Admin review và approve
- Upload files báo cáo
- Lọc theo trạng thái: Pending, Approved, Rejected

### 📅 Lịch
- Xem tasks theo calendar view
- Highlight tasks theo due date
- Tích hợp với task management

### ⚙️ Cài đặt
- Dark/Light mode
- Tùy chỉnh giao diện
- Quản lý thông báo

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** + **Sharp** - File upload & image processing
- **Google OAuth 2.0** - Social login

### Frontend
- **React 18** + **Vite**
- **React Router** - Routing
- **Context API** - State management
- **Socket.io Client** - Real-time
- **Lucide Icons** - Icons
- **React Hot Toast** - Notifications
- **CSS Variables** - Theming

---

## 📦 Cấu trúc dự án

```
task-management/
├── backend/
│   ├── config/          # Database, server config
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, error handling
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   ├── uploads/         # File uploads storage
│   │   ├── avatars/
│   │   ├── chat/
│   │   ├── reports/
│   │   ├── tasks/
│   │   └── documents/
│   ├── .env            # Environment variables (cần tạo)
│   └── server.js       # Entry point
│
├── frontend/
│   ├── public/         # Static assets
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── context/    # React Context
│   │   ├── hooks/      # Custom hooks
│   │   ├── layouts/    # Page layouts
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   └── App.jsx     # App entry
│   ├── .env           # Environment variables (cần tạo)
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start với Docker (Khuyến nghị)

Cách nhanh nhất để chạy project - chỉ cần Docker!

### 1. Yêu cầu

- Docker >= 20.x
- Docker Compose >= 2.x

### 2. Setup environment variables

```bash
# Clone repository
git clone <repository-url>
cd WorkNest

# Copy .env.example thành .env
cp .env.example .env

# Mở file .env và cập nhật:
# - POSTGRES_PASSWORD (database password)
# - JWT_SECRET (generate: openssl rand -base64 32)
# - GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET (nếu dùng OAuth)
```

### 3. Chạy project

```bash
# Khởi động tất cả services (database, backend, frontend)
docker-compose up

# Hoặc chạy ở background
docker-compose up -d
```

### 4. Truy cập ứng dụng

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

### 5. Login credentials

Database đã được tự động khởi tạo với các tài khoản test:

Admin account:
- Username: thanh1212
- Password: Password123

User accounts:
- Username: john / Password: password123
- Username: jane / Password: password123

### 6. Dừng services

```bash
# Dừng containers
docker-compose down

# Dừng và xóa volumes (xóa database data)
docker-compose down -v
```

### 7. Rebuild nếu có thay đổi code

```bash
docker-compose up --build
```

---

## 🛠️ Hướng dẫn cài đặt thủ công (Manual Setup)

Nếu không dùng Docker, làm theo các bước sau:

### 1. Yêu cầu hệ thống

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL >= 14.x
- Git

### 2. Clone repository

```bash
git clone <repository-url>
cd task-management
```

### 3. Setup Database

#### Bước 3.1: Tạo database
```bash
# Mở PostgreSQL
psql -U postgres

# Trong psql:
CREATE DATABASE task_management;
\q
```

#### Bước 3.2: Chạy migration SQL
```bash
# Import schema từ file SQL (nếu có file dump)
psql -U postgres -d task_management < database_schema.sql

# Hoặc chạy từng migration file
psql -U postgres -d task_management -f backend/migrations/001_initial_schema.sql
```

**Hoặc tạo tables thủ công:** (Xem phần Database Schema bên dưới)

### 4. Setup Backend

#### Bước 4.1: Install dependencies
```bash
cd backend
npm install
```

#### Bước 4.2: Tạo file `.env`
Tạo file `backend/.env` với nội dung:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_management
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_min_32_chars

# Google OAuth (Optional - nếu dùng Google login)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# File Upload
MAX_FILE_SIZE=5242880
# 5MB = 5 * 1024 * 1024 bytes
```

#### Bước 4.3: Chạy backend
```bash
npm start
# Hoặc dùng nodemon để auto-reload
npm run dev
```

Server sẽ chạy tại: **http://localhost:3000**

### 5. Setup Frontend

#### Bước 5.1: Install dependencies
```bash
cd frontend
npm install
```

#### Bước 5.2: Tạo file `.env`
Tạo file `frontend/.env` với nội dung:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000

# Google OAuth Client ID (nếu dùng Google login)
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

#### Bước 5.3: Chạy frontend
```bash
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:5173**

### 6. Tạo Admin account đầu tiên

Dùng API hoặc chạy SQL:

```sql
-- Trong psql:
INSERT INTO user_admin (username, email, password_hash, role, is_active, created_at, updated_at)
VALUES (
    'admin',
    'admin@example.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYmXjIHPWq6', -- password: admin123
    'admin',
    true,
    NOW(),
    NOW()
);
```

**Login credentials:**
- Username: `admin`
- Password: `admin123`

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/admin/login      - Universal login (admin/user)
POST   /api/auth/google           - Google OAuth login
POST   /api/auth/logout           - Logout
POST   /api/auth/refresh          - Refresh access token
GET    /api/auth/verify           - Verify token
PATCH  /api/auth/change-password  - Change password
```

### Users
```
POST   /api/users/register        - User registration
GET    /api/users/profile         - Get current user profile
PATCH  /api/users/profile         - Update current user profile
POST   /api/users/avatar          - Upload avatar
GET    /api/users/dropdown        - Get users for dropdown (authenticated)
GET    /api/users                 - Get all users (admin)
GET    /api/users/:id             - Get user by ID (admin)
DELETE /api/users/:id             - Delete user (admin)
```

### Tasks
```
GET    /api/tasks                 - Get all tasks
POST   /api/tasks                 - Create task
GET    /api/tasks/:id             - Get task by ID
PATCH  /api/tasks/:id             - Update task
DELETE /api/tasks/:id             - Delete task
GET    /api/tasks/user/:userId    - Get tasks by user
POST   /api/tasks/:id/files       - Upload task files
```

### Projects
```
GET    /api/projects              - Get all projects
POST   /api/projects              - Create project
GET    /api/projects/:id          - Get project by ID
PATCH  /api/projects/:id          - Update project
DELETE /api/projects/:id          - Delete project
GET    /api/projects/dropdown     - Get projects for dropdown
```

### Messages (Chat)
```
GET    /api/messages/conversation - Get conversation between 2 users
POST   /api/messages              - Send message
POST   /api/messages/upload       - Upload file in chat
PATCH  /api/messages/:id/read     - Mark message as read
```

### Notifications
```
GET    /api/notifications         - Get user notifications
PATCH  /api/notifications/:id/read - Mark notification as read
PATCH  /api/notifications/read-all - Mark all as read
GET    /api/notifications/counts  - Get notification counts
```

### Reports
```
GET    /api/reports               - Get all reports
POST   /api/reports               - Create report
GET    /api/reports/:id           - Get report by ID
PATCH  /api/reports/:id/status    - Update report status (admin)
POST   /api/reports/upload        - Upload report file
```

### Admin
```
GET    /api/admin/dashboard       - Dashboard statistics
GET    /api/admin/dropdown        - Get admins for dropdown
GET    /api/admin/health          - System health check
```

---

## 🔐 Authentication Flow

1. **Login**: User/Admin login → Backend verify → Return JWT tokens
2. **Access Token**: Short-lived (1 hour), gửi trong header `Authorization: Bearer <token>`
3. **Refresh Token**: Long-lived (7 days), dùng để get new access token
4. **Protected Routes**: Frontend check token → Call API with token → Backend verify

---

## 🎨 Theming

Dự án hỗ trợ Dark/Light mode với CSS variables:

```css
/* Light mode */
--bg-primary: #ffffff
--text-primary: #1f2937

/* Dark mode */
--bg-primary: #111827
--text-primary: #f9fafb
```

User có thể chuyển đổi trong **Settings** page.

---

## 📸 Screenshots

(Thêm screenshots của ứng dụng nếu có)

---

## 🐛 Troubleshooting

### Docker Issues

#### Containers không khởi động
```bash
# Xem logs của tất cả services
docker-compose logs

# Xem logs của service cụ thể
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Restart services
docker-compose restart
```

#### Port đã được sử dụng
```bash
# Nếu port 5173, 3000, hoặc 5432 đã được dùng
# Thay đổi port mapping trong docker-compose.yml

# Ví dụ: Thay đổi frontend port
ports:
  - "8080:80"  # Truy cập qua http://localhost:8080
```

#### Database không khởi tạo
```bash
# Xóa volumes và tạo lại
docker-compose down -v
docker-compose up

# Kiểm tra database logs
docker-compose logs postgres
```

#### Rebuild image sau khi sửa code
```bash
# Build lại và khởi động
docker-compose up --build

# Hoặc build riêng từng service
docker-compose build backend
docker-compose build frontend
```

### Manual Setup Issues

#### Backend không khởi động
```bash
# Kiểm tra PostgreSQL đang chạy
# Windows:
services.msc → PostgreSQL service

# Check logs
npm start
```

#### Database connection error
- Kiểm tra DB_HOST, DB_PORT, DB_USER, DB_PASSWORD trong .env
- Kiểm tra database task_management đã tạo chưa

#### Socket.io không kết nối
- Kiểm tra VITE_SOCKET_URL trong frontend .env
- Kiểm tra CORS config trong backend/server.js

#### File upload không hoạt động
- Kiểm tra thư mục backend/uploads/ có tồn tại
- Kiểm tra permissions: chmod -R 755 backend/uploads/

#### JWT Token expired
- Refresh token hết hạn → User phải login lại
- Check JWT_SECRET và JWT_REFRESH_SECRET trong .env

---

## 📝 TODO & Future Features

- [ ] Email notifications
- [ ] Export reports to PDF
- [ ] Task comments/discussion
- [ ] Calendar integration (Google Calendar)
- [ ] Task templates
- [ ] Time tracking
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard

---

## 👥 Đóng góp

1. Fork project
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

---

## 📄 License

MIT License - Xem file `LICENSE` để biết thêm chi tiết.

---

## 📞 Liên hệ

- **Email**: your-email@example.com
- **GitHub**: https://github.com/yourusername
- **Project Link**: https://github.com/yourusername/task-management

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Socket.io](https://socket.io/)
- [Vite](https://vitejs.dev/)
- [Lucide Icons](https://lucide.dev/)

---

**Built with ❤️ using React + Node.js + PostgreSQL**
