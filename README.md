# Docker Quick Start Guide

Hướng dẫn nhanh để chạy Task Management System với Docker.

## Yêu cầu

- Docker version 20.x trở lên
- Docker Compose version 2.x trở lên

Kiểm tra version:
```bash
docker --version
docker-compose --version
```

## Chạy project

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd WorkNest
```

### Bước 2: Cấu hình environment variables

```bash
# Copy file .env.example thành .env
cp .env.example .env
```

**Để test nhanh:** File `.env.example` đã có sẵn giá trị mặc định, bạn có thể dùng luôn mà không cần sửa gì!

**Các giá trị trong .env:**

✅ **Sử dụng được ngay:**
- `POSTGRES_PASSWORD=postgres123` - Password database cho development
- `JWT_SECRET=dev-secret-key...` - Secret key cho JWT tokens

⚠️ **TÙY CHỌN - Có thể bỏ qua:**
- `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` - Chỉ cần nếu muốn test tính năng "Login with Google". Nếu bỏ qua, vẫn login được bằng username/password bình thường.

**Lưu ý bảo mật:**
- Các giá trị mặc định CHỈ dùng cho development/test local
- Nếu deploy production, BẮT BUỘC phải đổi `POSTGRES_PASSWORD` và `JWT_SECRET`
- Để tạo JWT_SECRET an toàn: `openssl rand -base64 32`

### Bước 3: Khởi động services

```bash
docker-compose up
```

Lần đầu chạy sẽ mất 2-3 phút để:
- Build Docker images
- Download PostgreSQL image
- Khởi tạo database
- Chạy schema.sql và init.sql

### Bước 3: Truy cập ứng dụng

Sau khi thấy log "Server is running on port 3000", truy cập:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs

### Bước 4: Login va bdau test

Database đã có sẵn tài khoản test:

**Admin:**
- Username: `thanh1212`
- Password: `Password123`

**Users:**
- Username: `john` / Password: `password123`
- Username: `jane` / Password: `password123`

## Các lệnh hữu ích

### Chạy ở background (detached mode)
```bash
docker-compose up -d
```

### Xem logs
```bash
# Tất cả services
docker-compose logs -f

# Service cụ thể
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Dừng services
```bash
docker-compose down
```

### Dừng và xóa data
```bash
docker-compose down -v
```

### Rebuild sau khi sửa code
```bash
docker-compose up --build
```

### Restart một service
```bash
docker-compose restart backend
docker-compose restart frontend
```

## Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                  Docker Compose                         │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PostgreSQL  │  │   Backend    │  │   Frontend   │ │
│  │    :5432     │◄─│    :3000     │◄─│  Nginx :80   │ │
│  │              │  │  (Node.js)   │  │   (React)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
                           │
                    localhost:5173
```

## Services

### 1. PostgreSQL (postgres)
- Image: postgres:14-alpine
- Port: 5432
- Database: task_management
- Auto-init với schema.sql và init.sql
- Persistent storage: Volume `postgres_data`

### 2. Backend (backend)
- Build: ./backend/Dockerfile
- Port: 3000
- Environment: Development mode
- Persistent uploads: Volumes `backend_uploads`, `backend_public_uploads`
- Health check: /health endpoint

### 3. Frontend (frontend)
- Build: ./frontend/Dockerfile
- Port: 5173 (mapped from container port 80)
- Nginx serving React build
- Proxy API requests to backend

## Troubleshooting

### Port already in use
Nếu port đã được sử dụng, sửa trong `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"  # Thay 5173 bằng 8080
```

### Database không khởi tạo
```bash
docker-compose down -v
docker-compose up
```

### Xem container đang chạy
```bash
docker ps
```

### Truy cập vào container
```bash
# Backend
docker exec -it taskmanagement_backend sh

# Database
docker exec -it taskmanagement_postgres psql -U postgres -d task_management
```

### Xem disk usage
```bash
docker system df
```

### Dọn dẹp Docker
```bash
# Xóa containers đã dừng
docker container prune

# Xóa images không dùng
docker image prune

# Xóa tất cả (cẩn thận!)
docker system prune -a
```

## Production Notes

Để deploy production, cần:
1. Thay đổi JWT_SECRET trong docker-compose.yml
2. Thay đổi database password
3. Set NODE_ENV=production
4. Thêm HTTPS với reverse proxy (Nginx/Caddy)
5. Setup backup cho database volume
6. Thêm monitoring và logging

---

Happy coding!
