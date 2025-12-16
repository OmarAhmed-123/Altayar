const asyncHandler = require('express-async-handler');
const Trip = require('../models/Trip');

const normalizeStringArray = (value) => {
    if (!Array.isArray(value)) return [];
    return [...new Set(value
        .map(item => typeof item === 'string' ? item.trim() : '')
        .filter(Boolean))];
};

const normalizeDetails = (rawDetails) => {
    if (!rawDetails) return {};
    if (typeof rawDetails === 'string') {
        try {
            const parsed = JSON.parse(rawDetails);
            return typeof parsed === 'object' && parsed !== null ? parsed : {};
        } catch (error) {
            return {};
        }
    }
    if (typeof rawDetails === 'object') {
        return rawDetails;
    }
    return {};
};

const deriveDestinationsFromDetails = (details) => {
    if (!details || typeof details !== 'object') return [];
    const days = Array.isArray(details.days) ? details.days : [];
    return normalizeStringArray(days.map(day => day?.destination).filter(Boolean));
};

const parseDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// @desc    Customer creates/saves a trip draft
// @route   POST /api/trips
// @access  Private (Customer)
exports.createTrip = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        startDate,
        endDate,
        destinations,
        details,
        isPublic
    } = req.body;

    const normalizedTitle = typeof title === 'string' ? title.trim() : '';
    if (!normalizedTitle) {
        res.status(400);
        throw new Error('Title is required.');
    }

    const normalizedDetails = normalizeDetails(details);
    let resolvedDestinations = normalizeStringArray(destinations);
    if (resolvedDestinations.length === 0) {
        resolvedDestinations = deriveDestinationsFromDetails(normalizedDetails);
    }

    if (resolvedDestinations.length === 0) {
        res.status(400);
        throw new Error('Please provide at least one destination for the trip.');
    }

    const trip = await Trip.query().insert({
        user_id: req.user.id,
        title: normalizedTitle,
        description: typeof description === 'string' ? description.trim() : null,
        start_date: parseDate(startDate),
        end_date: parseDate(endDate),
        destinations: resolvedDestinations,
        details: normalizedDetails,
        is_public: Boolean(isPublic),
        status: 'draft'
    });
    res.status(200).json(trip);
});

// @desc    Get user's own trips
// @route   GET /api/trips/my
// @access  Private (Customer)
exports.getMyTrips = asyncHandler(async (req, res) => {
    const trips = await Trip.query()
        .where('user_id', req.user.id)
        .orderBy('created_at', 'desc');
    res.json(trips);
});

// @desc    Update trip status (e.g., submitted, approved)
// @route   PUT /api/trips/status/:id
// @access  Private/Admin/Reservations
exports.updateTripStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const updatedTrip = await Trip.query().patchAndFetchById(req.params.id, { status });

    if (updatedTrip) {
        res.json(updatedTrip);
    } else {
        res.status(404);
        throw new Error('Trip not found');
    }
});

// @desc    Update trip data (Customer)
// @route   PUT /api/trips/:id
// @access  Private (Customer can update their own trips)
exports.updateTrip = asyncHandler(async (req, res) => {
    const { title, description, startDate, endDate, destinations, isPublic } = req.body;
    const trip = await Trip.query().findById(req.params.id);

    if (!trip) {
        res.status(404);
        throw new Error('Trip not found');
    }

    // Check if user owns the trip
    if (trip.user_id !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this trip');
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.start_date = startDate;
    if (endDate !== undefined) updateData.end_date = endDate;
    if (destinations !== undefined) updateData.destinations = destinations;
    if (isPublic !== undefined) updateData.is_public = isPublic;

    const updatedTrip = await trip.$query().patchAndFetch(updateData);
    res.json(updatedTrip);
});

// @desc    Delete trip (Customer)
// @route   DELETE /api/trips/:id
// @access  Private (Customer can delete their own trips)
exports.deleteTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.query().findById(req.params.id);

    if (!trip) {
        res.status(404);
        throw new Error('Trip not found');
    }

    // Check if user owns the trip
    if (trip.user_id !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to delete this trip');
    }

    await trip.$query().delete();
    res.json({ success: true, message: 'Trip deleted successfully' });
});

// @desc    Get all submitted trips (Admin Dashboard)
// @route   GET /api/trips/admin
// @access  Private/Admin/Reservations
exports.getAllTripsAdmin = asyncHandler(async (req, res) => {
    const trips = await Trip.query()
        .whereIn('status', ['submitted', 'approved', 'rejected'])
        .withGraphFetched('user(selectNameAndEmail)')
        .modifiers({
            selectNameAndEmail(builder) {
                builder.select('name', 'email');
            }
        });
    res.json(trips);
});