// File: controllers/adminController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Create admin user (one-time setup)
// @route   POST /api/admin/create-admin
// @access  Public (for initial setup only - should be protected in production)
exports.createAdminUser = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Default admin credentials if not provided
  const adminEmail = email || 'ahmedsaifdin237@gmail.com';
  const adminPassword = password || 'AAIOH2040%%fF%';
  const adminName = name || 'Ahmed Saif Din';

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  // Validate password length
  if (adminPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.query().findOne({ email: adminEmail.toLowerCase() });

    if (existingUser) {
      // Update existing user to admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const updatedUser = await User.query()
        .patchAndFetchById(existingUser.id, {
          role: 'admin',
          password: hashedPassword,
          name: adminName,
        });

      return res.status(200).json({
        success: true,
        message: 'User updated to admin successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        },
      });
    }

    // Create new admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const newAdmin = await User.query().insert({
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      name: adminName,
      role: 'admin',
      points: 0,
      cashback: 0,
    });

    res.status(200).json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin creation',
      error: error.message,
    });
  }
});

