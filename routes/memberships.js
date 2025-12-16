// File: routes/memberships.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const {
  getMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
  viewMembershipPDF,
  downloadMembershipPDF,
  getDownloadStats,
  getMembershipCard,
  subscribeToMembership,
  getMembershipBookings
} = require('../controllers/membershipController');
const { getUserAnalytics } = require('../controllers/membershipAnalyticsController');
const { protect, authorize } = require('../middleware/auth');
const { membershipCardLimiter } = require('../middleware/rateLimiter');

// Ensure uploads/memberships directory exists
const uploadsDir = path.join(__dirname, '../uploads/memberships');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer for membership image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `membership_${uniqueSuffix}${ext}`);
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

// Public routes
router.get('/', getMemberships);
router.get('/analytics', protect, getUserAnalytics); // Smart analytics for membership page
router.get('/card/my', protect, membershipCardLimiter, getMembershipCard);
router.get('/stats/downloads', protect, authorize('super_admin', 'admin'), getDownloadStats);

// CRITICAL: Membership PDF routes MUST come before /:id route to avoid route conflicts
// Handle OPTIONS requests for PDF routes (CORS preflight)
router.options('/:id/pdf/view', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, Accept-Ranges');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length, Content-Range, Accept-Ranges');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(204);
});

router.options('/:id/pdf/download', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, Accept-Ranges');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length, Content-Range, Accept-Ranges');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(204);
});

// Membership PDF routes (Public - users can view/download membership PDFs)
router.get('/:id/pdf/view', viewMembershipPDF); // View PDF inline (for reading)
router.get('/:id/pdf/download', downloadMembershipPDF); // Download PDF as attachment
router.get('/:id/download', downloadMembershipPDF); // Legacy route for backward compatibility

// Get membership by ID (must come after PDF routes)
router.get('/:id', getMembershipById);
router.post('/subscribe', protect, subscribeToMembership);

// Error handling middleware for file uploads
const handleUploadError = (err, req, res, next) => {
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
};

// Admin/Agent routes
// Agent can view memberships but only admin can create/update/delete
router.post('/', protect, authorize('super_admin', 'admin'), upload.single('image'), handleUploadError, createMembership);
router.put('/:id', protect, authorize('super_admin', 'admin'), upload.single('image'), handleUploadError, updateMembership);
router.delete('/:id', protect, authorize('super_admin', 'admin'), deleteMembership);
router.get('/:id/bookings', protect, authorize('super_admin', 'admin', 'accountant'), getMembershipBookings);

module.exports = router;