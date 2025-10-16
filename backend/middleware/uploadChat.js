const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads/chat tồn tại
const uploadDir = 'uploads/chat';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình storage cho multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Thư mục lưu file
    },
    filename: (req, file, cb) => {
        // Tạo tên file unique: timestamp-userId-randomString-originalname
        const userId = req.user?.id || 'unknown';
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_'); // Remove special chars
        const uniqueName = `${timestamp}-${userId}-${randomString}-${safeName}${ext}`;
        cb(null, uniqueName);
    }
});

// Lọc file - cho phép images, documents, PDFs
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        // Documents
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'text/plain', // .txt
        'application/zip',
        'application/x-rar-compressed'
    ];

    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetypeValid = allowedMimeTypes.includes(file.mimetype);

    if (extname && mimetypeValid) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép upload: Images (JPG, PNG, GIF, WebP), Documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT), Archives (ZIP, RAR)'), false);
    }
};

// Cấu hình multer
const uploadChat = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Giới hạn kích thước file: 10MB
    },
    fileFilter: fileFilter
});

module.exports = uploadChat;
