// File: controllers/bookingController.js
const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const { transaction } = require('objection');

// @desc    Create a new booking/order
// @route   POST /api/bookings
// @access  Private (Customer)
exports.createBooking = asyncHandler(async (req, res) => {
  const { bookingType, details, totalPrice } = req.body;

  if (!bookingType || !details || totalPrice === undefined) {
    res.status(400);
    throw new Error('Please include bookingType, details, and totalPrice.');
  }

  // CRITICAL FIX: Validate and normalize booking_type
  // Allowed values: 'tour', 'nile_cruise', 'flight_ticket', 'hotel_booking', 'transfer', 'nile_trip', 'general_tour', 'package'
  const allowedBookingTypes = [
    'tour', 
    'nile_cruise', 
    'flight_ticket', 
    'hotel_booking', 
    'transfer', 
    'nile_trip', 
    'general_tour',
    'package' // Added to support package bookings
  ];

  // Normalize booking type (convert to lowercase, trim)
  let normalizedBookingType = String(bookingType).toLowerCase().trim();

  // CRITICAL FIX: Handle 'package' booking type
  // If 'package' is not in enum yet, we'll try to use it first, and fallback to 'tour' if it fails
  // This ensures compatibility both before and after migration is applied
  const originalBookingType = normalizedBookingType;
  if (normalizedBookingType === 'package') {
    // Try to use 'package' first (if migration has been applied)
    // If it fails, we'll catch the error and use 'tour' as fallback
    console.log(`[Booking] Attempting to use booking type "package"`);
  }

  // Validate booking type
  if (!allowedBookingTypes.includes(normalizedBookingType)) {
    res.status(400);
    throw new Error(
      `Invalid booking type: "${bookingType}". Allowed types: ${allowedBookingTypes.join(', ')}`
    );
  }

  // Use a transaction to ensure both booking and transaction are created
  let newBooking;
  try {
    newBooking = await transaction(Booking.knex(), async (trx) => {
      const booking = await Booking.query(trx).insert({
        user_id: req.user.id,
        booking_type: normalizedBookingType, // Use normalized value
        details,
        total_price: totalPrice,
        invoice_id: `INV-${Date.now()}-${req.user.id.toString().slice(-4)}`
      });

      await Transaction.query(trx).insert({
        user_id: req.user.id,
        type: 'booking_payment',
        amount: -totalPrice, // Negative for payment
        related_booking_id: booking.id,
        description: `Payment for ${originalBookingType} booking.`,
      });

      return booking;
    });
  } catch (error) {
    // CRITICAL FIX: If 'package' type fails due to constraint violation, fallback to 'tour'
    if (normalizedBookingType === 'package' && 
        error.message && 
        error.message.includes('bookings_booking_type_check')) {
      console.log(`[Booking] 'package' type not supported yet, falling back to 'tour'`);
      normalizedBookingType = 'tour';
      
      // Retry with 'tour' type
      newBooking = await transaction(Booking.knex(), async (trx) => {
        const booking = await Booking.query(trx).insert({
          user_id: req.user.id,
          booking_type: normalizedBookingType, // Use 'tour' as fallback
          details: {
            ...details,
            originalBookingType: originalBookingType, // Preserve original type in details
            mappedTo: 'tour' // Indicate that it was mapped
          },
          total_price: totalPrice,
          invoice_id: `INV-${Date.now()}-${req.user.id.toString().slice(-4)}`
        });

        await Transaction.query(trx).insert({
          user_id: req.user.id,
          type: 'booking_payment',
          amount: -totalPrice,
          related_booking_id: booking.id,
          description: `Payment for ${originalBookingType} booking (mapped to tour).`,
        });

        return booking;
      });
    } else {
      // Re-throw other errors
      throw error;
    }
  }

  res.status(200).json(newBooking);
});

// @desc    Get all bookings (Admin/Staff Dashboard)
// @route   GET /api/bookings/admin
// @access  Private/Admin/Reservations
exports.getAllBookingsAdmin = asyncHandler(async (req, res) => {
  const bookings = await Booking.query()
    .withGraphFetched('user(selectNameAndEmail)')
    .modifiers({
        selectNameAndEmail(builder) {
            builder.select('name', 'email', 'role');
        }
    });
  res.json(bookings);
});

// @desc    Get user's own booking history (Activities)
// @route   GET /api/bookings/myactivities
// @access  Private (Customer)
exports.getMyActivities = asyncHandler(async (req, res) => {
  const activities = await Booking.query().where('user_id', req.user.id).orderBy('created_at', 'desc');
  res.json(activities);
});

// @desc    Get a single booking by ID
// @route   GET /api/bookings/:id
// @access  Private (Customer can see their own, Admin can see any)
exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.query()
    .findById(req.params.id)
    .withGraphFetched('user(selectNameAndEmail)')
    .modifiers({
      selectNameAndEmail(builder) {
        builder.select('name', 'email');
      }
    });

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check if user owns the booking or is admin/agent
  if (booking.user_id !== req.user.id && !['super_admin', 'admin', 'reservations', 'accountant', 'agent'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Not authorized to view this booking');
  }

  res.json(booking);
});

// @desc    Update booking status (Admin/Reservations)
// @route   PUT /api/bookings/:id
// @access  Private/Admin/Reservations
exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.query().findById(req.params.id);

  if (booking) {
    const updatedBooking = await booking.$query().patchAndFetch({ status });
    res.json(updatedBooking);
  } else {
    res.status(404);
    throw new Error('Booking not found');
  }
});

// @desc    Create booking by Admin (Admin can create booking for any user)
// @route   POST /api/bookings/admin
// @access  Private/Admin/SuperAdmin
exports.createBookingByAdmin = asyncHandler(async (req, res) => {
  const { bookingType, details, totalPrice, userId, customerName, customerEmail } = req.body;

  if (!bookingType || !details || totalPrice === undefined) {
    res.status(400);
    throw new Error('Please include bookingType, details, and totalPrice.');
  }

  // Validate booking type
  const allowedBookingTypes = [
    'tour', 
    'nile_cruise', 
    'flight_ticket', 
    'hotel_booking', 
    'transfer', 
    'nile_trip', 
    'general_tour',
    'package'
  ];

  let normalizedBookingType = String(bookingType).toLowerCase().trim();
  if (!allowedBookingTypes.includes(normalizedBookingType)) {
    res.status(400);
    throw new Error(
      `Invalid booking type: "${bookingType}". Allowed types: ${allowedBookingTypes.join(', ')}`
    );
  }

  // Determine user_id: use provided userId or default to admin's id
  const targetUserId = userId || req.user.id;

  // Use a transaction to ensure both booking and transaction are created
  const newBooking = await transaction(Booking.knex(), async (trx) => {
    const booking = await Booking.query(trx).insert({
      user_id: targetUserId,
      booking_type: normalizedBookingType,
      details: typeof details === 'string' ? JSON.parse(details) : details,
      total_price: totalPrice,
      invoice_id: `INV-${Date.now()}-${targetUserId.toString().slice(-4)}`,
      status: 'pending', // Default status for admin-created bookings
    });

    // Optionally create transaction (can be skipped for admin-created bookings)
    // await Transaction.query(trx).insert({
    //   user_id: targetUserId,
    //   type: 'booking_payment',
    //   amount: -totalPrice,
    //   related_booking_id: booking.id,
    //   description: `Admin-created booking for ${normalizedBookingType}.`,
    // });

    return booking;
  });

  // Fetch booking with user details
  const bookingWithUser = await Booking.query()
    .findById(newBooking.id)
    .withGraphFetched('user(selectNameAndEmail)')
    .modifiers({
      selectNameAndEmail(builder) {
        builder.select('name', 'email');
      }
    });

  res.status(200).json(bookingWithUser);
});

// @desc    Delete booking (Admin/SuperAdmin only)
// @route   DELETE /api/bookings/:id
// @access  Private/Admin/SuperAdmin
exports.deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.query().findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Delete related transactions first
  await Transaction.query()
    .where('related_booking_id', booking.id)
    .delete();

  // Delete the booking
  await Booking.query().deleteById(req.params.id);

  res.json({ 
    success: true,
    message: 'Booking deleted successfully',
    deletedId: req.params.id
  });
});