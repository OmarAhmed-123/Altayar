const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get all notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.query()
        .where('user_id', req.user.id)
        .orderBy('created_at', 'desc')
        .limit(50);
    res.json(notifications);
});

// @desc    Get the count of unread notifications
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.query()
        .where({ user_id: req.user.id, is_read: false })
        .resultSize();
    res.json({ unreadCount: count });
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.query().findOne({ id: req.params.id, user_id: req.user.id });

    if (notification) {
        if (notification.is_read) {
            return res.json({ message: 'Notification was already read.' });
        }
        const updated = await notification.$query().patchAndFetch({ is_read: true });
        res.json({ message: 'Notification marked as read', notification: updated });
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
});

// @desc    Create a new notification (Used by internal staff/system)
// @route   POST /api/notifications
// @access  Private/Admin
exports.createNotification = asyncHandler(async (req, res) => {
    const { userId, title, message, type, referenceId } = req.body;

    if (!userId || !title || !message || !type) {
        res.status(400);
        throw new Error('Missing required fields: userId, title, message, type.');
    }

    const recipient = await User.query().findById(userId);
    if (!recipient) {
        res.status(404);
        throw new Error('Recipient user not found');
    }

    const notification = await Notification.query().insert({
        user_id: userId,
        sender_id: req.user.id,
        title,
        message,
        type,
        reference_id: referenceId,
    });
    
    // In a real app, you would emit this notification via WebSockets
    // req.io.to(userId).emit('new_notification', notification);

    res.status(200).json(notification);
});