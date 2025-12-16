// File: routes/chat.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const {
    accessChat,
    fetchChats,
    sendMessage,
    allMessages,
    startBotChat,
    getBotInfo
} = require('../controllers/chatController');

const router = express.Router();

// Ensure uploads/chat directory exists
const chatUploadsDir = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(chatUploadsDir)) {
    fs.mkdirSync(chatUploadsDir, { recursive: true });
}

// Configure Multer for chat file uploads (images, files, etc.)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, chatUploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '';
        cb(null, `chat_${uniqueSuffix}${ext}`);
    }
});

// Professional and secure file filter with MIME type and extension validation
const fileFilter = (req, file, cb) => {
    // Log file info for debugging
    console.log('📁 [CHAT FILE FILTER]', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        encoding: file.encoding,
        size: file.size
    });

    // Define allowed MIME types
    const allowedMimes = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
        // Videos
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-flv',
        'video/webm', 'video/x-matroska', 'video/3gpp', 'video/mpeg',
        // Documents
        'application/pdf', 
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'text/plain', 'text/csv', 'application/rtf',
        'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet',
        // Archives
        'application/zip', 'application/x-zip-compressed', // ZIP files
        'application/x-rar-compressed', 'application/vnd.rar', // RAR files
        'application/x-7z-compressed', 'application/x-tar', 'application/gzip',
        // Audio
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac',
        // Generic binary (will validate by extension)
        'application/octet-stream'
    ];

    // Define allowed file extensions (for fallback validation)
    const allowedExtensions = [
        // Images
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
        // Videos
        '.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv', '.3gp', '.mpeg', '.mpg',
        // Documents
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        // Text files
        '.txt', '.csv', '.rtf', '.odt', '.ods',
        // Archives
        '.zip', '.rar', '.7z', '.tar', '.gz',
        // Audio
        '.mp3', '.wav', '.ogg', '.m4a', '.aac'
    ];

    // Get file extension
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    // Primary validation: Check MIME type
    const isValidMime = allowedMimes.includes(file.mimetype);
    
    // Secondary validation: Check file extension (especially for application/octet-stream)
    const isValidExt = allowedExtensions.includes(fileExt);
    
    // Security: For application/octet-stream, we MUST validate by extension
    // This is common with mobile apps (Dart/Flutter) that send generic binary MIME types
    if (file.mimetype === 'application/octet-stream') {
        if (isValidExt) {
            console.log('✅ [CHAT FILE ACCEPTED] application/octet-stream validated by extension:', {
                mimetype: file.mimetype,
                originalname: file.originalname,
                extension: fileExt
            });
            cb(null, true);
        } else {
            console.warn('⚠️ [CHAT FILE REJECTED] Invalid extension for application/octet-stream:', {
                mimetype: file.mimetype,
                originalname: file.originalname,
                extension: fileExt,
                allowedExtensions: allowedExtensions
            });
            cb(new Error(`نوع الملف غير مدعوم: ${fileExt || 'غير معروف'}. يُسمح بالصور والوثائق فقط.`), false);
        }
    } 
    // For other MIME types, check both MIME type and extension for security
    else if (isValidMime) {
        // Additional security: Verify extension matches MIME type category
        if (isValidExt) {
            console.log('✅ [CHAT FILE ACCEPTED] Valid MIME type and extension:', {
                mimetype: file.mimetype,
                originalname: file.originalname,
                extension: fileExt
            });
            cb(null, true);
        } else {
            // MIME type is valid but extension doesn't match - suspicious but allow if MIME is trusted
            console.warn('⚠️ [CHAT FILE WARNING] Valid MIME but extension mismatch:', {
                mimetype: file.mimetype,
                originalname: file.originalname,
                extension: fileExt
            });
            // Still allow it since MIME type is in our trusted list
            cb(null, true);
        }
    } 
    // MIME type not in allowed list
    else {
        // Last resort: Check if extension is valid (for edge cases)
        if (isValidExt) {
            console.warn('⚠️ [CHAT FILE WARNING] Unknown MIME type but valid extension:', {
                mimetype: file.mimetype,
                originalname: file.originalname,
                extension: fileExt
            });
            // Allow it since extension is valid
            cb(null, true);
        } else {
            console.warn('❌ [CHAT FILE REJECTED] Invalid MIME type and extension:', {
                mimetype: file.mimetype,
                originalname: file.originalname,
                extension: fileExt,
                allowedMimes: allowedMimes.slice(0, 5), // Show first 5 for logging
                allowedExtensions: allowedExtensions.slice(0, 5)
            });
            cb(new Error(`نوع الملف غير مدعوم: ${file.mimetype || 'غير معروف'}. يُسمح بالصور والوثائق فقط.`), false);
        }
    }
};

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 1, // Single file per message
        fields: 50, // Max form fields
        fieldNameSize: 100,
        fieldSize: 10 * 1024 * 1024,
        headerPairs: 2000,
        parts: 100
    },
    fileFilter: fileFilter
});

// Route to either create a new chat or access an existing one
// Also used to fetch all chats for the logged-in user
router.route('/')
    .post(protect, accessChat)
    .get(protect, fetchChats);

// Route to start chat directly with the bot
router.route('/bot')
    .post(protect, startBotChat);

// Route to fetch bot info (ensures bot user exists)
router.route('/bot/info')
    .get(protect, getBotInfo);

// Route to get all users for chat (with online status)
router.route('/users')
    .get(protect, require('../controllers/chatController').getAllUsersForChat);

// Professional error handling wrapper for file uploads
const handleFileUpload = (req, res, next) => {
    // Set timeout for file upload processing
    req.setTimeout(300000); // 5 minutes for large files
    res.setTimeout(300000);
    
    // Handle connection errors
    req.on('error', (err) => {
        console.error('❌ [CHAT UPLOAD] Request error:', {
            error: err.message,
            code: err.code,
            timestamp: new Date().toISOString()
        });
    });
    
    res.on('error', (err) => {
        console.error('❌ [CHAT UPLOAD] Response error:', {
            error: err.message,
            code: err.code,
            timestamp: new Date().toISOString()
        });
    });
    
    // Handle timeout
    req.on('timeout', () => {
        console.error('⏱️ [CHAT UPLOAD] Request timeout');
        if (!res.headersSent) {
            res.status(408).json({
                success: false,
                message: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.'
            });
        }
    });
    
    // Use multer upload middleware
    const uploadMiddleware = upload.single('file');
    
    uploadMiddleware(req, res, (err) => {
        if (err) {
            console.error('❌ [CHAT UPLOAD ERROR]', {
                code: err.code,
                message: err.message,
                field: err.field,
                name: err.name,
                stack: err.stack?.substring(0, 500),
                contentType: req.headers['content-type'],
                timestamp: new Date().toISOString()
            });
            
            // Handle specific multer errors
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'الملف كبير جداً. الحد الأقصى للحجم هو 10 ميجابايت.'
                    });
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({
                        success: false,
                        message: 'اسم الحقل غير متوقع. استخدم "file" كاسم للحقل.'
                    });
                }
                if (err.code === 'LIMIT_PART_COUNT') {
                    return res.status(400).json({
                        success: false,
                        message: 'عدد الأجزاء في الطلب كبير جداً.'
                    });
                }
                if (err.code === 'LIMIT_FIELD_COUNT') {
                    return res.status(400).json({
                        success: false,
                        message: 'عدد الحقول في الطلب كبير جداً.'
                    });
                }
                if (err.code === 'LIMIT_FIELD_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'حجم الحقل كبير جداً.'
                    });
                }
            }
            
            // Network errors
            if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
                return res.status(408).json({
                    success: false,
                    message: 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى بملف أصغر أو التحقق من اتصال الشبكة.',
                    code: err.code
                });
            }
            
            // File type validation errors
            if (err.message && (err.message.includes('نوع الملف') || err.message.includes('Invalid file type'))) {
                return res.status(400).json({
                    success: false,
                    message: err.message || 'نوع الملف غير مدعوم. يُسمح بالصور والوثائق فقط.'
                });
            }
            
            // Pass other errors to next middleware
            if (!res.headersSent) {
                return next(err);
            }
            return;
        }
        
        // Log successful file processing
        if (req.file) {
            console.log('✅ [CHAT FILE UPLOADED]', {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
                destination: req.file.destination,
                path: req.file.path,
                timestamp: new Date().toISOString()
            });
        }
        
        next();
    });
};

// Route for sending a message to a specific chat (with optional file upload)
router.route('/message').post(protect, handleFileUpload, sendMessage);

// Route for fetching all messages within a specific chat
router.route('/:chatId/messages').get(protect, allMessages);

// Backward compatibility route: /chat/message/:chatId
router.route('/message/:chatId').get(protect, allMessages);

// Route for marking messages as read
router.route('/message/:chatId/read').post(protect, require('../controllers/chatController').markMessagesAsRead);

// Route for deleting a message
router.route('/message/:messageId').delete(protect, require('../controllers/chatController').deleteMessage);

// Route for Gemini AI bot response
router.route('/gemini/bot').post(protect, require('../controllers/geminiBotController').sendGeminiBotResponse);

// Route for legacy bot response (backward compatibility)
router.route('/bot').post(protect, require('../controllers/chatBotController').sendBotResponse);

module.exports = router;