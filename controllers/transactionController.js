const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const { db } = require('../config/db');

// @desc    Get transaction history for the current user
// @route   GET /api/transactions
// @access  Private
exports.getUserTransactions = asyncHandler(async (req, res) => {
    const transactions = await Transaction.query()
        .where('user_id', req.user.id)
        .orderBy('created_at', 'desc')
        .limit(50);
    res.json(transactions);
});

// @desc    Get all transactions (Admin View)
// @route   GET /api/transactions/all
// @access  Private (Admin, Accountant)
exports.getAllTransactions = asyncHandler(async (req, res) => {
    const transactions = await Transaction.query()
        .withGraphFetched('user(selectNameAndEmail)')
        .modifiers({
            selectNameAndEmail(builder) {
                builder.select('name', 'email');
            }
        })
        .orderBy('created_at', 'desc');
    res.json(transactions);
});

// @desc    Generate a specific invoice for a booking
// @route   GET /api/reports/invoice/:bookingId
// @access  Private (Admin, Accountant, Sales)
exports.generateInvoice = asyncHandler(async (req, res) => {
    try {
        const Package = require('../models/Package');
        const User = require('../models/User');
        
        const bookingId = parseInt(req.params.bookingId);
        if (isNaN(bookingId) || bookingId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID. Please provide a valid booking ID.',
                error: 'Invalid booking ID format'
            });
        }

        // CRITICAL FIX: Enhanced booking fetch with better error handling
        // Try multiple approaches to find the booking
        let booking = null;
        
        try {
            // First attempt: Standard query with graph fetch
            booking = await Booking.query()
                .findById(bookingId)
                .withGraphFetched('[user(selectNameAndEmail), transaction]')
                .modifiers({
                    selectNameAndEmail(builder) {
                        builder.select('id', 'name', 'email');
                    }
                });
        } catch (queryError) {
            console.warn('⚠️ [Invoice] First booking query failed:', queryError.message);
            
            // Fallback: Try without graph fetch
            try {
                booking = await Booking.query().findById(bookingId);
                if (booking) {
                    // Manually fetch user if needed
                    if (booking.user_id) {
                        try {
                            booking.user = await User.query()
                                .findById(booking.user_id)
                                .select('id', 'name', 'email');
                        } catch (userError) {
                            console.warn('⚠️ [Invoice] Could not fetch user:', userError.message);
                            booking.user = { name: 'User', email: null };
                        }
                    }
                }
            } catch (fallbackError) {
                console.error('❌ [Invoice] Fallback query also failed:', fallbackError.message);
            }
        }

        if (!booking) {
            // Check if booking exists at all (for better error message)
            const bookingExists = await Booking.query()
                .where('id', bookingId)
                .resultSize();
            
            if (bookingExists === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Booking with ID ${bookingId} not found. Please verify the booking ID and try again.`,
                    error: 'Booking not found',
                    bookingId: bookingId
                });
            } else {
                // Booking exists but couldn't be fetched properly
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching booking data. Please try again later.',
                    error: 'Database query error',
                    bookingId: bookingId
                });
            }
        }

        // Get user details if not loaded
        let user = booking.user;
        if (!user && booking.user_id) {
            try {
                // CRITICAL FIX: Remove 'phone', 'first_name', 'last_name', and 'address' columns - they don't exist in users table
                user = await User.query()
                    .findById(booking.user_id)
                    .select('id', 'name', 'email')
                    .first();
                
                if (!user) {
                    console.warn(`⚠️ [Invoice] User ${booking.user_id} not found for booking ${bookingId}`);
                    user = { id: booking.user_id, name: 'Unknown User', email: null };
                }
            } catch (error) {
                console.error('❌ [Invoice] Error fetching user:', error.message);
                // CRITICAL FIX: Remove phone from default user object
                user = { id: booking.user_id || null, name: 'Unknown User', email: null };
            }
        } else if (!user) {
            // No user_id in booking
            console.warn(`⚠️ [Invoice] Booking ${bookingId} has no user_id`);
            user = { id: null, name: 'Unknown User', email: null };
        }

        // Get package details if packageId exists
        let packageData = null;
        const packageId = booking.details?.packageId || booking.details?.package_id;
        if (packageId) {
            try {
                packageData = await Package.query().findById(packageId);
            } catch (error) {
                console.error('Error fetching package:', error);
                packageData = null;
            }
        }

        // Generate invoice number if not exists
        const invoiceNumber = booking.invoice_id || `EIN_${String(booking.id).padStart(6, '0')}`;
        
        // Calculate dates dynamically
        const invoiceDate = new Date(booking.created_at || new Date());
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30); // 30 days from invoice date

        // Calculate number of days dynamically from startDate and endDate
        let numberOfDays = 1;
        let startDate = null;
        let endDate = null;
        
        if (booking.details?.startDate && booking.details?.endDate) {
            startDate = new Date(booking.details.startDate);
            endDate = new Date(booking.details.endDate);
            
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
                const timeDiff = endDate.getTime() - startDate.getTime();
                numberOfDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
            }
        } else if (packageData?.days) {
            numberOfDays = packageData.days;
        }

        // Calculate pricing dynamically
        const participants = booking.details?.participants || 1;
        let basePrice = 0;
        let dailyRate = 0;
        let totalPrice = booking.total_price || 0;

        // If package exists, use package pricing
        if (packageData) {
            basePrice = packageData.price || 0;
            // Calculate daily rate if package has days
            if (packageData.days && packageData.days > 0) {
                dailyRate = basePrice / packageData.days;
            } else {
                dailyRate = basePrice;
            }
            // Calculate total: (daily rate * number of days) * participants
            totalPrice = (dailyRate * numberOfDays) * participants;
        } else if (booking.total_price) {
            // Use booking total_price if available
            totalPrice = booking.total_price;
            // Calculate daily rate from total
            if (numberOfDays > 0) {
                dailyRate = totalPrice / (numberOfDays * participants);
            }
        } else {
            // Fallback: use a default calculation
            dailyRate = 100; // Default daily rate
            totalPrice = dailyRate * numberOfDays * participants;
        }

        // Format user name
        let userName = 'User';
        if (user.first_name || user.last_name) {
            userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        } else if (user.name) {
            userName = user.name;
        }

        // Build service description
        const serviceName = packageData?.name || booking.booking_type || 'Service';
        const serviceDescription = packageData?.description || 
            `${serviceName} - ${numberOfDays} ${numberOfDays === 1 ? 'day' : 'days'} for ${participants} ${participants === 1 ? 'participant' : 'participants'}`;

        // Build invoice data with dynamic calculations
        const invoiceData = {
            invoiceNumber,
            invoiceDate: invoiceDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            dueDate: dueDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            user: {
                name: userName,
                email: user.email || null,
                // CRITICAL FIX: Remove phone and address - columns don't exist in users table
                // phone: user.phone || null, // Removed - column doesn't exist
                // address: user.address || null, // Removed - column doesn't exist
            },
            booking: {
                id: booking.id,
                bookingType: booking.booking_type,
                status: booking.status,
                totalPrice: totalPrice,
                participants: participants,
                startDate: booking.details?.startDate || null,
                endDate: booking.details?.endDate || null,
                numberOfDays: numberOfDays,
                specialRequests: booking.details?.specialRequests || null,
            },
            package: packageData ? {
                id: packageData.id,
                name: packageData.name,
                description: packageData.description,
                price: packageData.price,
                days: packageData.days,
                nights: packageData.nights,
            } : null,
            services: [
                {
                    name: serviceName,
                    description: serviceDescription,
                    quantity: numberOfDays, // Number of days
                    rate: dailyRate, // Daily rate per participant
                    adjustment: 0,
                    total: dailyRate * numberOfDays * participants, // Total for all days and participants
                },
            ],
            subtotal: totalPrice,
            total: totalPrice,
            terms: 'Payment is due within 30 days from date of invoice. All prices are in EGP.',
            createdAt: booking.created_at,
        };

        res.json({
            success: true,
            ...invoiceData, // Spread for direct access
            data: invoiceData, // Also include in data field
            booking: booking, // Include full booking for backward compatibility
        });
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error generating invoice',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});

// @desc    Get sales and revenue reports
// @route   GET /api/reports/sales
// @access  Private (Admin, Accountant)
exports.getSalesReports = asyncHandler(async (req, res) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalRevenueResult = await Transaction.query()
        .where('type', 'booking_payment')
        .sum('amount as total');
        
    const recentBookingsCount = await Booking.query()
        .where('created_at', '>=', thirtyDaysAgo)
        .resultSize();

    const report = {
        totalRevenue: Math.abs(parseFloat(totalRevenueResult[0].total) || 0),
        newBookingsLast30Days: recentBookingsCount,
        reportGeneratedAt: new Date().toISOString()
    };
    
    res.json(report);
});

// @desc    Get payment history overview
// @route   GET /api/reports/payment-history
// @access  Private (Admin, Accountant)
exports.getPaymentHistory = asyncHandler(async (req, res) => {
    const { limit = 100, offset = 0, search, type } = req.query;
    const limitNum = Math.min(parseInt(limit) || 100, 500);
    const offsetNum = parseInt(offset) || 0;

    let query = Transaction.query()
        .withGraphFetched('user(selectNameAndEmail)')
        .modifiers({
            selectNameAndEmail(builder) {
                builder.select('id', 'name', 'email');
            }
        })
        .orderBy('created_at', 'desc');

    // Apply search filter if provided
    if (search && search.trim()) {
        query.whereExists(function() {
            this.select('*')
                .from('users')
                .whereRaw('users.id = transactions.user_id')
                .where(function() {
                    this.where('users.name', 'ilike', `%${search}%`)
                        .orWhere('users.email', 'ilike', `%${search}%`);
                });
        });
    }

    // Apply type filter if provided
    if (type && type.trim()) {
        query.where('type', type);
    }

    const [recentPayments, total] = await Promise.all([
        query.clone().limit(limitNum).offset(offsetNum),
        query.clone().resultSize()
    ]);

    // Format response for frontend
    const formattedPayments = recentPayments.map(transaction => ({
        id: transaction.id,
        userName: transaction.user?.name || 'مستخدم غير معروف',
        userEmail: transaction.user?.email || '',
        type: transaction.type,
        amount: Math.abs(parseFloat(transaction.amount) || 0),
        status: transaction.status || 'pending',
        bookingId: transaction.booking_id || null,
        createdAt: transaction.created_at,
        currency: transaction.currency || 'EGP',
        description: transaction.description || '',
    }));

    res.json({
        success: true,
        data: formattedPayments,
        meta: {
            total,
            limit: limitNum,
            offset: offsetNum,
            hasMore: offsetNum + limitNum < total
        }
    });
});