// File: controllers/authController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper function to generate a JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-key', { expiresIn: '7d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, role } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  // Validate role if provided
  const validRoles = ['customer', 'admin', 'super_admin', 'hr', 'sales', 'reservations', 'data_entry', 'accountant', 'agent', 'support'];
  const userRole = role && validRoles.includes(role) ? role : 'customer';

  const userExists = await User.query().findOne({ email: email.toLowerCase() });

  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists',
    });
  }

  try {
    // Manually hash the password before inserting
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.query().insert({
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
      points: 0,
      cashback: 0,
      is_super_admin: userRole === 'super_admin',
    });

    if (user) {
      res.status(200).json({
        success: true,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points || 0,
        cashback: user.cashback || 0,
        is_super_admin: !!user.is_super_admin,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data',
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  try {
    const user = await User.query().findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user has a password (in case password field is null)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Manually compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      res.status(200).json({
        success: true,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        membershipId: user.membership_id || null,
        points: user.points || 0,
        cashback: user.cashback || 0,
        is_super_admin: !!user.is_super_admin,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
});
