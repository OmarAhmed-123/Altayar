// File: controllers/dashboardController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const Package = require('../models/Package');
const Review = require('../models/Review');
const PackageAnalytics = require('../models/PackageAnalytics');
const { db } = require('../config/db');

// @desc    Get comprehensive dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private (super_admin, admin, accountant)
exports.getStats = asyncHandler(async (req, res) => {
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // 1. User Statistics
    const totalUsers = await User.query().where('role', 'customer').resultSize();
    const newUsers = await User.query()
        .where('role', 'customer')
        .where('created_at', '>=', daysAgo)
        .resultSize();

    // 2. Booking Statistics
    const totalBookings = await Booking.query().resultSize();
    const recentBookings = await Booking.query()
        .where('created_at', '>=', daysAgo)
        .resultSize();
    
    const bookingStats = await Booking.query()
        .groupBy('status')
        .select('status', db.raw('count(*)::int as count'));

    // 3. Financial Statistics
    const totalRevenue = await Transaction.query()
        .sum('amount as total')
        .where('type', 'booking_payment')
        .first();

    const recentRevenue = await Transaction.query()
        .sum('amount as total')
        .where('type', 'booking_payment')
        .where('created_at', '>=', daysAgo)
        .first();

    const averageBookingValue = await Booking.query()
        .avg('total_price as average')
        .first();

    // 4. Package Statistics
    const totalPackages = await Package.query().where('is_active', true).resultSize();
    const popularPackages = await PackageAnalytics.getTrendingPackages(5, parseInt(period));

    // 5. Review Statistics
    const totalReviews = await Review.query().resultSize();
    const averageRating = await Review.query()
        .avg('rating as average')
        .first();

    // 6. Conversion Rates
    const totalViews = await PackageAnalytics.query()
        .where('action', 'view')
        .where('created_at', '>=', daysAgo)
        .resultSize();

    const totalBookingsFromViews = await PackageAnalytics.query()
        .where('action', 'book')
        .where('created_at', '>=', daysAgo)
        .resultSize();

    const conversionRate = totalViews > 0 ? (totalBookingsFromViews / totalViews * 100) : 0;

    res.json({
        success: true,
        data: {
            users: {
                total: totalUsers,
                new: newUsers,
                growth: totalUsers > 0 ? ((newUsers / totalUsers) * 100) : 0
            },
            bookings: {
                total: totalBookings,
                recent: recentBookings,
                by_status: bookingStats,
                average_value: Math.round(parseFloat(averageBookingValue.average) * 100) / 100
            },
            revenue: {
                total: Math.abs(parseFloat(totalRevenue.total) || 0),
                recent: Math.abs(parseFloat(recentRevenue.total) || 0),
                growth: parseFloat(totalRevenue.total) > 0 ? 
                    ((parseFloat(recentRevenue.total) / parseFloat(totalRevenue.total)) * 100) : 0
            },
            packages: {
                total: totalPackages,
                popular: popularPackages.map(item => item.package)
            },
            reviews: {
                total: totalReviews,
                average_rating: Math.round(parseFloat(averageRating.average) * 10) / 10
            },
            conversion: {
                rate: Math.round(conversionRate * 100) / 100,
                views: totalViews,
                bookings: totalBookingsFromViews
            }
        }
    });
});

// @desc    Get advanced chart data
// @route   GET /api/dashboard/charts
// @access  Private (super_admin, admin, accountant, sales)
exports.getChartData = asyncHandler(async (req, res) => {
    const { type = 'sales', period = '12' } = req.query;
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(period));

    let chartData = {};

    switch (type) {
        case 'sales':
            // CRITICAL: Get all revenue transactions (not just booking_payment)
            // Include all transaction types that represent revenue
            chartData = await Transaction.query()
                .select(
                    db.raw("EXTRACT(YEAR FROM created_at) as year"),
                    db.raw("EXTRACT(MONTH FROM created_at) as month"),
                    db.raw("SUM(ABS(amount)) as totalSales")
                )
                .where('created_at', '>=', monthsAgo)
                .whereIn('type', ['booking_payment', 'membership_payment', 'package_payment', 'payment'])
                .groupByRaw("EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)")
                .orderByRaw("year, month");
            
            console.log(`📊 [Dashboard Charts] Sales data: ${chartData.length} months`);
            break;

        case 'bookings':
            chartData = await Booking.query()
                .select(
                    db.raw("EXTRACT(YEAR FROM created_at) as year"),
                    db.raw("EXTRACT(MONTH FROM created_at) as month"),
                    db.raw("COUNT(*)::int as totalBookings")
                )
                .where('created_at', '>=', monthsAgo)
                .groupByRaw("EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)")
                .orderByRaw("year, month");
            break;

        case 'users':
            chartData = await User.query()
                .select(
                    db.raw("EXTRACT(YEAR FROM created_at) as year"),
                    db.raw("EXTRACT(MONTH FROM created_at) as month"),
                    db.raw("COUNT(*)::int as newUsers")
                )
                .where('role', 'customer')
                .where('created_at', '>=', monthsAgo)
                .groupByRaw("EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)")
                .orderByRaw("year, month");
            break;

        case 'reviews':
            chartData = await Review.query()
                .select(
                    db.raw("EXTRACT(YEAR FROM created_at) as year"),
                    db.raw("EXTRACT(MONTH FROM created_at) as month"),
                    db.raw("COUNT(*)::int as totalReviews"),
                    db.raw("AVG(rating) as averageRating")
                )
                .where('created_at', '>=', monthsAgo)
                .groupByRaw("EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)")
                .orderByRaw("year, month");
            break;

        case 'package_views':
            chartData = await PackageAnalytics.query()
                .select(
                    db.raw("EXTRACT(YEAR FROM created_at) as year"),
                    db.raw("EXTRACT(MONTH FROM created_at) as month"),
                    db.raw("COUNT(*)::int as totalViews")
                )
                .where('action', 'view')
                .where('created_at', '>=', monthsAgo)
                .groupByRaw("EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)")
                .orderByRaw("year, month");
            break;
    }

    // CRITICAL: Format chart data properly for frontend
    // Ensure data is in the correct format with label and value
    let formattedData = [];
    if (Array.isArray(chartData)) {
        formattedData = chartData.map((item) => {
            const month = parseInt(item.month) || 1;
            const year = parseInt(item.year) || new Date().getFullYear();
            const value = parseFloat(item.totalSales || item.total_sales || item.total || item.value || 0);
            
            // Create proper label from month/year
            const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                               'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            const monthName = monthNames[month - 1] || `شهر ${month}`;
            const label = `${monthName} ${year}`;
            
            return {
                year: year,
                month: month,
                label: label,
                value: Math.abs(value),
                totalSales: Math.abs(value),
                total_sales: Math.abs(value)
            };
        });
    }
    
    console.log(`✅ [Dashboard Charts] Returning ${formattedData.length} formatted chart points`);
    if (formattedData.length > 0) {
        console.log(`📊 [Dashboard Charts] Sample data: ${JSON.stringify(formattedData[0])}`);
    }
    
    res.json({
        success: true,
        data: formattedData,
        type,
        period: `${period} months`
    });
});

// @desc    Get real-time analytics
// @route   GET /api/dashboard/realtime
// @access  Private (super_admin, admin)
exports.getRealtimeAnalytics = asyncHandler(async (req, res) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const role = req.user?.role || 'guest';
    const userId = req.user?.id || null;
    const privilegedRoles = ['super_admin', 'admin', 'accountant', 'sales'];
    const isPrivileged = privilegedRoles.includes(role);

    const scopedPackageAnalytics = () => {
        const query = PackageAnalytics.query();
        if (!isPrivileged && userId) {
            query.where('user_id', userId);
        }
        return query;
    };

    const scopedBookingQuery = () => {
        const query = Booking.query();
        if (!isPrivileged && userId) {
            query.where('user_id', userId);
        }
        return query;
    };

    const scopedTransactionQuery = () => {
        const query = Transaction.query();
        if (!isPrivileged && userId) {
            query.where('user_id', userId);
        }
        return query;
    };

    const activeUsersPromise = scopedPackageAnalytics()
        .where('created_at', '>=', oneHourAgo)
        .countDistinct('user_id as count')
        .first();

    const recentBookingsPromise = scopedBookingQuery()
        .where('created_at', '>=', oneHourAgo)
        .resultSize();

    const recentRevenuePromise = scopedTransactionQuery()
        .sum('amount as total')
        .where('type', 'booking_payment')
        .where('created_at', '>=', oneHourAgo)
        .first();

    const packageViewsPromise = scopedPackageAnalytics()
        .where('action', 'view')
        .where('created_at', '>=', oneHourAgo)
        .resultSize();

    const topPackagesPromise = scopedPackageAnalytics()
        .where('created_at', '>=', isPrivileged ? oneDayAgo : oneHourAgo)
        .whereIn('action', ['view', 'book'])
        .groupBy('package_id')
        .select('package_id', db.raw('COUNT(*)::int as interactions'))
        .orderBy('interactions', 'desc')
        .limit(isPrivileged ? 5 : 3)
        .withGraphFetched('package(selectBasicInfo)')
        .modifiers({
            selectBasicInfo(builder) {
                builder.select('id', 'name', 'price');
            }
        });

    const [activeUsers, recentBookings, recentRevenue, packageViews, topPackages] = await Promise.all([
        activeUsersPromise,
        recentBookingsPromise,
        recentRevenuePromise,
        packageViewsPromise,
        topPackagesPromise
    ]);

    res.json({
        success: true,
        data: {
            scope: isPrivileged ? 'global' : 'personal',
            active_users: parseInt(activeUsers.count) || 0,
            recent_bookings: recentBookings || 0,
            recent_revenue: Math.abs(parseFloat(recentRevenue.total) || 0),
            package_views: packageViews || 0,
            top_packages: topPackages.map(item => ({
                package: item.package,
                interactions: item.interactions
            }))
        },
        meta: {
            role,
            filtered_user_id: isPrivileged ? null : userId
        },
        timestamp: now
    });
});

// @desc    Get user engagement analytics
// @route   GET /api/dashboard/engagement
// @access  Private (super_admin, admin)
exports.getUserEngagement = asyncHandler(async (req, res) => {
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // User activity breakdown
    const userActivity = await PackageAnalytics.query()
        .where('created_at', '>=', daysAgo)
        .groupBy('action')
        .select('action', db.raw('COUNT(*)::int as count'))
        .orderBy('count', 'desc');

    // Most active users
    const mostActiveUsers = await PackageAnalytics.query()
        .where('created_at', '>=', daysAgo)
        .groupBy('user_id')
        .select('user_id', db.raw('COUNT(*)::int as activity_count'))
        .orderBy('activity_count', 'desc')
        .limit(10)
        .withGraphFetched('user(selectBasicInfo)')
        .modifiers({
            selectBasicInfo(builder) {
                builder.select('id', 'name', 'email');
            }
        });

    // Engagement by day
    const dailyEngagement = await PackageAnalytics.query()
        .where('created_at', '>=', daysAgo)
        .select(db.raw('DATE(created_at) as date'), db.raw('COUNT(*)::int as interactions'))
        .groupBy(db.raw('DATE(created_at)'))
        .orderBy('date', 'desc');

    // User retention (users who came back)
    const returningUsers = await PackageAnalytics.query()
        .where('created_at', '>=', daysAgo)
        .groupBy('user_id')
        .having(db.raw('COUNT(DISTINCT DATE(created_at))'), '>', 1)
        .count('user_id as count')
        .first();

    const totalActiveUsers = await PackageAnalytics.query()
        .where('created_at', '>=', daysAgo)
        .countDistinct('user_id as count')
        .first();

    const retentionRate = totalActiveUsers.count > 0 ? 
        (returningUsers.count / totalActiveUsers.count * 100) : 0;

    res.json({
        success: true,
        data: {
            activity_breakdown: userActivity,
            most_active_users: mostActiveUsers.map(item => ({
                user: item.user,
                activity_count: item.activity_count
            })),
            daily_engagement: dailyEngagement,
            retention_rate: Math.round(retentionRate * 100) / 100,
            returning_users: parseInt(returningUsers.count),
            total_active_users: parseInt(totalActiveUsers.count)
        }
    });
});

// @desc    Get comprehensive revenue analytics
// @route   GET /api/dashboard/revenue-analytics
// @access  Private (super_admin, admin, accountant)
exports.getRevenueAnalytics = asyncHandler(async (req, res) => {
    try {
        const { period = '12' } = req.query;
        const periodNum = parseInt(period) || 12;
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - periodNum);

        // 1. Revenue by Status (Paid, Pending, Failed, Refunded)
        let revenueByStatus = [];
        try {
            revenueByStatus = await Transaction.query()
                .select('status', db.raw('SUM(ABS(amount)) as total'), db.raw('COUNT(*)::int as count'))
                .where('created_at', '>=', monthsAgo)
                .where('type', 'booking_payment')
                .groupBy('status');
        } catch (statusError) {
            console.warn('⚠️ [Dashboard] Could not fetch revenue by status:', statusError.message);
            revenueByStatus = [];
        }

        // 2. Revenue by Payment Method
        let revenueByMethod = [];
        try {
            revenueByMethod = await Transaction.query()
                .select('payment_method', db.raw('SUM(ABS(amount)) as total'), db.raw('COUNT(*)::int as count'))
                .where('created_at', '>=', monthsAgo)
                .where('type', 'booking_payment')
                .whereNotNull('payment_method')
                .groupBy('payment_method');
        } catch (methodError) {
            console.warn('⚠️ [Dashboard] Could not fetch revenue by method:', methodError.message);
            revenueByMethod = [];
        }

        // 3. Monthly Revenue Trend
        let monthlyTrend = [];
        try {
            monthlyTrend = await Transaction.query()
                .select(
                    db.raw("EXTRACT(YEAR FROM created_at) as year"),
                    db.raw("EXTRACT(MONTH FROM created_at) as month"),
                    db.raw("SUM(ABS(amount)) as total"),
                    db.raw("COUNT(*)::int as count")
                )
                .where('created_at', '>=', monthsAgo)
                .where('type', 'booking_payment')
                .groupByRaw("EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)")
                .orderByRaw("year, month");
        } catch (trendError) {
            console.warn('⚠️ [Dashboard] Could not fetch monthly trend:', trendError.message);
            monthlyTrend = [];
        }

        // 4. Revenue by Transaction Type
        let revenueByType = [];
        try {
            revenueByType = await Transaction.query()
                .select('type', db.raw('SUM(ABS(amount)) as total'), db.raw('COUNT(*)::int as count'))
                .where('created_at', '>=', monthsAgo)
                .groupBy('type');
        } catch (typeError) {
            console.warn('⚠️ [Dashboard] Could not fetch revenue by type:', typeError.message);
            revenueByType = [];
        }

        // 5. Top Revenue Users
        let topUsers = [];
        try {
            topUsers = await Transaction.query()
                .select('user_id', db.raw('SUM(ABS(amount)) as total'), db.raw('COUNT(*)::int as count'))
                .where('created_at', '>=', monthsAgo)
                .where('type', 'booking_payment')
                .groupBy('user_id')
                .orderBy('total', 'desc')
                .limit(10)
                .withGraphFetched('user(selectBasicInfo)')
                .modifiers({
                    selectBasicInfo(builder) {
                        builder.select('id', 'name', 'email');
                    }
                });
        } catch (usersError) {
            console.warn('⚠️ [Dashboard] Could not fetch top users:', usersError.message);
            topUsers = [];
        }

        // 6. Daily Revenue (Last 30 days)
        let dailyRevenue = [];
        try {
            dailyRevenue = await Transaction.query()
                .select(
                    db.raw("DATE(created_at) as date"),
                    db.raw("SUM(ABS(amount)) as total"),
                    db.raw("COUNT(*)::int as count")
                )
                .where('created_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                .where('type', 'booking_payment')
                .groupByRaw("DATE(created_at)")
                .orderBy('date', 'desc');
        } catch (dailyError) {
            console.warn('⚠️ [Dashboard] Could not fetch daily revenue:', dailyError.message);
            dailyRevenue = [];
        }

        // Calculate totals
        let totalRevenue = { total: 0 };
        let paidRevenue = { total: 0 };
        let pendingRevenue = { total: 0 };
        
        try {
            totalRevenue = await Transaction.query()
                .sum('amount as total')
                .where('type', 'booking_payment')
                .where('created_at', '>=', monthsAgo)
                .first() || { total: 0 };
        } catch (totalError) {
            console.warn('⚠️ [Dashboard] Could not fetch total revenue:', totalError.message);
        }

        try {
            paidRevenue = await Transaction.query()
                .sum('amount as total')
                .where('type', 'booking_payment')
                .where('status', 'completed')
                .where('created_at', '>=', monthsAgo)
                .first() || { total: 0 };
        } catch (paidError) {
            console.warn('⚠️ [Dashboard] Could not fetch paid revenue:', paidError.message);
        }

        try {
            pendingRevenue = await Transaction.query()
                .sum('amount as total')
                .where('type', 'booking_payment')
                .where('status', 'pending')
                .where('created_at', '>=', monthsAgo)
                .first() || { total: 0 };
        } catch (pendingError) {
            console.warn('⚠️ [Dashboard] Could not fetch pending revenue:', pendingError.message);
        }

        // Get additional analytics for users, bookings, and memberships
        const usersAnalytics = await _getUsersAnalytics(monthsAgo);
        const bookingsAnalytics = await _getBookingsAnalytics(monthsAgo);
        const membershipsAnalytics = await _getMembershipsAnalytics(monthsAgo);

        res.json({
            success: true,
            data: {
                summary: {
                    totalRevenue: Math.abs(parseFloat(totalRevenue.total) || 0),
                    paidRevenue: Math.abs(parseFloat(paidRevenue.total) || 0),
                    pendingRevenue: Math.abs(parseFloat(pendingRevenue.total) || 0),
                    period: `${periodNum} months`
                },
                byStatus: revenueByStatus.map(item => ({
                    status: item.status || 'unknown',
                    total: Math.abs(parseFloat(item.total) || 0),
                    count: parseInt(item.count) || 0
                })),
                byMethod: revenueByMethod.map(item => ({
                    method: item.payment_method || 'unknown',
                    total: Math.abs(parseFloat(item.total) || 0),
                    count: parseInt(item.count) || 0
                })),
                monthlyTrend: monthlyTrend.map(item => ({
                    year: parseInt(item.year),
                    month: parseInt(item.month),
                    total: Math.abs(parseFloat(item.total) || 0),
                    count: parseInt(item.count) || 0,
                    label: `${item.month}/${item.year}`
                })),
                byType: revenueByType.map(item => ({
                    type: item.type || 'unknown',
                    total: Math.abs(parseFloat(item.total) || 0),
                    count: parseInt(item.count) || 0
                })),
                topUsers: topUsers.map(item => ({
                    userId: item.user_id,
                    userName: item.user?.name || 'Unknown',
                    userEmail: item.user?.email || '',
                    total: Math.abs(parseFloat(item.total) || 0),
                    count: parseInt(item.count) || 0
                })),
                dailyRevenue: dailyRevenue.map(item => ({
                    date: item.date,
                    total: Math.abs(parseFloat(item.total) || 0),
                    count: parseInt(item.count) || 0
                })),
                users: usersAnalytics,
                bookings: bookingsAnalytics,
                memberships: membershipsAnalytics
            }
        });
    } catch (error) {
        console.error('❌ [Dashboard] Error in getRevenueAnalytics:', error);
        res.status(500).json({
            success: false,
            error: 'فشل في جلب بيانات الإيرادات. يرجى المحاولة مرة أخرى.',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Helper function to get users analytics
async function _getUsersAnalytics(monthsAgo) {
    try {
        const Membership = require('../models/Membership');
        
        // Users by Role
        let usersByRole = [];
        try {
            usersByRole = await User.query()
                .select('role', db.raw('COUNT(*)::int as count'))
                .where('created_at', '>=', monthsAgo)
                .groupBy('role');
        } catch (roleError) {
            console.warn('⚠️ [Dashboard] Could not fetch users by role:', roleError.message);
            usersByRole = [];
        }

        // Users by Registration Month
        let usersByMonth = [];
        try {
            usersByMonth = await User.query()
                .select(
                    db.raw("EXTRACT(YEAR FROM created_at) as year"),
                    db.raw("EXTRACT(MONTH FROM created_at) as month"),
                    db.raw("COUNT(*)::int as count")
                )
                .where('created_at', '>=', monthsAgo)
                .groupByRaw("EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)")
                .orderByRaw("year, month");
        } catch (monthError) {
            console.warn('⚠️ [Dashboard] Could not fetch users by month:', monthError.message);
            usersByMonth = [];
        }

        // Users with/without Membership
        let totalUsers = 0;
        let usersWithMembership = 0;
        let activeUsers = 0;
        let bannedUsers = 0;
        
        try {
            totalUsers = await User.query()
                .where('role', 'customer')
                .where('created_at', '>=', monthsAgo)
                .resultSize();
        } catch (totalError) {
            console.warn('⚠️ [Dashboard] Could not fetch total users:', totalError.message);
        }
        
        try {
            usersWithMembership = await User.query()
                .where('role', 'customer')
                .where('created_at', '>=', monthsAgo)
                .whereNotNull('membership_id')
                .resultSize();
        } catch (membershipError) {
            console.warn('⚠️ [Dashboard] Could not fetch users with membership:', membershipError.message);
        }

        // Active vs Inactive Users (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        try {
            activeUsers = await User.query()
                .where('role', 'customer')
                .where('created_at', '>=', monthsAgo)
                .where('last_seen', '>=', thirtyDaysAgo)
                .resultSize();
        } catch (activeError) {
            console.warn('⚠️ [Dashboard] Could not fetch active users:', activeError.message);
        }

        // Banned Users
        try {
            bannedUsers = await User.query()
                .where('banned', true)
                .where('created_at', '>=', monthsAgo)
                .resultSize();
        } catch (bannedError) {
            console.warn('⚠️ [Dashboard] Could not fetch banned users:', bannedError.message);
        }

        return {
            byRole: usersByRole.map(item => ({
                role: item.role || 'unknown',
                count: parseInt(item.count) || 0
            })),
            byMonth: usersByMonth.map(item => ({
                year: parseInt(item.year),
                month: parseInt(item.month),
                count: parseInt(item.count) || 0,
                label: `${item.month}/${item.year}`
            })),
            summary: {
                total: totalUsers,
                withMembership: usersWithMembership,
                withoutMembership: Math.max(0, totalUsers - usersWithMembership),
                active: activeUsers,
                inactive: Math.max(0, totalUsers - activeUsers),
                banned: bannedUsers
            }
        };
    } catch (error) {
        console.error('❌ [Dashboard] Error in _getUsersAnalytics:', error);
        return {
            byRole: [],
            byMonth: [],
            summary: {
                total: 0,
                withMembership: 0,
                withoutMembership: 0,
                active: 0,
                inactive: 0,
                banned: 0
            }
        };
    }
}

// Helper function to get bookings analytics
async function _getBookingsAnalytics(monthsAgo) {
    try {
        // Bookings by Status
        let bookingsByStatus = [];
        try {
            bookingsByStatus = await Booking.query()
                .select('status', db.raw('COUNT(*)::int as count'), db.raw('SUM(total_price) as total'))
                .where('created_at', '>=', monthsAgo)
                .groupBy('status');
        } catch (statusError) {
            console.warn('⚠️ [Dashboard] Could not fetch bookings by status:', statusError.message);
            bookingsByStatus = [];
        }

        // Bookings by Type
        let bookingsByType = [];
        try {
            bookingsByType = await Booking.query()
                .select('booking_type', db.raw('COUNT(*)::int as count'), db.raw('SUM(total_price) as total'))
                .where('created_at', '>=', monthsAgo)
                .whereNotNull('booking_type')
                .groupBy('booking_type');
        } catch (typeError) {
            console.warn('⚠️ [Dashboard] Could not fetch bookings by type:', typeError.message);
            bookingsByType = [];
        }

        // Bookings by Month
        let bookingsByMonth = [];
        try {
            bookingsByMonth = await Booking.query()
                .select(
                    db.raw("EXTRACT(YEAR FROM created_at) as year"),
                    db.raw("EXTRACT(MONTH FROM created_at) as month"),
                    db.raw("COUNT(*)::int as count"),
                    db.raw("SUM(total_price) as total")
                )
                .where('created_at', '>=', monthsAgo)
                .groupByRaw("EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)")
                .orderByRaw("year, month");
        } catch (monthError) {
            console.warn('⚠️ [Dashboard] Could not fetch bookings by month:', monthError.message);
            bookingsByMonth = [];
        }

        // Daily Bookings (Last 30 days)
        let dailyBookings = [];
        try {
            dailyBookings = await Booking.query()
                .select(
                    db.raw("DATE(created_at) as date"),
                    db.raw("COUNT(*)::int as count"),
                    db.raw("SUM(total_price) as total")
                )
                .where('created_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                .groupByRaw("DATE(created_at)")
                .orderBy('date', 'desc');
        } catch (dailyError) {
            console.warn('⚠️ [Dashboard] Could not fetch daily bookings:', dailyError.message);
            dailyBookings = [];
        }

        let totalBookings = 0;
        try {
            totalBookings = await Booking.query()
                .where('created_at', '>=', monthsAgo)
                .resultSize();
        } catch (totalError) {
            console.warn('⚠️ [Dashboard] Could not fetch total bookings:', totalError.message);
        }

        return {
            byStatus: bookingsByStatus.map(item => ({
                status: item.status || 'unknown',
                count: parseInt(item.count) || 0,
                total: Math.abs(parseFloat(item.total) || 0)
            })),
            byType: bookingsByType.map(item => ({
                type: item.booking_type || 'unknown',
                count: parseInt(item.count) || 0,
                total: Math.abs(parseFloat(item.total) || 0)
            })),
            byMonth: bookingsByMonth.map(item => ({
                year: parseInt(item.year),
                month: parseInt(item.month),
                count: parseInt(item.count) || 0,
                total: Math.abs(parseFloat(item.total) || 0),
                label: `${item.month}/${item.year}`
            })),
            daily: dailyBookings.map(item => ({
                date: item.date,
                count: parseInt(item.count) || 0,
                total: Math.abs(parseFloat(item.total) || 0)
            })),
            summary: {
                total: totalBookings
            }
        };
    } catch (error) {
        console.error('❌ [Dashboard] Error in _getBookingsAnalytics:', error);
        return {
            byStatus: [],
            byType: [],
            byMonth: [],
            daily: [],
            summary: {
                total: 0
            }
        };
    }
}

// Helper function to get memberships analytics
async function _getMembershipsAnalytics(monthsAgo) {
    try {
        const Membership = require('../models/Membership');
        const MembershipCard = require('../models/MembershipCard');
        
        // Memberships by Tier (from memberships catalog table)
        const membershipsByTier = await Membership.query()
            .select('tier', db.raw('COUNT(*)::int as count'))
            .where('created_at', '>=', monthsAgo)
            .groupBy('tier');

        // Memberships by Status (from membership_cards table based on expiry_date)
        // CRITICAL FIX: Use membership_cards table, NOT memberships table (memberships doesn't have status column)
        const now = new Date();
        
        // Get memberships by status using membership_cards table
        // Calculate status based on expiry_date: active if null or future date, expired if past date
        let membershipsByStatus = [];
        try {
            membershipsByStatus = await MembershipCard.query()
                .select(
                    db.raw(`CASE 
                        WHEN expiry_date IS NULL THEN 'active'
                        WHEN expiry_date >= CURRENT_DATE THEN 'active'
                        ELSE 'expired'
                    END as status`),
                    db.raw('COUNT(*)::int as count')
                )
                .where('created_at', '>=', monthsAgo)
                .groupByRaw(`CASE 
                    WHEN expiry_date IS NULL THEN 'active'
                    WHEN expiry_date >= CURRENT_DATE THEN 'active'
                    ELSE 'expired'
                END`);
        } catch (statusError) {
            // If membership_cards table doesn't exist or has issues, return empty array
            console.warn('⚠️ [Dashboard] Could not fetch memberships by status:', statusError.message);
            membershipsByStatus = [];
        }

        // Membership Cards by Month (actual user memberships)
        let membershipCardsByMonth = [];
        try {
            membershipCardsByMonth = await MembershipCard.query()
                .select(
                    db.raw("EXTRACT(YEAR FROM created_at) as year"),
                    db.raw("EXTRACT(MONTH FROM created_at) as month"),
                    db.raw("COUNT(*)::int as count")
                )
                .where('created_at', '>=', monthsAgo)
                .groupByRaw("EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)")
                .orderByRaw("year, month");
        } catch (monthError) {
            console.warn('⚠️ [Dashboard] Could not fetch memberships by month:', monthError.message);
            membershipCardsByMonth = [];
        }

        // Active vs Expired Memberships (from membership_cards table)
        let activeMemberships = 0;
        let expiredMemberships = 0;
        let totalMemberships = 0;
        
        try {
            activeMemberships = await MembershipCard.query()
                .where('created_at', '>=', monthsAgo)
                .where(function() {
                    this.whereNull('expiry_date')
                        .orWhere('expiry_date', '>=', now);
                })
                .resultSize();

            expiredMemberships = await MembershipCard.query()
                .where('created_at', '>=', monthsAgo)
                .whereNotNull('expiry_date')
                .where('expiry_date', '<', now)
                .resultSize();

            totalMemberships = await MembershipCard.query()
                .where('created_at', '>=', monthsAgo)
                .resultSize();
        } catch (summaryError) {
            console.warn('⚠️ [Dashboard] Could not fetch membership summary:', summaryError.message);
        }

        // Also get membership types count (catalog)
        let totalMembershipTypes = 0;
        try {
            totalMembershipTypes = await Membership.query()
                .where('created_at', '>=', monthsAgo)
                .resultSize();
        } catch (typesError) {
            console.warn('⚠️ [Dashboard] Could not fetch membership types:', typesError.message);
        }

        return {
            byTier: membershipsByTier.map(item => ({
                tier: item.tier || 'unknown',
                count: parseInt(item.count) || 0
            })),
            byStatus: membershipsByStatus.map(item => ({
                status: item.status || 'unknown',
                count: parseInt(item.count) || 0
            })),
            byMonth: membershipCardsByMonth.map(item => ({
                year: parseInt(item.year),
                month: parseInt(item.month),
                count: parseInt(item.count) || 0,
                label: `${item.month}/${item.year}`
            })),
            summary: {
                total: totalMemberships, // Total user membership cards
                active: activeMemberships,
                expired: expiredMemberships,
                membershipTypes: totalMembershipTypes // Total membership types in catalog
            }
        };
    } catch (error) {
        console.error('❌ [Dashboard] Error in _getMembershipsAnalytics:', error);
        // Return empty structure to prevent breaking the API
        return {
            byTier: [],
            byStatus: [],
            byMonth: [],
            summary: {
                total: 0,
                active: 0,
                expired: 0,
                membershipTypes: 0
            }
        };
    }
}

// @desc    Get recent activities
// @route   GET /api/dashboard/recent-activities
// @access  Private (super_admin, admin, reservations)
exports.getRecentActivities = asyncHandler(async (req, res) => {
    const { limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const role = req.user?.role || 'guest';
    const userId = req.user?.id || null;
    const privilegedRoles = ['super_admin', 'admin', 'reservations'];
    const isPrivileged = privilegedRoles.includes(role);

    const bookingQuery = Booking.query()
        .orderBy('created_at', 'desc')
        .limit(limitNum)
        .withGraphFetched('user(selectBasicInfo)')
        .modifiers({
            selectBasicInfo(builder) {
                builder.select('id', 'name', 'email');
            }
        });
    if (!isPrivileged && userId) {
        bookingQuery.where('user_id', userId);
    }

    const reviewQuery = Review.query()
        .orderBy('created_at', 'desc')
        .limit(limitNum)
        .withGraphFetched('[user(selectBasicInfo), package(selectBasicInfo)]')
        .modifiers({
            selectBasicInfo(builder) {
                builder.select('id', 'name');
            }
        });
    if (!isPrivileged && userId) {
        reviewQuery.where('user_id', userId);
    }

    const transactionQuery = Transaction.query()
        .orderBy('created_at', 'desc')
        .limit(limitNum)
        .withGraphFetched('user(selectBasicInfo)')
        .modifiers({
            selectBasicInfo(builder) {
                builder.select('id', 'name', 'email');
            }
        });
    if (!isPrivileged && userId) {
        transactionQuery.where('user_id', userId);
    }

    const [recentBookings, recentReviews, recentTransactions] = await Promise.all([
        bookingQuery,
        reviewQuery,
        transactionQuery
    ]);

    const timeline = [
        ...recentBookings.map(item => ({
            id: `booking_${item.id}`,
            type: 'booking',
            title: `حجز #${item.reference_code || item.booking_code || item.id}`,
            description: `الحالة: ${item.status} • القيمة: ${item.total_price || 0}`,
            created_at: item.created_at,
            metadata: {
                customer: item.user ? { id: item.user.id, name: item.user.name } : null
            }
        })),
        ...recentReviews.map(item => ({
            id: `review_${item.id}`,
            type: 'review',
            title: `مراجعة ${item.rating || ''}★`,
            description: item.package
                ? `${item.user?.name || 'عميل'} قيّم ${item.package.name}`
                : item.comment || '',
            created_at: item.created_at,
            metadata: {
                customer: item.user ? { id: item.user.id, name: item.user.name } : null,
                package: item.package ? { id: item.package.id, name: item.package.name } : null
            }
        })),
        ...recentTransactions.map(item => ({
            id: `transaction_${item.id}`,
            type: 'transaction',
            title: item.type === 'membership_purchase' ? 'دفع عضوية' : 
                   item.type === 'booking_payment' ? 'دفع حجز' : 
                   `معاملة ${item.type}`,
            description: `القيمة: ${Math.abs(item.amount || 0)} ${item.currency || 'EGP'} • الحالة: ${item.status || 'pending'}`,
            created_at: item.created_at,
            metadata: {
                customer: item.user ? { id: item.user.id, name: item.user.name } : null,
                payment_method: item.payment_method || 'unknown',
                reference_id: item.reference_id || null
            }
        }))
    ]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limitNum);

    res.json({
        success: true,
        data: timeline,
        meta: {
            scope: isPrivileged ? 'global' : 'personal',
            totals: {
                bookings: recentBookings.length,
                reviews: recentReviews.length,
                transactions: recentTransactions.length
            }
        }
    });
});