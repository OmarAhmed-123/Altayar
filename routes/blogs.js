const express = require('express');
const { 
    getBlogs, 
    getBlogById, 
    likeBlog,
    saveBlog,
    shareBlog,
    getShareLink,
    favoriteBlog,
    getSavedBlogs,
    createBlog,
    updateBlog,
    deleteBlog
} = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/auth');
const { uploadReel, uploadMultipleReels } = require('../middleware/upload');

const router = express.Router();

// Public: Get all blogs/reels
router.route('/').get(getBlogs);

// Private: Get saved blogs/reels
router.route('/saved').get(protect, getSavedBlogs);

// Private: Like/Unlike blog (specific route - must come before /:id)
router.route('/like/:id').post(protect, likeBlog);

// Private: Save/Unsave blog (specific route - must come before /:id)
router.route('/save/:id').post(protect, saveBlog);

// Private: Share blog (specific route - must come before /:id)
router.route('/share/:id').post(protect, shareBlog);

// CRITICAL: Specific routes MUST come before generic /:id route
// Express matches routes in order, so more specific routes must be defined first

// Public: Get share link for a blog/reel (specific route - must come before /:id)
router.get('/:id/share-link', (req, res, next) => {
    console.log('🔵 [SHARE-LINK] Route matched:', {
        id: req.params.id,
        path: req.path,
        originalUrl: req.originalUrl
    });
    next();
}, getShareLink);

// Private: Favorite/Unfavorite blog (specific route - must come before /:id)
router.post('/:id/favorite', (req, res, next) => {
    console.log('🔵 [FAVORITE] Route matched:', {
        id: req.params.id,
        path: req.path,
        originalUrl: req.originalUrl,
        method: req.method
    });
    next();
}, protect, favoriteBlog);

// Admin: Update blog/reel (with file upload support)
router.route('/:id')
    .put(
        protect,
        authorize('super_admin', 'admin', 'data_entry'),
        uploadReel,
        updateBlog
    )
    .delete(
        protect,
        authorize('super_admin', 'admin', 'data_entry'),
        deleteBlog
    );

// Public: Get single blog/reel with comments (generic route - MUST come last)
// This route will match any /:id that doesn't match the specific routes above
router.get('/:id', getBlogById);

// Admin: Create blog/reel (with file upload support)
// CRITICAL: This route must handle file uploads properly
router.route('/')
    .post(
        // CRITICAL FIX: Log BEFORE protect middleware to see if request reaches route
        (req, res, next) => {
            console.log('🟢 [BLOG ROUTE] POST /blogs route handler called:', {
                method: req.method,
                path: req.path,
                originalUrl: req.originalUrl,
                contentType: req.headers['content-type'],
                contentLength: req.headers['content-length'],
                authorization: req.headers['authorization'] ? 'Present' : 'Missing',
                ip: req.ip || req.connection.remoteAddress,
                timestamp: new Date().toISOString()
            });
            
            // CRITICAL: Set timeout for file uploads BEFORE processing
            if (req.headers['content-type']?.includes('multipart/form-data')) {
                req.setTimeout(180000); // 3 minutes
                res.setTimeout(180000); // 3 minutes
                console.log('⏱️ [BLOG ROUTE] Timeout set to 180s for file upload');
            }
            
            next();
        },
        protect, 
        authorize('super_admin', 'admin', 'data_entry'),
        // CRITICAL: Use uploadReel which now supports both single and multiple files
        uploadReel,
        createBlog
    );

module.exports = router;
