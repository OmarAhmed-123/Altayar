const express = require('express');
const { 
    addComment, 
    getCommentsByResource,
    deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Private: Add comment
router.route('/').post(protect, addComment);

// Public: Get comments (e.g., /api/comments/Blog/123)
router.route('/:type/:id').get(getCommentsByResource);

// Private: Delete comment
router.route('/:id')
    .delete(protect, deleteComment);

module.exports = router;
