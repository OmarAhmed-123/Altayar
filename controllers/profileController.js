// File: controllers/profileController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get user profile details
// @route   GET /api/profile or /api/auth/me
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
    try {
        // req.user is attached by the 'protect' middleware
        const user = await User.query()
            .findById(req.user.id)
            .withGraphFetched('membership')
            .select('id', 'name', 'email', 'role', 'membership_id', 'points', 'cashback', 'profile_picture_url', 'created_at', 'updated_at'); 

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Return user data in consistent format with explicit 200 status
        res.status(200).json({
            success: true,
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            membership_id: user.membership_id || null,
            points: user.points || 0,
            cashback: user.cashback || 0,
            profile_picture_url: user.profile_picture_url || null,
            created_at: user.created_at,
            updated_at: user.updated_at,
            membership: user.membership || null,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile',
        });
    }
});

// @desc    Update user profile data (Name, Email) and Profile Picture
// @route   PUT /api/profile
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

        // Handle name - can come as single name or firstName/lastName
        if (name) {
            dataToUpdate.name = name;
        } else if (firstName || lastName) {
            // If firstName/lastName provided, combine them
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
                        : user.profile_picture_url;
                    
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

            // Get the file path relative to the server root
            const filePath = req.file.path;
            // Create URL path for the image (accessible via /uploads/profiles/filename)
            const relativePath = filePath.replace(/\\/g, '/').split('uploads/')[1];
            dataToUpdate.profile_picture_url = `/uploads/${relativePath}`;
        }

        // Update user in database
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
        
        res.status(200).json({
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
