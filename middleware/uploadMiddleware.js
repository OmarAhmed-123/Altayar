const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const uploadDirs = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../uploads/profiles'),
    path.join(__dirname, '../uploads/documents'),
    path.join(__dirname, '../uploads/images'),
    path.join(__dirname, '../uploads/vouchers'),
    path.join(__dirname, '../uploads/memberships'),
    path.join(__dirname, '../uploads/reels')
  ];

  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Call the function to ensure directories exist
ensureUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = path.join(__dirname, '../uploads');
    
    // Determine upload path based on file type or field name
    if (file.fieldname === 'profilePicture' || file.fieldname === 'profile_picture') {
      uploadPath = path.join(__dirname, '../uploads/profiles');
    } else if (file.fieldname === 'document') {
      uploadPath = path.join(__dirname, '../uploads/documents');
    } else if (file.fieldname === 'image' || file.fieldname === 'images') {
      // Check if it's a membership image
      if (req.route && req.route.path && req.route.path.includes('membership')) {
        uploadPath = path.join(__dirname, '../uploads/memberships');
      } else {
        uploadPath = path.join(__dirname, '../uploads/images');
      }
    } else if (file.fieldname === 'voucher') {
      uploadPath = path.join(__dirname, '../uploads/vouchers');
    } else if (file.fieldname === 'membershipImage' || file.fieldname === 'membership_image') {
      uploadPath = path.join(__dirname, '../uploads/memberships');
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt'
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      });
    }
    if (error.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many parts in the request.'
      });
    }
  }
  
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Invalid file type. Only images, PDFs, and documents are allowed.'
    });
  }
  
  if (error.message && error.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  // Log unexpected errors
  console.error('Upload error:', error);
  
  next(error);
};

module.exports = {
  upload,
  handleUploadError
};
