// File: controllers/membershipAnalyticsController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const MembershipCard = require('../models/MembershipCard');
const Membership = require('../models/Membership');

// @desc    Get user analytics for membership dashboard
// @route   GET /api/memberships/analytics
// @access  Private
exports.getUserAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get user with membership
  const user = await User.query()
    .findById(userId)
    .withGraphFetched('membership');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Get membership card
  const membershipCard = await MembershipCard.getUserCard(userId);

  // Get transactions (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const transactions = await Transaction.query()
    .where('user_id', userId)
    .where('created_at', '>=', sixMonthsAgo)
    .orderBy('created_at', 'desc')
    .limit(100);

  // Get bookings (last 6 months)
  const bookings = await Booking.query()
    .where('user_id', userId)
    .where('created_at', '>=', sixMonthsAgo)
    .orderBy('created_at', 'desc')
    .limit(50);

  // Calculate statistics
  const totalSpent = transactions
    .filter(tx => tx.status === 'completed' && tx.type === 'payment')
    .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

  const totalEarned = transactions
    .filter(tx => tx.status === 'completed' && (tx.type === 'reward' || tx.type === 'cashback' || tx.type === 'points'))
    .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => 
    b.status === 'paid' || b.status === 'confirmed' || b.status === 'completed'
  ).length;

  // Generate chart data (last 6 months)
  const chartData = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate >= month && txDate <= monthEnd;
    });

    const monthSpent = monthTransactions
      .filter(tx => tx.status === 'completed' && tx.type === 'payment')
      .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

    const monthEarned = monthTransactions
      .filter(tx => tx.status === 'completed' && (tx.type === 'reward' || tx.type === 'cashback' || tx.type === 'points'))
      .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

    chartData.push({
      month: month.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' }),
      spent: monthSpent,
      earned: monthEarned,
      transactions: monthTransactions.length,
    });
  }

  // Get current membership details
  let membershipDetails = null;
  if (user.membership_id) {
    const membership = await Membership.query().findById(user.membership_id);
    if (membership) {
      membershipDetails = {
        id: membership.id,
        name: membership.name,
        tier: membership.tier || membership.name,
        price: membership.price,
        points: membership.points || 0,
        cashback_rate: membership.cashback_rate || 0,
        point_multiplier: membership.point_multiplier || 1,
      };
    }
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points || 0,
        cashback: user.cashback || 0,
      },
      membership: membershipDetails,
      membershipCard: membershipCard ? {
        card_number: membershipCard.card_number,
        membership_number: membershipCard.card_number,
        expiry_date: membershipCard.expiry_date,
        issue_date: membershipCard.issue_date,
      } : null,
      statistics: {
        totalSpent,
        totalEarned,
        totalBookings,
        completedBookings,
        currentPoints: user.points || 0,
        currentCashback: user.cashback || 0,
      },
      chartData,
      recentTransactions: transactions.slice(0, 10).map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        description: tx.description,
        created_at: tx.created_at,
      })),
      recentBookings: bookings.slice(0, 5).map(booking => ({
        id: booking.id,
        category: booking.category,
        status: booking.status,
        total_price: booking.total_price,
        created_at: booking.created_at,
      })),
    },
  });
});
