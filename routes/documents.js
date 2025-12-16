// File: routes/documents.js
const express = require('express');
const router = express.Router();
const { getMyDocuments, uploadDocument, deleteDocument, getAllDocuments } = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getMyDocuments)
    .post(protect, upload.single('document'), uploadDocument);

router.get('/admin', protect, authorize('super_admin', 'admin'), getAllDocuments);

router.route('/:id')
    .delete(protect, deleteDocument);

module.exports = router;