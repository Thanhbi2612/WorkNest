const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads/tasks tồn tại
const uploadDir = 'uploads/tasks';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình storage cho multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Thư mục lưu file
    },
    filename: (req, file, cb) => {
        // Đổi tên file: timestamp-originalname để tránh trùng lặp
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

// Lọc file (chỉ cho phép một số loại file nhất định)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'text/plain' // .txt
    ];

    const allowedExtensions = /\.(jpg|jpeg|png|pdf|doc|docx|xls|xlsx|txt)$/i;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetypeValid = allowedMimeTypes.includes(file.mimetype);

    if (extname && mimetypeValid) {
        cb(null, true);
    } else {
        console.log('❌ File rejected - Extension:', path.extname(file.originalname), 'MIME:', file.mimetype);
        cb(new Error('Chỉ cho phép upload file: JPG, PNG, PDF, DOC, DOCX, XLS, XLSX, TXT'), false);
    }
};

// Cấu hình multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // Giới hạn kích thước file: 20MB
    },
    fileFilter: fileFilter
});

module.exports = upload;
