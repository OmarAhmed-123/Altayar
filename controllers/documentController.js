// File: controllers/documentController.js
const asyncHandler = require('express-async-handler');
const Document = require('../models/Document');
const fs = require('fs'); // Node.js File System module
const path = require('path');

// @desc    Get all documents for the logged-in user
// @route   GET /api/documents
// @access  Private
exports.getMyDocuments = asyncHandler(async (req, res) => {
    const documents = await Document.query()
        .where('user_id', req.user.id)
        .orderBy('created_at', 'desc');

    res.json(documents);
});

// @desc    Upload a new document for the logged-in user
// @route   POST /api/documents
// @access  Private
exports.uploadDocument = asyncHandler(async (req, res) => {
    const { document_type, expires_at } = req.body;

    if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded.');
    }
    if (!document_type) {
        res.status(400);
        // If file was uploaded but there's an error, delete the file to prevent orphans
        fs.unlinkSync(req.file.path); 
        throw new Error('Document type is required.');
    }

    const document = await Document.query().insert({
        user_id: req.user.id,
        document_type,
        expires_at: expires_at || null,
        file_url: `/${req.file.path.replace(/\\/g, '/')}` // Store the relative path
    });

    res.status(200).json(document);
});

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = asyncHandler(async (req, res) => {
    const document = await Document.query().findById(req.params.id);

    // Security check: Ensure the document exists and belongs to the logged-in user
    if (!document || document.user_id !== req.user.id) {
        res.status(404);
        throw new Error('Document not found or you are not authorized.');
    }

    // Delete the physical file from the server
    const filePath = path.join(__dirname, '..', document.file_url);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    // Delete the record from the database
    await Document.query().deleteById(req.params.id);

    res.json({ message: 'Document removed successfully.' });
});

// @desc    Get all documents (Admin only)
// @route   GET /api/documents/admin
// @access  Private/Admin
exports.getAllDocuments = asyncHandler(async (req, res) => {
    const { userId, documentType, limit = 50, page = 1 } = req.query;

    let query = Document.query()
        .withGraphFetched('user(selectBasicInfo)')
        .modifiers({
            selectBasicInfo(builder) {
                builder.select('id', 'name', 'email');
            }
        })
        .orderBy('created_at', 'desc');

    if (userId) {
        query = query.where('user_id', userId);
    }

    if (documentType) {
        query = query.where('document_type', documentType);
    }

    const documents = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));

    res.json({
        success: true,
        data: documents,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit)
        }
    });
});