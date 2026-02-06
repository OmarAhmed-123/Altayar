/**
 * Complete Reports Route with Professional PDF Generation
 * 
 * File location: E:\Altayar-app\Altayar-app-final\backend\routes\reports.js
 * 
 * Installation required:
 * npm install pdfkit
 * npm install jsonwebtoken
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path as needed
const Booking = require('../models/Booking'); // Adjust path as needed
const Trip = require('../models/Trip'); // Adjust path as needed
const Transaction = require('../models/Transaction'); // Adjust path as needed
const Membership = require('../models/Membership'); // Adjust path as needed
const { generateUserReportPDF } = require('../utils/pdfGenerator'); // Path to PDF generator

/**
 * Middleware to authenticate from query string or header
 */
const authenticateQuery = async (req, res, next) => {
  try {
    // Get token from query string or header
    let token = req.query.token || 
                req.headers.authorization?.replace('Bearer ', '') ||
                req.headers.authorization;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, no token' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SECRET_KEY);
    const userId = decoded.id || decoded.userId || decoded.user_id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }

    // Get user from database
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = userId;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

/**
 * Get user report data (without PDF)
 * GET /api/reports/user-data
 */
router.get('/user-data', authenticateQuery, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user data
    const user = await User.findById(userId).select('-password');
    
    // Get membership
    const membership = await Membership.findOne({ userId }).sort({ createdAt: -1 });
    
    // Get bookings
    const bookings = await Booking.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('packageId', 'title price');
    
    // Get trips
    const trips = await Trip.find({ userId })
      .sort({ startDate: -1 })
      .limit(20);
    
    // Get transactions
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30);
    
    // Calculate statistics
    const totalBookings = await Booking.countDocuments({ userId });
    const totalTrips = await Trip.countDocuments({ userId });
    
    const bookingsTotal = await Booking.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalSpent = bookingsTotal[0]?.total || 0;
    
    const cashbackTotal = await Transaction.aggregate([
      { $match: { userId: userId, type: 'cashback' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCashback = cashbackTotal[0]?.total || 0;
    
    const pendingTotal = await Transaction.aggregate([
      { $match: { userId: userId, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const pendingPayments = Math.abs(pendingTotal[0]?.total || 0);

    // Format response
    const reportData = {
      user: {
        id: user._id,
        firstName: user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at || user.createdAt,
      },
      membership: membership ? {
        type: membership.type || membership.name || 'Standard',
        subscriptionDate: membership.subscriptionDate || membership.createdAt,
        expiryDate: membership.expiryDate,
        status: membership.status || 'active',
        cashbackBalance: membership.cashbackBalance || 0,
      } : null,
      bookings: bookings.map(booking => ({
        id: booking._id,
        packageName: booking.packageId?.title || 'N/A',
        status: booking.status,
        totalAmount: booking.totalPrice || 0,
        bookingDate: booking.created_at || booking.createdAt,
        travelDate: booking.startDate,
      })),
      trips: trips.map(trip => ({
        id: trip._id,
        destination: trip.destination || trip.location || 'N/A',
        status: trip.status || 'planned',
        startDate: trip.startDate,
        endDate: trip.endDate,
        totalCost: trip.totalCost || trip.price || 0,
      })),
      transactions: transactions.map(transaction => ({
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount || 0,
        description: transaction.description || transaction.note || 'N/A',
        createdAt: transaction.created_at || transaction.createdAt,
        status: transaction.status || 'completed',
      })),
      statistics: {
        totalBookings,
        totalTrips,
        totalSpent,
        totalCashback,
        pendingPayments,
      },
    };

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report data',
      error: error.message,
    });
  }
});

/**
 * Generate and download user report as PDF
 * GET /api/reports/user-pdf?token=XXX
 */
router.get('/user-pdf', authenticateQuery, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user data
    const user = await User.findById(userId).select('-password');
    
    // Get membership
    const membership = await Membership.findOne({ userId }).sort({ createdAt: -1 });
    
    // Get bookings
    const bookings = await Booking.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('packageId', 'title price');
    
    // Get trips
    const trips = await Trip.find({ userId })
      .sort({ startDate: -1 })
      .limit(20);
    
    // Get transactions
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30);
    
    // Calculate statistics
    const totalBookings = await Booking.countDocuments({ userId });
    const totalTrips = await Trip.countDocuments({ userId });
    
    const bookingsTotal = await Booking.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalSpent = bookingsTotal[0]?.total || 0;
    
    const cashbackTotal = await Transaction.aggregate([
      { $match: { userId: userId, type: 'cashback' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCashback = cashbackTotal[0]?.total || 0;
    
    const pendingTotal = await Transaction.aggregate([
      { $match: { userId: userId, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const pendingPayments = Math.abs(pendingTotal[0]?.total || 0);

    // Prepare report data
    const reportData = {
      user: {
        id: user._id,
        firstName: user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at || user.createdAt,
        createdAt: user.created_at || user.createdAt,
      },
      membership: membership ? {
        type: membership.type || membership.name || 'Standard',
        subscriptionDate: membership.subscriptionDate || membership.createdAt,
        expiryDate: membership.expiryDate,
        status: membership.status || 'active',
        cashbackBalance: membership.cashbackBalance || 0,
      } : null,
      bookings: bookings.map(booking => ({
        id: booking._id,
        packageName: booking.packageId?.title || 'N/A',
        status: booking.status,
        totalAmount: booking.totalPrice || 0,
        bookingDate: booking.created_at || booking.createdAt,
        travelDate: booking.startDate,
      })),
      trips: trips.map(trip => ({
        id: trip._id,
        destination: trip.destination || trip.location || 'N/A',
        status: trip.status || 'planned',
        startDate: trip.startDate,
        endDate: trip.endDate,
        totalCost: trip.totalCost || trip.price || 0,
      })),
      transactions: transactions.map(transaction => ({
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount || 0,
        description: transaction.description || transaction.note || 'N/A',
        createdAt: transaction.created_at || transaction.createdAt,
        status: transaction.status || 'completed',
      })),
      statistics: {
        totalBookings,
        totalTrips,
        totalSpent,
        totalCashback,
        pendingPayments,
      },
    };

    // Generate PDF
    const pdfBuffer = await generateUserReportPDF(reportData, user);

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="user-report-${userId}-${Date.now()}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
    });
  }
});

module.exports = router;

