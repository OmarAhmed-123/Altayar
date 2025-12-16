// File: controllers/userController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Voucher = require('../models/Voucher');
const Transaction = require('../models/Transaction');
const { transaction } = require('objection');

// ===================================================
// == ADMIN FUNCTIONS (إدارة المستخدمين من قبل الأدمن)
// ===================================================

// @desc    Get a single user by ID (for Admin Dashboard)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const requester = req.user;
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId) || userId <= 0) {
        res.status(400);
        throw new Error('Invalid user ID');
    }

    // Fetch user with membership
    let user = null;
    try {
        user = await User.query()
            .findById(userId)
            .withGraphFetched('membership')
            .select(
                'id',
                'name',
                'email',
                'role',
                'membership_id',
                'points',
                'cashback',
                'created_at',
                'created_by',
                'is_super_admin',
                'banned',
                'banned_at',
                'ban_reason',
                'profile_picture_url',
                'last_seen'
            );
    } catch (queryError) {
        console.warn('⚠️ [User] Error fetching user:', queryError.message);
        // Fallback: Try without graph fetch
        try {
            user = await User.query()
                .findById(userId)
                .select(
                    'id',
                    'name',
                    'email',
                    'role',
                    'membership_id',
                    'points',
                    'cashback',
                    'created_at',
                    'created_by',
                    'is_super_admin',
                    'banned',
                    'banned_at',
                    'ban_reason',
                    'profile_picture_url',
                    'last_seen'
                );
            
            // Manually fetch membership if needed
            if (user && user.membership_id) {
                try {
                    const Membership = require('../models/Membership');
                    user.membership = await Membership.query().findById(user.membership_id);
                } catch (membershipError) {
                    console.warn('⚠️ [User] Could not fetch membership:', membershipError.message);
                    user.membership = null;
                }
            }
        } catch (fallbackError) {
            console.error('❌ [User] Fallback query also failed:', fallbackError.message);
        }
    }

    if (!user) {
        res.status(404);
        throw new Error(`User with ID ${userId} not found`);
    }

    // Check permissions based on requester role
    // Super admin can see anyone
    if (requester.is_super_admin) {
        return res.json(user);
    }

    // Regular admin can see anyone except super_admin
    if (requester.role === 'admin') {
        if (user.role === 'super_admin') {
            res.status(403);
            throw new Error('Access denied: Cannot view Super Admin details');
        }
        return res.json(user);
    }

    // Sales/Agent can only see customers they created
    if (requester.role === 'sales' || requester.role === 'agent') {
        if (user.role !== 'customer') {
            res.status(403);
            throw new Error('Access denied: Can only view customer accounts');
        }
        if (user.created_by !== requester.id && user.created_by !== null) {
            res.status(403);
            throw new Error('Access denied: Can only view customers you created');
        }
        return res.json(user);
    }

    // HR can see specific roles
    if (requester.role === 'hr') {
        const allowedRoles = ['hr', 'data_entry', 'reservations', 'support', 'customer'];
        if (!allowedRoles.includes(user.role)) {
            res.status(403);
            throw new Error('Access denied: Insufficient permissions');
        }
        return res.json(user);
    }

    // Accountant can see specific roles
    if (requester.role === 'accountant') {
        const allowedRoles = ['accountant', 'sales', 'customer', 'admin'];
        if (!allowedRoles.includes(user.role)) {
            res.status(403);
            throw new Error('Access denied: Insufficient permissions');
        }
        return res.json(user);
    }

    // Data entry can see specific roles
    if (requester.role === 'data_entry') {
        const allowedRoles = ['customer', 'data_entry', 'reservations'];
        if (!allowedRoles.includes(user.role)) {
            res.status(403);
            throw new Error('Access denied: Insufficient permissions');
        }
        return res.json(user);
    }

    // Reservations can see specific roles
    if (requester.role === 'reservations') {
        const allowedRoles = ['customer', 'reservations'];
        if (!allowedRoles.includes(user.role)) {
            res.status(403);
            throw new Error('Access denied: Insufficient permissions');
        }
        return res.json(user);
    }

    // Default: deny access
    res.status(403);
    throw new Error('Access denied: Insufficient permissions');
});

// @desc    Get all users (for Admin Dashboard)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const requester = req.user;

    const usersQuery = User.query()
        .withGraphFetched('membership')
        .select(
            'id',
            'name',
            'email',
            'role',
            'membership_id',
            'points',
            'cashback',
            'created_at',
            'created_by',
            'is_super_admin',
            'banned',
            'banned_at',
            'ban_reason',
        );

    if (!requester.is_super_admin) {
        usersQuery.whereNot('role', 'super_admin');
    }

    switch (requester.role) {
        case 'sales':
        case 'agent':
            usersQuery.where('role', 'customer');
            usersQuery.andWhere(builder => {
                builder.where('created_by', requester.id).orWhereNull('created_by');
            });
            break;
        case 'hr':
            usersQuery.whereIn('role', ['hr', 'data_entry', 'reservations', 'support', 'customer']);
            break;
        case 'accountant':
            usersQuery.whereIn('role', ['accountant', 'sales', 'customer', 'admin']);
            break;
        case 'data_entry':
            usersQuery.whereIn('role', ['customer', 'data_entry', 'reservations']);
            break;
        case 'reservations':
            usersQuery.whereIn('role', ['customer', 'reservations']);
            break;
        default:
            break;
    }

    const users = await usersQuery.orderBy('created_at', 'desc');
    res.json(users);
});

// @desc    Update a user's role and details (Admin)
// @route   PUT /api/users/:id
// @access  Private/SuperAdmin/Admin
exports.updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const actor = req.user;
    const userToUpdate = await User.query().findById(id);

    if (!userToUpdate) {
        res.status(404);
        throw new Error('User not found');
    }

    if (userToUpdate.id === actor.id && req.body.role && req.body.role !== actor.role) {
        res.status(400);
        throw new Error('You cannot change your own role.');
    }

    const payload = { ...req.body };

    if (payload.role === 'super_admin' && !actor.is_super_admin) {
        res.status(403);
        throw new Error('Only Super Admin can assign Super Admin role.');
    }

    if (payload.is_super_admin !== undefined && !actor.is_super_admin) {
        delete payload.is_super_admin;
    }

    // CRITICAL FIX: Validate role against allowed roles to prevent constraint violation
    if (payload.role) {
        const allowedRoles = [
            'customer',
            'admin',
            'super_admin',
            'sales',
            'agent',
            'hr',
            'accountant',
            'data_entry',
            'reservations',
            'support',
            'bot'
        ];
        
        if (!allowedRoles.includes(payload.role)) {
            res.status(400);
            throw new Error(`Invalid role: ${payload.role}. Allowed roles: ${allowedRoles.join(', ')}`);
        }
    }

    const updatedUser = await User.query().patchAndFetchById(id, payload);
    res.json(updatedUser);
});

// @desc    Add manual gift (Points, Cashback, Voucher) to a user
// @route   POST /api/users/gift/:id
// @access  Private/Admin/Sales/HR
exports.addManualGift = asyncHandler(async (req, res) => {
    const { points, cashback, voucherType, description } = req.body;
    const { id } = req.params;

    const updatedUser = await transaction(User.knex(), async (trx) => {
        const user = await User.query(trx).findById(id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        const updateData = {};
        if (points) updateData.points = user.points + points;
        if (cashback) updateData.cashback = parseFloat(user.cashback) + cashback;

        const updatedUser = await user.$query(trx).patchAndFetch(updateData);

        // Create a transaction record for the manual gift
        if (points || cashback) {
            await Transaction.query(trx).insert({
                user_id: id,
                type: 'manual_deposit',
                amount: cashback || 0,
                points_change: points || 0,
                cashback_change: cashback || 0,
                description: description || `Manual gift from ${req.user?.name || 'admin'}`
            });
        }

        return updatedUser;
    });

    res.json({ message: 'Manual gift successfully added.', user: updatedUser });
});


// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/SuperAdmin
exports.deleteUser = asyncHandler(async (req, res) => {
    const user = await User.query().findById(req.params.id);
    if (user) {
        if (user.role === 'super_admin') {
            res.status(403);
            throw new Error('Cannot delete a Super Admin.');
        }
        if (user.id === req.user.id) {
            res.status(400);
            throw new Error('You cannot delete your own account.');
        }
        await User.query().deleteById(req.params.id);
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Ban/Unban a user
// @route   PUT /api/users/:id/ban
// @access  Private/SuperAdmin/Admin
exports.banUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { banned, banReason } = req.body;

    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const actor = req.user;
    const userToBan = await User.query().findById(id);

    if (!userToBan) {
        res.status(404);
        throw new Error('User not found');
    }

    if (userToBan.id === actor.id) {
        res.status(400);
        throw new Error('You cannot ban/unban yourself.');
    }

    if (userToBan.role === 'super_admin' && !actor.is_super_admin) {
        res.status(403);
        throw new Error('Only Super Admin can ban/unban Super Admin accounts.');
    }

    const updateData = {
        banned: banned === true || banned === 'true',
    };

    if (updateData.banned) {
        updateData.banned_at = new Date();
        if (banReason) {
            updateData.ban_reason = banReason;
        }
    } else {
        updateData.banned_at = null;
        updateData.ban_reason = null;
    }

    const updatedUser = await User.query().patchAndFetchById(id, updateData);
    res.json({
        message: updateData.banned ? 'User banned successfully' : 'User unbanned successfully',
        user: updatedUser
    });
});


// =====================================================
// == PROFILE FUNCTIONS (إدارة الملف الشخصي للمستخدم)
// =====================================================

// @desc    Get user profile details
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
    const user = await User.query()
        .findById(req.user.id)
        .withGraphFetched('membership')
        .select('id', 'name', 'email', 'role', 'membership_id', 'points', 'cashback', 'profile_picture_url', 'created_at', 'is_super_admin', 'created_by'); 

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile data (Name, Email) and Profile Picture
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
        const user = await User.query().findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const { name, email, phone, firstName, lastName } = req.body;
        const dataToUpdate = {};

        // Handle name
        if (name) {
            dataToUpdate.name = name;
        } else if (firstName || lastName) {
            const fullName = `${firstName || ''} ${lastName || ''}`.trim();
            if (fullName) {
                dataToUpdate.name = fullName;
            }
        }

        if (email) {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address',
                });
            }
            dataToUpdate.email = email.toLowerCase();
        }

        if (phone !== undefined) {
            dataToUpdate.phone = phone || null;
        }

        // Handle file upload - Delete old image if exists
        if (req.file) {
            // Delete old profile picture if it exists
            if (user.profile_picture_url) {
                try {
                    // Extract filename from URL
                    const oldImagePath = user.profile_picture_url.startsWith('/uploads/')
                        ? user.profile_picture_url.replace('/uploads/', '')
                        : user.profile_picture_url.replace(/^\/+/, '');
                    
                    const fullOldPath = path.join(__dirname, '../uploads', oldImagePath);
                    
                    // Check if file exists and delete it
                    try {
                        await fs.access(fullOldPath);
                        await fs.unlink(fullOldPath);
                        console.log(`Deleted old profile picture: ${fullOldPath}`);
                    } catch (err) {
                        // File doesn't exist or already deleted, continue
                        console.log(`Old profile picture not found or already deleted: ${fullOldPath}`);
                    }
                } catch (deleteError) {
                    // Log error but don't fail the update
                    console.error('Error deleting old profile picture:', deleteError);
                }
            }

            // Create proper URL path
            const filePath = req.file.path;
            const relativePath = filePath.replace(/\\/g, '/').split('uploads/')[1];
            dataToUpdate.profile_picture_url = `/uploads/${relativePath}`;
        }
        
        const updatedUser = await User.query().patchAndFetchById(req.user.id, dataToUpdate);
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found after update',
            });
        }

        // Construct full URL for profile picture if it exists
        let profilePictureUrl = updatedUser.profile_picture_url;
        if (profilePictureUrl && !profilePictureUrl.startsWith('http')) {
            const protocol = req.protocol;
            const host = req.get('host');
            profilePictureUrl = `${protocol}://${host}${profilePictureUrl}`;
        }
        
        res.json({
            success: true,
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone || null,
            profilePictureUrl: profilePictureUrl,
            profile_picture_url: profilePictureUrl,
            message: 'Profile updated successfully',
        });
    } catch (error) {
        console.error('Update profile error:', error);
        
        // If file was uploaded but update failed, try to delete it
        if (req.file) {
            try {
                const fs = require('fs').promises;
                await fs.unlink(req.file.path);
            } catch (cleanupError) {
                console.error('Error cleaning up uploaded file:', cleanupError);
            }
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});