const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads dir exists
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure upload with validation
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file extension
        const allowedTypes = ['.json'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (!allowedTypes.includes(ext)) {
            return cb(new Error('只支持 JSON 格式文件'), false);
        }

        // Check MIME type
        const allowedMimes = ['application/json'];
        if (!allowedMimes.includes(file.mimetype)) {
            return cb(new Error('文件类型不正确'), false);
        }

        cb(null, true);
    }
});

module.exports = upload;
