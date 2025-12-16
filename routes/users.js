// File: routes/users.js
const express = require('express');
const router = express.Router();
const { 
    getUsers,
    getUserById,
    updateUserRole, 
    addManualGift, 
    deleteUser, 
    getProfile, 
    updateProfile,
    banUser
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profiles/');
    },
    filename: function (req, file, cb) {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// Simple role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        if (req.user.is_super_admin) {
            return next();
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden - insufficient permissions' });
        }
        next();
    };
};

// --- Profile Routes (for the logged-in user) ---
// Matches GET & PUT /api/users/profile
router.route('/profile')
    .get(protect, getProfile)
    .put(protect, upload.single('profilePicture'), updateProfile);

// --- Admin Management Routes ---

// Matches GET /api/users
router.route('/')
    .get(protect, authorize('super_admin', 'admin', 'hr', 'agent', 'sales'), getUsers);

// Matches GET, PUT & DELETE /api/users/:id
router.route('/:id')
    .get(protect, authorize('super_admin', 'admin', 'hr', 'agent', 'sales', 'accountant', 'data_entry', 'reservations'), getUserById)
    .put(protect, authorize('super_admin', 'admin', 'agent'), updateUserRole)
    .delete(protect, authorize('super_admin'), deleteUser);

// Matches PUT /api/users/:id/ban
// Ban/Unban a user
router.route('/:id/ban')
    .put(protect, authorize('super_admin', 'admin'), banUser);

// Matches POST /api/users/gift/:id
// Agent can add manual gifts (points, cashback, vouchers) to customers
router.route('/gift/:id')
    .post(protect, authorize('super_admin', 'admin', 'sales', 'agent'), addManualGift);

module.exports = router;