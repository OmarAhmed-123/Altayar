const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getProfile, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads/profiles directory exists
const uploadsDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer for file storage (disk storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp.extension
    const userId = req.user?.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `profile_${userId}_${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// @route GET /api/profile - Get profile data
router.route('/').get(protect, getProfile);

// @route PUT /api/profile - Update profile data and photo
// 'single('profilePicture')' expects the file field name in the form data to be 'profilePicture'
router.route('/')
    .put(protect, upload.single('profilePicture'), (err, req, res, next) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File too large. Maximum size is 5MB.'
            });
          }
        }
        if (err.message && err.message.includes('Only image files')) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error'
        });
      }
      next();
    }, updateProfile); 

module.exports = router;
