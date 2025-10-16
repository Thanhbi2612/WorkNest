const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads/reports nếu chưa tồn tại
const uploadDir = path.join(__dirname, '..', 'uploads', 'reports');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Tạo tên file unique: timestamp-userId-originalname
        const uniqueSuffix = Date.now() + '-' + req.user.id;
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        // Loại bỏ ký tự đặc biệt khỏi tên file
        const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${safeName}-${uniqueSuffix}${ext}`);
    }
});

// File filter - chỉ cho phép các loại file nhất định
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed'
    ];

    const allowedExtensions = [
        '.pdf', '.doc', '.docx',
        '.xls', '.xlsx',
        '.ppt', '.pptx',
        '.jpg', '.jpeg', '.png',
        '.txt', '.zip', '.rar'
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }
};

// Cấu hình multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
    }
});

// Middleware xử lý lỗi upload
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File quá lớn. Kích thước tối đa là 10MB',
                error_code: 'FILE_TOO_LARGE'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message,
            error_code: 'UPLOAD_ERROR'
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
            error_code: 'INVALID_FILE'
        });
    }

    next();
};

module.exports = {
    uploadReport: upload.single('report_file'),
    handleUploadError
};
