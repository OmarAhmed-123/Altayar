// File: controllers/paymentController.js
const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const Membership = require('../models/Membership');
const User = require('../models/User');

// @desc    Create payment intent for booking or membership
// @route   POST /api/payments/create-intent
// @access  Private
exports.createPaymentIntent = asyncHandler(async (req, res) => {
  const { type, itemId, amount, currency = 'USD' } = req.body;
  const userId = req.user.id;

  if (!type || !itemId || !amount) {
    res.status(400);
    throw new Error('Missing required fields: type, itemId, amount');
  }

  // Validate amount
  if (amount <= 0) {
    res.status(400);
    throw new Error('Amount must be greater than 0');
  }

  // Create transaction record
  const transaction = await Transaction.query().insert({
    user_id: userId,
    type: type === 'booking' ? 'booking_payment' : 'membership_purchase',
    amount: amount,
    currency: currency,
    status: 'pending',
    payment_method: 'card',
    reference_id: itemId,
    description: type === 'booking' 
      ? `Payment for booking ${itemId}` 
      : `Payment for membership ${itemId}`,
  });

  res.status(200).json({
    success: true,
    transactionId: transaction.id,
    amount: amount,
    currency: currency,
    // In production, integrate with Stripe/PayPal here
    // For now, return transaction ID for manual processing
    message: 'Payment intent created. Process payment through payment gateway.',
  });
});

// @desc    Confirm payment and update booking/membership
// @route   POST /api/payments/confirm
// @access  Private
exports.confirmPayment = asyncHandler(async (req, res) => {
  const { transactionId, paymentMethod, paymentDetails } = req.body;
  const userId = req.user.id;

  if (!transactionId) {
    res.status(400);
    throw new Error('Transaction ID is required');
  }

  // Get transaction
  const transaction = await Transaction.query()
    .findById(transactionId)
    .where('user_id', userId)
    .where('status', 'pending');

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found or already processed');
  }

  // Update transaction status
  await Transaction.query()
    .findById(transactionId)
    .patch({
      status: 'completed',
      payment_method: paymentMethod || 'card',
      payment_details: paymentDetails || {},
      completed_at: new Date(),
    });

  // Update related booking or membership
  const referenceId = transaction.reference_id;
  const transactionType = transaction.type;

  if (transactionType === 'booking_payment') {
    // Update booking status
    await Booking.query()
      .findById(referenceId)
      .patch({
        status: 'confirmed',
        payment_status: 'paid',
      });
    } else if (transactionType === 'membership_purchase') {
    // Update user membership
    await User.query()
      .findById(userId)
      .patch({
        membership_id: referenceId,
      });
  }

  // Update user points/cashback if applicable
  const pointsEarned = Math.floor(transaction.amount * 0.01); // 1 point per currency unit
  const cashbackEarned = transaction.amount * 0.02; // 2% cashback

  await User.query()
    .findById(userId)
    .increment('points', pointsEarned)
    .increment('cashback', cashbackEarned);

  const updatedTransaction = await Transaction.query().findById(transactionId);

  res.status(200).json({
    success: true,
    transaction: updatedTransaction,
    message: 'Payment confirmed successfully',
  });
});

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Private
exports.getPaymentMethods = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    methods: [
      {
        id: 'card',
        name: 'Credit/Debit Card',
        icon: 'credit-card',
        enabled: true,
      },
      {
        id: 'paypal',
        name: 'PayPal',
        icon: 'paypal',
        enabled: false, // Enable when PayPal is integrated
      },
      {
        id: 'stripe',
        name: 'Stripe',
        icon: 'stripe',
        enabled: false, // Enable when Stripe is integrated
      },
    ],
  });
});

