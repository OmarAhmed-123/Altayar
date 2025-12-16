const asyncHandler = require('express-async-handler');
const Package = require('../models/Package');

// @desc    Get all active packages
// @route   GET /api/packages
// @access  Public
exports.getPackages = asyncHandler(async (req, res) => {
    const packages = await Package.query().where('is_active', true);
    res.json(packages);
});

// @desc    Get package by ID
// @route   GET /api/packages/:id
// @access  Public
exports.getPackageById = asyncHandler(async (req, res) => {
    const packageItem = await Package.query().findById(req.params.id).where('is_active', true);
    if (packageItem) {
        res.json(packageItem);
    } else {
        res.status(404);
        throw new Error('Package not found or inactive');
    }
});

// @desc    Create a new package
// @route   POST /api/packages
// @access  Private/SuperAdmin/Admin
exports.createPackage = asyncHandler(async (req, res) => {
    const { name, description, days, nights, price, services, images, isExclusive } = req.body;
    if (!name || price === undefined || !description) {
        res.status(400);
        throw new Error('Please include name, description, and price.');
    }
    const newPackage = await Package.query().insert(req.body);
    res.status(200).json(newPackage);
});

// @desc    Update a package
// @route   PUT /api/packages/:id
// @access  Private/SuperAdmin/Admin
exports.updatePackage = asyncHandler(async (req, res) => {
    // CRITICAL FIX: Remove 'title' field - packages table doesn't have 'title' column, only 'name'
    // Also handle camelCase to snake_case conversion
    const updateData = { ...req.body };
    
    // If 'title' is provided, use it as 'name' (packages table uses 'name' not 'title')
    if (updateData.title && !updateData.name) {
        updateData.name = updateData.title;
    }
    
    // Remove fields that don't exist in packages table
    delete updateData.title; // Remove 'title' - table uses 'name'
    
    // Convert camelCase to snake_case for database columns
    if (updateData.isExclusive !== undefined) {
        updateData.is_exclusive = updateData.isExclusive;
        delete updateData.isExclusive;
    }
    
    if (updateData.durationDays !== undefined) {
        // durationDays is not a column, use 'days' instead
        updateData.days = updateData.durationDays;
        delete updateData.durationDays;
    }
    
    if (updateData.durationNights !== undefined) {
        // durationNights is not a column, use 'nights' instead
        updateData.nights = updateData.durationNights;
        delete updateData.durationNights;
    }
    
    if (updateData.remainingSeats !== undefined) {
        // remainingSeats is not a column in packages table
        delete updateData.remainingSeats;
    }
    
    const updatedPackage = await Package.query().patchAndFetchById(req.params.id, updateData);
    if (updatedPackage) {
        res.json(updatedPackage);
    } else {
        res.status(404);
        throw new Error('Package not found');
    }
});

// @desc    Delete a package
// @route   DELETE /api/packages/:id
// @access  Private/SuperAdmin
exports.deletePackage = asyncHandler(async (req, res) => {
    const numDeleted = await Package.query().deleteById(req.params.id);
    if (numDeleted) {
        res.json({ message: 'Package removed' });
    } else {
        res.status(404);
        throw new Error('Package not found');
    }
});

// @desc    Get bookings related to a package
// @route   GET /api/packages/:id/bookings
// @access  Private (super_admin, admin, accountant)
exports.getPackageBookings = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const Booking = require('../models/Booking');
    const User = require('../models/User');
    const { db } = require('../config/db');

    // Verify package exists
    const packageItem = await Package.query().findById(id);
    if (!packageItem) {
        return res.status(404).json({
            success: false,
            message: 'Package not found'
        });
    }

    // CRITICAL FIX: bookings table doesn't have 'package_id' column
    // Package bookings are stored in 'details' JSONB field or identified by booking_type = 'package'
    // Search for bookings where booking_type = 'package' AND package_id is in details JSONB
    
    const packageIdStr = String(id);
    let bookings = [];
    
    try {
        // Get all bookings for this package using JSONB query
        // Search in details JSONB field for package_id (multiple possible field names)
        bookings = await Booking.query()
            .where('booking_type', 'package')
            .where(function() {
                // Try different possible field names in JSONB
                this.whereRaw(`details->>'package_id' = ?`, [packageIdStr])
                    .orWhereRaw(`details->>'packageId' = ?`, [packageIdStr])
                    .orWhereRaw(`details->>'id' = ?`, [packageIdStr])
                    .orWhereRaw(`CAST(details->>'package_id' AS INTEGER) = ?`, [parseInt(id)])
                    .orWhereRaw(`CAST(details->>'packageId' AS INTEGER) = ?`, [parseInt(id)]);
            })
            .withGraphFetched('user(selectNameAndEmail)')
            .modifiers({
                selectNameAndEmail(builder) {
                    builder.select('id', 'name', 'email');
                }
            })
            .orderBy('created_at', 'desc');
    } catch (queryError) {
        console.warn('⚠️ [Package] Error fetching bookings:', queryError.message);
        // If JSONB query fails, try simpler approach
        try {
            bookings = await Booking.query()
                .where('booking_type', 'package')
                .whereRaw(`details::text LIKE ?`, [`%"package_id":${id}%`])
                .orWhereRaw(`details::text LIKE ?`, [`%"packageId":${id}%`])
                .withGraphFetched('user(selectNameAndEmail)')
                .modifiers({
                    selectNameAndEmail(builder) {
                        builder.select('id', 'name', 'email');
                    }
                })
                .orderBy('created_at', 'desc');
        } catch (fallbackError) {
            console.error('❌ [Package] Error in fallback query:', fallbackError.message);
            bookings = []; // Return empty array if all queries fail
        }
    }

    // Separate bookings by status
    const completedBookings = bookings.filter(b => 
        b.status === 'completed' || b.status === 'paid'
    );
    const pendingBookings = bookings.filter(b => 
        b.status === 'pending' || b.status === 'confirmed'
    );

    res.json({
        success: true,
        data: {
            package: {
                id: packageItem.id,
                name: packageItem.name || packageItem.title,
            },
            summary: {
                totalBookings: bookings.length,
                completedBookings: completedBookings.length,
                pendingBookings: pendingBookings.length,
            },
            bookings: bookings.map(b => ({
                id: b.id,
                userId: b.user_id,
                userName: b.user?.name || 'Unknown',
                userEmail: b.user?.email || '',
                status: b.status,
                totalPrice: b.total_price,
                bookingType: b.booking_type,
                createdAt: b.created_at,
            })),
            completedBookings: completedBookings.map(b => ({
                id: b.id,
                userId: b.user_id,
                userName: b.user?.name || 'Unknown',
                userEmail: b.user?.email || '',
                status: b.status,
                totalPrice: b.total_price,
                bookingType: b.booking_type,
                createdAt: b.created_at,
            })),
        }
    });
});