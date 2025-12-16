const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const reelsDir = path.join(uploadsDir, 'reels');
const adsDir = path.join(uploadsDir, 'ads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(reelsDir)) {
    fs.mkdirSync(reelsDir, { recursive: true });
}
if (!fs.existsSync(adsDir)) {
    fs.mkdirSync(adsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, reelsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-random-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// File filter with better error handling
// CRITICAL: For reels, only accept videos
const fileFilter = (req, file, cb) => {
    // Log file info for debugging
    console.log('📁 [FILE FILTER]', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        encoding: file.encoding,
        size: file.size,
        isReel: req.body?.isReel === 'true' || req.body?.is_reel === 'true' || req.body?.category === 'reels'
    });
    
    // CRITICAL: Check if this is a reel upload
    const isReel = req.body?.isReel === 'true' || req.body?.is_reel === 'true' || req.body?.category === 'reels';
    
    if (isReel) {
        // CRITICAL: Reels only accept videos
        const allowedVideoMimes = [
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo',
            'video/webm',
            'video/mov',
            'video/3gpp', // 3GP format
            'video/x-matroska', // MKV format
            'video/x-ms-wmv', // WMV format
            'application/octet-stream', // Fallback for some mobile apps (will be validated by extension)
            'application/x-mpegURL', // HLS format
            'video/x-flv' // FLV format
        ];
        
        // Also check file extension for application/octet-stream and other cases
        const fileExt = path.extname(file.originalname).toLowerCase().replace('.', '');
        const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', '3gp', 'm4v', 'wmv', 'flv', 'm3u8'];
        
        // CRITICAL FIX: Better validation - check both mimetype and extension
        const isValidVideoMime = allowedVideoMimes.includes(file.mimetype);
        const isValidVideoExt = videoExtensions.includes(fileExt);
        
        if (isValidVideoMime || isValidVideoExt) {
            console.log('✅ [FILE ACCEPTED] Video file:', {
                mimetype: file.mimetype,
                originalname: file.originalname,
                extension: fileExt
            });
            cb(null, true);
        } else {
            console.warn('⚠️ [FILE REJECTED] Reel must be a video:', {
                mimetype: file.mimetype,
                originalname: file.originalname,
                extension: fileExt,
                allowedMimes: allowedVideoMimes,
                allowedExtensions: videoExtensions
            });
            cb(new Error(`الريلز تقبل فيديوهات فقط. يرجى رفع فيديو`), false);
        }
    } else {
        // For regular blogs, allow both images and videos
        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo',
            'video/webm',
            'video/mov',
            'application/octet-stream'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.warn('⚠️ [FILE REJECTED]', {
                mimetype: file.mimetype,
                originalname: file.originalname,
                allowedMimes
            });
            cb(new Error(`Invalid file type: ${file.mimetype}. Only images and videos are allowed.`), false);
        }
    }
};

// Configure multer with enhanced settings
// CRITICAL: Increased limits for large file uploads and multiple files
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size per file
        files: 10, // CRITICAL: Allow up to 10 files for multiple images in one reel
        fields: 100, // Allow up to 100 form fields (increased from 50)
        fieldNameSize: 200, // Max field name size (increased from 100)
        fieldSize: 10 * 1024 * 1024, // 10MB max field size
        headerPairs: 2000, // Max header pairs
        parts: 100 // Max number of parts (increased for large files)
    },
    // Preserve file extension
    preservePath: false
});

// CRITICAL: Single/Multiple file upload middleware - supports both single and multiple files
// Uses array() which accepts 1-10 files, making it backward compatible
exports.uploadReel = (req, res, next) => {
    // CRITICAL: Log request details BEFORE processing
    console.log('📤 [UPLOAD REEL] Request received:', {
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        hasFile: !!req.file,
        hasFiles: !!(req.files && req.files.length > 0),
        bodyKeys: Object.keys(req.body || {}),
        user: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
    });
    
    // CRITICAL FIX: Set timeout for file upload processing
    req.setTimeout(300000); // 300 seconds (5 minutes) for multiple large file uploads
    res.setTimeout(300000); // 300 seconds
    
    // CRITICAL: Handle connection errors
    req.on('error', (err) => {
        console.error('❌ [UPLOAD REEL] Request error:', {
            error: err.message,
            code: err.code,
            timestamp: new Date().toISOString()
        });
    });
    
    res.on('error', (err) => {
        console.error('❌ [UPLOAD REEL] Response error:', {
            error: err.message,
            code: err.code,
            timestamp: new Date().toISOString()
        });
    });
    
    // CRITICAL: Handle timeout
    req.on('timeout', () => {
        console.error('⏱️ [UPLOAD REEL] Request timeout');
        if (!res.headersSent) {
            res.status(408).json({
                success: false,
                message: 'Request timeout. File upload took too long.'
            });
        }
    });
    
    // CRITICAL: Use array() to support both single and multiple files
    // This accepts 1-10 files with field name 'media', making it backward compatible
    const uploadFiles = upload.array('media', 10);
    
    uploadFiles(req, res, (err) => {
        if (err) {
            // Enhanced error logging
            console.error('❌ [MULTER ERROR]', {
                code: err.code,
                message: err.message,
                field: err.field,
                name: err.name,
                stack: err.stack?.substring(0, 500),
                contentType: req.headers['content-type'],
                hasBody: !!req.body,
                bodyKeys: Object.keys(req.body || {}),
                timestamp: new Date().toISOString()
            });
            
            // Handle specific multer errors
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Maximum size is 100MB.'
                    });
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({
                        success: false,
                        message: 'Unexpected file field. Use "media" as the field name.'
                    });
                }
                if (err.code === 'LIMIT_PART_COUNT') {
                    return res.status(400).json({
                        success: false,
                        message: 'Too many parts in the request.'
                    });
                }
                if (err.code === 'LIMIT_FIELD_COUNT') {
                    return res.status(400).json({
                        success: false,
                        message: 'Too many fields in the request.'
                    });
                }
                if (err.code === 'LIMIT_FIELD_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'Field size too large.'
                    });
                }
            }
            
            // Network errors
            if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
                return res.status(408).json({
                    success: false,
                    message: 'Connection timeout. Please try again with a smaller file or check your network connection.',
                    code: err.code
                });
            }
            
            // Pass other errors to next middleware
            if (!res.headersSent) {
                return next(err);
            }
            return;
        }
        
        // Log successful file processing
        if (req.files && req.files.length > 0) {
            console.log('✅ [FILES PROCESSED]', {
                fileCount: req.files.length,
                files: req.files.map((file) => ({
                    filename: file.filename,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                })),
                timestamp: new Date().toISOString()
            });
            
            // CRITICAL: For backward compatibility, set req.file to first file
            // This allows existing code that checks req.file to still work
            req.file = req.files[0];
        } else if (req.file) {
            // Single file (backward compatibility)
            console.log('✅ [FILE PROCESSED]', {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
                destination: req.file.destination,
                fieldname: req.file.fieldname,
                path: req.file.path,
                timestamp: new Date().toISOString()
            });
        } else {
            // Allow request to continue if no file (might be using mediaUrl instead)
            console.warn('⚠️ [UPLOAD REEL] No file received (may use mediaUrl):', {
                contentType: req.headers['content-type'],
                bodyKeys: Object.keys(req.body || {}),
                hasBody: !!req.body,
                hasMediaUrl: !!req.body?.mediaUrl
            });
        }
        
        next();
    });
};

// CRITICAL: Multiple files upload middleware for multiple images in one reel
exports.uploadMultipleReels = (req, res, next) => {
    // CRITICAL: Log request details BEFORE processing
    console.log('📤 [UPLOAD MULTIPLE REELS] Request received:', {
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        bodyKeys: Object.keys(req.body || {}),
        user: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
    });
    
    // CRITICAL FIX: Set timeout for file upload processing
    req.setTimeout(300000); // 300 seconds (5 minutes) for multiple large file uploads
    res.setTimeout(300000); // 300 seconds
    
    // CRITICAL: Handle connection errors
    req.on('error', (err) => {
        console.error('❌ [UPLOAD MULTIPLE REELS] Request error:', {
            error: err.message,
            code: err.code,
            timestamp: new Date().toISOString()
        });
    });
    
    res.on('error', (err) => {
        console.error('❌ [UPLOAD MULTIPLE REELS] Response error:', {
            error: err.message,
            code: err.code,
            timestamp: new Date().toISOString()
        });
    });
    
    // CRITICAL: Handle timeout
    req.on('timeout', () => {
        console.error('⏱️ [UPLOAD MULTIPLE REELS] Request timeout');
        if (!res.headersSent) {
            res.status(408).json({
                success: false,
                message: 'Request timeout. File upload took too long.'
            });
        }
    });
    
    // CRITICAL: Use array() to accept multiple files with field name 'media'
    const uploadMultiple = upload.array('media', 10); // Max 10 files
    
    uploadMultiple(req, res, (err) => {
        if (err) {
            // Enhanced error logging
            console.error('❌ [MULTER ERROR - MULTIPLE]', {
                code: err.code,
                message: err.message,
                field: err.field,
                name: err.name,
                stack: err.stack?.substring(0, 500),
                contentType: req.headers['content-type'],
                hasBody: !!req.body,
                bodyKeys: Object.keys(req.body || {}),
                timestamp: new Date().toISOString()
            });
            
            // Handle specific multer errors
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Maximum size is 100MB per file.'
                    });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        success: false,
                        message: 'Too many files. Maximum is 10 files per reel.'
                    });
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({
                        success: false,
                        message: 'Unexpected file field. Use "media" as the field name.'
                    });
                }
                if (err.code === 'LIMIT_PART_COUNT') {
                    return res.status(400).json({
                        success: false,
                        message: 'Too many parts in the request.'
                    });
                }
                if (err.code === 'LIMIT_FIELD_COUNT') {
                    return res.status(400).json({
                        success: false,
                        message: 'Too many fields in the request.'
                    });
                }
                if (err.code === 'LIMIT_FIELD_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'Field size too large.'
                    });
                }
            }
            
            // Network errors
            if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
                return res.status(408).json({
                    success: false,
                    message: 'Connection timeout. Please try again with smaller files or check your network connection.',
                    code: err.code
                });
            }
            
            // Pass other errors to next middleware
            if (!res.headersSent) {
                return next(err);
            }
            return;
        }
        
        // Log successful file processing
        if (req.files && req.files.length > 0) {
            console.log('✅ [MULTIPLE FILES PROCESSED]', {
                fileCount: req.files.length,
                files: req.files.map((file) => ({
                    filename: file.filename,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                })),
                timestamp: new Date().toISOString()
            });
        } else {
            // Allow request to continue if no files (might be using mediaUrl instead)
            console.warn('⚠️ [UPLOAD MULTIPLE REELS] No files received (may use mediaUrl):', {
                contentType: req.headers['content-type'],
                bodyKeys: Object.keys(req.body || {}),
                hasBody: !!req.body,
                hasMediaUrl: !!req.body?.mediaUrl
            });
        }
        
        next();
    });
};

// ===== Ad images upload (images only) =====
const adStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, adsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

const adImageFilter = (req, file, cb) => {
    // CRITICAL FIX: Better file validation
    if (!file) {
        return cb(new Error('ملف الصورة غير صالح.'), false);
    }
    
    // Check mimetype first
    if (file.mimetype && file.mimetype.startsWith('image/')) {
        return cb(null, true);
    }
    
    // Fallback: Check file extension if mimetype is missing or incorrect
    const fileExt = path.extname(file.originalname).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    
    if (imageExtensions.includes(fileExt)) {
        return cb(null, true);
    }
    
    // If no file is provided, allow the request to continue (image might be optional or provided via URL)
    if (!file.originalname && !file.mimetype) {
        return cb(null, true);
    }
    
    console.warn('⚠️ [AD IMAGE FILTER] File rejected:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        extension: fileExt
    });
    
    cb(new Error('يسمح برفع الصور فقط في الإعلانات.'), false);
};

const adUpload = multer({
    storage: adStorage,
    fileFilter: adImageFilter,
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB
        files: 1,
    },
});

exports.uploadAdImage = (req, res, next) => {
    const handler = adUpload.single('image');
    handler(req, res, (err) => {
        if (err) {
            console.error('❌ [UPLOAD AD IMAGE]', err.message);
            if (!res.headersSent) {
                return res.status(400).json({
                    success: false,
                    message: err.message || 'فشل رفع صورة الإعلان.',
                });
            }
            return;
        }
        next();
    });
};

// Get file URL helper - ensures proper URL generation for all users
exports.getFileUrl = (req, filename) => {
    // Get the correct protocol and host
    const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'http';
    let host = req.get('host');
    
    // If no host header, try to construct from request
    if (!host) {
        const os = require('os');
        const networkInterfaces = os.networkInterfaces();
        let serverIP = 'localhost';
        
        // Find first non-internal IPv4 address
        Object.keys(networkInterfaces).forEach((interfaceName) => {
            networkInterfaces[interfaceName].forEach((iface) => {
                if (iface.family === 'IPv4' && !iface.internal) {
                    // Prefer 192.168.x.x addresses for local network
                    if (iface.address.startsWith('192.168.') || serverIP === 'localhost') {
                        serverIP = iface.address;
                    }
                }
            });
        });
        
        host = `${serverIP}:${process.env.PORT || 5000}`;
    }
    
    return `${protocol}://${host}/uploads/reels/${filename}`;
};

