const asyncHandler = require('express-async-handler');
const Comment = require('../models/Comment');

// @desc    Add a comment to a resource
// @route   POST /api/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res) => {
    const body = req.body || {};
    const text = typeof body.text === 'string' && body.text.trim().length > 0
        ? body.text.trim()
        : typeof body.content === 'string'
            ? body.content.trim()
            : '';
    const commentableTypeRaw = body.commentableType || body.resourceType || body.targetType;
    const commentableIdRaw = body.commentableId || body.resourceId || body.targetId;
    const commentableType = normalizeCommentableType(commentableTypeRaw);
    const commentableId = normalizeCommentableId(commentableIdRaw);

    if (!text || !commentableType || !commentableId) {
        res.status(400);
        throw new Error('Text, commentableType (resourceType), and commentableId (resourceId) are required.');
    }

    const comment = await Comment.query().insert({
        user_id: req.user.id,
        text,
        commentable_type: commentableType,
        commentable_id: commentableId
    });

    res.status(200).json(comment);
});

const normalizeCommentableType = (value) => {
    if (!value) return null;
    const normalized = value.toString().trim().toLowerCase();
    const map = {
        blog: 'Blog',
        blogs: 'Blog',
        article: 'Blog',
        reel: 'Reel',
        reels: 'Reel',
        video: 'Reel',
        membership: 'MembershipInfo',
        'membershipinfo': 'MembershipInfo',
        'membership_info': 'MembershipInfo',
        'membership-info': 'MembershipInfo'
    };
    return map[normalized] || null;
};

const normalizeCommentableId = (value) => {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

// @desc    Get comments for a specific resource
// @route   GET /api/comments/:type/:id
// @access  Public
exports.getCommentsByResource = asyncHandler(async (req, res) => {
    const { type, id } = req.params;

    const comments = await Comment.query()
        .where({ commentable_type: type, commentable_id: id })
        .withGraphFetched('user(selectNameAndEmail)')
        .modifiers({
            selectNameAndEmail(builder) {
                builder.select('name', 'email');
            }
        });
    
    res.json(comments);
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = asyncHandler(async (req, res) => {
    const comment = await Comment.query().findById(req.params.id);

    if (!comment) {
        res.status(404);
        throw new Error('Comment not found.');
    }

    const isOwner = comment.user_id === req.user.id;
    const isAdmin = ['super_admin', 'admin'].includes(req.user.role);

    if (isOwner || isAdmin) {
        await Comment.query().deleteById(req.params.id);
        res.json({ message: 'Comment deleted successfully.' });
    } else {
        res.status(403);
        throw new Error('Not authorized to delete this comment.');
    }
});