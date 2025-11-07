# Hướng Dẫn Deploy WorkNest

Guide để deploy WorkNest lên môi trường production để nhà tuyển dụng có thể test.

## 🎯 Mục tiêu
- Deploy toàn bộ stack (Frontend + Backend + Database)
- Có URL public để share
- Chi phí $0 hoặc rất thấp
- Dễ setup (ít nhất có thể)


## 🚀 Option 2: Render + Vercel (RECOMMENDED - HOÀN TOÀN FREE)

**Ưu điểm:**
- ✅ Backend trên Render: Free forever (có sleep sau 15p)
- ✅ Frontend trên Vercel: Free, nhanh, không sleep
- ✅ Setup đơn giản qua Web UI
- ✅ Domain miễn phí cho cả 2
- ⚠️ Backend sleep sau 15 phút → cold start 30-60s (fix bằng UptimeRobot)
- ⚠️ PostgreSQL free chỉ 90 ngày → sau đó $7/tháng

### BƯỚC 1: Deploy PostgreSQL (Render)

1. **Tạo tài khoản:** https://render.com (Sign up with GitHub)

2. **Dashboard** → Click **"New +"** → **"PostgreSQL"**

3. **Điền thông tin:**
   ```
   Name: worknest-db
   Database: task_management
   User: worknest_user
   Region: Singapore (gần VN nhất)
   PostgreSQL Version: 14
   Plan: Free
   ```

4. Click **"Create Database"**

5. **⏳ Đợi 2-3 phút** database khởi tạo

6. **Lấy connection info:**
   - Tab **"Info"** → Copy **"Internal Database URL"** (cho backend env vars)
   - Tab **"Connect"** → Copy **"External Connection String"**

7. **Khởi tạo schema:**
   ```bash
   # Cài PostgreSQL client nếu chưa có:
   # Windows: https://www.postgresql.org/download/windows/
   # Mac: brew install postgresql
   # Linux: sudo apt install postgresql-client

   # Run schema
   psql "postgresql://worknest_user:xxxx@dpg-xxxx.singapore-postgres.render.com/task_management" < schema.sql

   # Run init data
   psql "YOUR_EXTERNAL_CONNECTION_STRING" < database/init.sql

   # Verify
   psql "YOUR_EXTERNAL_CONNECTION_STRING" -c "SELECT username FROM users;"
   ```

✅ **Database done!**

---

### BƯỚC 2: Deploy Backend (Render Web Service)

1. **Render Dashboard** → **"New +"** → **"Web Service"**

2. **Connect Repository:**
   - Click **"Connect account"** → Authorize GitHub
   - Chọn repo: `WorkNest`
   - Click **"Connect"**

3. **Configure Service:**
   ```
   Name: worknest-backend
   Region: Singapore
   Branch: main
   Root Directory: backend         ← QUAN TRỌNG!
   Runtime: Node
   Build Command: npm install
   Start Command: node server.js
   Plan: Free
   ```

4. **Advanced → Environment Variables:**

   Click **"Add Environment Variable"** và thêm từng cái:

   ```bash
   # === DATABASE (Lấy từ Internal URL của PostgreSQL) ===
   # Internal URL format: postgres://user:pass@hostname:5432/dbname
   # Tách ra thành các biến riêng:

   DB_HOST=dpg-xxxxx-a.singapore-postgres.render.com
   DB_PORT=5432
   DB_NAME=task_management
   DB_USER=worknest_user
   DB_PASSWORD=xxxxxxxxxxxxx

   # === JWT (Generate bằng: openssl rand -base64 32) ===
   JWT_SECRET=your-very-long-secret-key-at-least-32-characters-long
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d

   # === SERVER ===
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://worknest.vercel.app

   # ⚠️ FRONTEND_URL: Điền tạm, sẽ update sau khi deploy frontend

   # === GOOGLE OAUTH (Optional - bỏ trống nếu không dùng) ===
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   ```

   **💡 Cách lấy DB credentials từ Internal Database URL:**
   ```
   postgres://worknest_user:ABC123xyz@dpg-abcd1234.singapore-postgres.render.com:5432/task_management
           └─── USER ──┘ └─ PASSWORD ─┘ └────────────── DB_HOST ──────────────────┘ └PORT┘ └─ DB_NAME ──┘
   ```

5. **Add Persistent Disk** (cho file uploads):
   - Scroll xuống **"Disk"** section
   - Click **"+ Add Disk"**
   ```
   Name: uploads
   Mount Path: /opt/render/project/src/uploads
   Size: 1 GB (max cho free tier)
   ```

6. Click **"Create Web Service"**

7. **⏳ Đợi deploy** (~5-10 phút lần đầu)

8. **Lấy Backend URL:**
   - Sau khi deploy xong, copy URL: `https://worknest-backend-xxxx.onrender.com`

9. **Test backend:**
   ```bash
   curl https://worknest-backend-xxxx.onrender.com/health

   # Expected: {"status":"OK","database":"Connected",...}
   ```

✅ **Backend deployed!** Lưu lại URL này.

---

### BƯỚC 3: Deploy Frontend (Vercel)

1. **Tạo tài khoản:** https://vercel.com (Sign up with GitHub)

2. **Dashboard** → **"Add New..."** → **"Project"**

3. **Import Git Repository:**
   - Click **"Import"** ở repo `WorkNest`
   - (Nếu không thấy repo → Click "Adjust GitHub App Permissions")

4. **Configure Project:**
   ```
   Framework Preset: Vite (auto-detect)
   Root Directory: frontend        ← QUAN TRỌNG! Click "Edit" và chọn "frontend"
   Build Command: npm run build (auto)
   Output Directory: dist (auto)
   Install Command: npm install (auto)
   ```

5. **Environment Variables:**

   Click **"Environment Variables"** → Add:

   ```bash
   VITE_API_URL=https://worknest-backend-xxxx.onrender.com/api
   VITE_SOCKET_URL=https://worknest-backend-xxxx.onrender.com
   VITE_GOOGLE_CLIENT_ID=
   ```

   ⚠️ **Thay `worknest-backend-xxxx` bằng URL backend của bạn từ Bước 2!**
   ⚠️ **Nhớ có `/api` ở cuối `VITE_API_URL`**

6. Click **"Deploy"**

7. **⏳ Đợi build** (~2-3 phút)

8. **Lấy Frontend URL:**
   - Vercel sẽ cho URL: `https://worknest-abc123.vercel.app`
   - **LƯU LẠI URL này!**

9. **Test frontend:**
   - Mở browser: `https://worknest-abc123.vercel.app`
   - Nếu hiện login screen → OK!

✅ **Frontend deployed!**

---

### BƯỚC 4: Update CORS Backend

**Quan trọng!** Backend cần biết frontend URL để cho phép CORS.

1. **Quay lại Render Dashboard** → Click service **"worknest-backend"**

2. **Tab "Environment"** → Tìm biến `FRONTEND_URL`

3. Click **"Edit"** → Thay value bằng Vercel URL:
   ```
   FRONTEND_URL=https://worknest-abc123.vercel.app
   ```
   (Không có trailing slash `/`)

4. Click **"Save Changes"**

5. Backend sẽ **tự động redeploy** (~2 phút)

✅ **XONG! Deployment hoàn tất!**

---

### ✅ KIỂM TRA HOẠT ĐỘNG

1. **Mở frontend:** `https://worknest-abc123.vercel.app`

2. **Login với test account:**
   ```
   Username: thanh1212
   Password: Password123
   ```

3. **Test các tính năng:**
   - ✅ Login/Logout
   - ✅ Tạo task mới
   - ✅ Real-time chat (mở 2 tab, login 2 users khác nhau)
   - ✅ Upload file
   - ✅ Calendar events

4. **Check API docs:**
   - Mở: `https://worknest-backend-xxxx.onrender.com/api-docs`

---

### ⚠️ LƯU Ý QUAN TRỌNG - FREE TIER LIMITS

#### 1. Backend Sleep (Render Free)
- ❌ **Sleep sau 15 phút không có request**
- Cold start: 30-60 giây lần đầu

**Giải pháp:** Dùng **UptimeRobot** để ping backend:

1. Tạo tài khoản free: https://uptimerobot.com
2. **Add New Monitor:**
   ```
   Monitor Type: HTTP(s)
   Friendly Name: WorkNest Backend
   URL: https://worknest-backend-xxxx.onrender.com/health
   Monitoring Interval: 5 minutes (free tier)
   ```
3. Save → Backend sẽ không bao giờ sleep!

#### 2. PostgreSQL Expires (Render Free)
- ⏰ **Free database expires sau 90 ngày**
- Phải nâng cấp $7/tháng hoặc backup + recreate

**Giải pháp backup:**
```bash
# Backup database (chạy hàng tuần)
pg_dump "YOUR_EXTERNAL_DB_URL" > backup_$(date +%Y%m%d).sql

# Restore khi cần
psql "NEW_DB_URL" < backup_20250110.sql
```

#### 3. File Uploads
- ⚠️ Persistent disk có thể mất khi service redeploy
- **Giải pháp:** Migrate sang Cloudinary (free 25GB):
  - Sign up: https://cloudinary.com
  - Update backend để upload lên cloud thay vì local disk

---

### 🌐 OPTIONAL: Custom Domain

**Backend (Render):**
1. Dashboard → worknest-backend → **Settings** → **Custom Domains**
2. Add: `api.yourdomain.com`
3. Update DNS theo hướng dẫn

**Frontend (Vercel):**
1. Project Settings → **Domains**
2. Add: `yourdomain.com` hoặc `app.yourdomain.com`
3. Update DNS: CNAME → `cname.vercel-dns.com`

---

### 🔧 TROUBLESHOOTING

**CORS Error:**
```
Access to fetch at 'https://backend...' from origin 'https://frontend...' has been blocked by CORS
```
→ Check `FRONTEND_URL` trong backend env vars
→ Restart backend sau khi update

**Socket.IO không connect:**
```
WebSocket connection failed
```
→ Verify `VITE_SOCKET_URL` không có trailing slash
→ Check browser console để xem error chi tiết

**Database connection failed:**
→ Verify DB credentials từ Render PostgreSQL dashboard
→ Check `DB_HOST` là hostname only, không có `postgres://` prefix

**Cold start quá lâu:**
→ Setup UptimeRobot ping 5 phút/lần
→ Hoặc upgrade Render lên Starter ($7/month) - no sleep

---

### 📊 CHI PHÍ

| Service | Plan | Cost |
|---------|------|------|
| Render Backend | Free (với sleep) | **$0** |
| Render PostgreSQL | Free (90 ngày) | **$0** → $7/tháng |
| Vercel Frontend | Hobby | **$0** |
| UptimeRobot | Free (50 monitors) | **$0** |
| **TOTAL** | | **$0-7/tháng** |

**Timeline:**
- Tháng 1-3: **$0** (hoàn toàn miễn phí)
- Sau 90 ngày: **$7/tháng** (chỉ database)
- Production: **$7-14/tháng** (thêm backend no-sleep nếu cần)

---

## 🌐 Option 3: Vercel (Frontend) + Render (Backend) + Neon (Database)

Tách riêng từng phần để tận dụng free tier tốt nhất.

### A. Deploy Database lên Neon (PostgreSQL Free)

1. Vào https://neon.tech → Sign up
2. Create Project → Name: `worknest`
3. Copy connection string
4. Import schema:
   ```bash
   psql [connection-string] < schema.sql
   psql [connection-string] < database/init.sql
   ```

### B. Deploy Backend lên Render

1. New Web Service → Connect GitHub
2. Build Command: `cd backend && npm install`
3. Start Command: `cd backend && npm start`
4. Add Environment Variables (dùng Neon connection string)

### C. Deploy Frontend lên Vercel

1. Vào https://vercel.com → Import Project
2. Select `frontend` folder
3. Framework: Vite
4. Add Environment Variables:
   ```
   VITE_API_URL=https://worknest-backend.onrender.com/api
   VITE_SOCKET_URL=https://worknest-backend.onrender.com
   ```
5. Deploy

**Ưu điểm:**
- ✅ Frontend trên Vercel cực nhanh
- ✅ Neon PostgreSQL free forever (3GB)
- ✅ Không cold start cho frontend

---

## 💻 Option 4: VPS (DigitalOcean/Linode) - $4-6/month

Nếu muốn full control và performance tốt:

### Setup:

1. Tạo Droplet (Ubuntu 22.04) - $4/month
2. SSH vào server và setup:

```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo apt install docker-compose-plugin

# Clone repo
git clone [your-repo-url]
cd WorkNest

# Copy và config .env
cp .env.example .env
nano .env  # Edit với giá trị production

# Run
docker-compose up -d

# Setup Nginx reverse proxy (optional)
sudo apt install nginx
# Configure nginx để point domain vào localhost:5173
```

3. Trỏ domain về IP của VPS (nếu có)

**Ưu điểm:**
- ✅ Full control
- ✅ No cold start
- ✅ Có thể scale dễ dàng
- ❌ Tốn tiền ($4-6/month)
- ❌ Phải tự maintain

---

## 📋 Checklist Deploy

- [ ] Push code lên GitHub
- [ ] Chọn platform (Railway/Render/Vercel+...)
- [ ] Setup PostgreSQL
- [ ] Deploy Backend với env vars đúng
- [ ] Deploy Frontend với API URLs đúng
- [ ] Test database connection
- [ ] Test authentication (login/register)
- [ ] Test Socket.IO (chat, notifications)
- [ ] Test file uploads
- [ ] Tạo test account mới hoặc dùng seeded accounts
- [ ] Get final URLs và share với recruiter

---

## 🎁 Demo Package cho Recruiter

Tạo file `DEMO.md` với nội dung:

```markdown
# WorkNest - Task Management System Demo

## 🔗 Live Demo
- **App URL:** https://your-app.railway.app
- **API Docs:** https://your-backend.railway.app/api-docs

## 👤 Test Accounts

**Admin Account:**
- Username: `thanh1212`
- Password: `Password123`
- Access: Full system control, user management, task confirmation

**Regular User:**
- Username: `john`
- Password: `password123`
- Access: Personal tasks, chat, calendar

## ✨ Features to Test
1. **Authentication:** Login with Google or local credentials
2. **Task Management:** Create, assign, track tasks
3. **Real-time Chat:** Message between users/admins
4. **Calendar:** Schedule and view events
5. **Notifications:** Real-time updates
6. **File Uploads:** Attach files to tasks
7. **Reports:** Submit and review task reports
8. **Admin Panel:** User management (admin only)

## 🛠️ Tech Stack
- Frontend: React 19 + Vite
- Backend: Node.js + Express
- Database: PostgreSQL 14
- Real-time: Socket.IO
- Deployment: Docker + Railway

## 📂 Source Code
GitHub: [your-repo-url]
```

---

## 💡 Khuyến nghị của tôi

**Cho demo/recruitment:** Railway hoặc Render
- Setup nhanh nhất (< 30 phút)
- Free hoặc rất rẻ
- Domain tự động

**Cho production thật:** VPS hoặc Railway paid tier
- Performance tốt hơn
- No cold start
- Full control

**Cho portfolio/học tập:** Vercel + Render + Neon
- Free forever
- Performance frontend cực tốt
- Easy to maintain

---

## 🆘 Troubleshooting

### Lỗi database connection
- Check `DB_HOST` đúng với internal hostname của platform
- Verify PostgreSQL đã chạy và accept connections
- Check connection string format

### Frontend không connect được Backend
- Kiểm tra CORS settings trong `backend/middleware/security.js`
- Update `FRONTEND_URL` trong backend env
- Check `VITE_API_URL` đúng format (có `/api` cuối)

### Socket.IO không kết nối
- Verify `VITE_SOCKET_URL` đúng
- Check WebSocket support trên hosting platform
- Đảm bảo JWT token được gửi khi connect

### File uploads fail
- Check upload directories có permissions đúng
- Verify platform support file storage (hoặc dùng S3)
- Check file size limits

---

Bạn muốn mình hướng dẫn chi tiết platform nào?
