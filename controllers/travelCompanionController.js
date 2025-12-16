const asyncHandler = require('express-async-handler');
const Itinerary = require('../models/Itinerary');
const TravelDocument = require('../models/TravelDocument');
const Booking = require('../models/Booking');
const upload = require('../middleware/uploadMiddleware');

// @desc    Create itinerary from booking
// @route   POST /api/travel-companion/itinerary/from-booking/:bookingId
// @access  Private
exports.createItineraryFromBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { title, description, startDate, endDate, activities, accommodations, transportation, emergencyContacts, checklist } = req.body;

  const itinerary = await Itinerary.createFromBooking(bookingId, req.user.id, {
    title,
    description,
    start_date: startDate,
    end_date: endDate,
    activities,
    accommodations,
    transportation,
    emergency_contacts: emergencyContacts,
    checklist
  });

  res.status(200).json({
    success: true,
    data: itinerary,
    message: 'Itinerary created successfully'
  });
});

// @desc    Create custom itinerary
// @route   POST /api/travel-companion/itinerary
// @access  Private
exports.createCustomItinerary = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, destinations, activities, accommodations, transportation, emergencyContacts, checklist } = req.body;

  const shareCode = await Itinerary.generateShareCode();

  const itinerary = await Itinerary.query().insert({
    user_id: req.user.id,
    title,
    description,
    start_date: startDate,
    end_date: endDate,
    destinations: destinations || [],
    activities: activities || [],
    accommodations: accommodations || [],
    transportation: transportation || [],
    documents: [],
    emergency_contacts: emergencyContacts || [],
    checklist: checklist || [],
    share_code: shareCode
  });

  res.status(200).json({
    success: true,
    data: itinerary,
    message: 'Custom itinerary created successfully'
  });
});

// @desc    Get user's itineraries
// @route   GET /api/travel-companion/itineraries
// @access  Private
exports.getUserItineraries = asyncHandler(async (req, res) => {
  const { status, limit = 20, page = 1 } = req.query;
  
  let query = Itinerary.query()
    .where('user_id', req.user.id)
    .withGraphFetched('documents')
    .orderBy('start_date', 'desc');

  if (status === 'upcoming') {
    query = query.where('start_date', '>', new Date());
  } else if (status === 'past') {
    query = query.where('end_date', '<', new Date());
  } else if (status === 'current') {
    query = query.where('start_date', '<=', new Date())
                 .where('end_date', '>=', new Date());
  }

  const itineraries = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));

  res.json({
    success: true,
    data: itineraries.map(itinerary => itinerary.getSummary()),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});

// @desc    Get itinerary details
// @route   GET /api/travel-companion/itinerary/:id
// @access  Private
exports.getItineraryDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const itinerary = await Itinerary.query()
    .findById(id)
    .where('user_id', req.user.id)
    .withGraphFetched('[documents, booking]')
    .first();

  if (!itinerary) {
    res.status(404);
    throw new Error('Itinerary not found');
  }

  res.json({
    success: true,
    data: itinerary
  });
});

// @desc    Update itinerary
// @route   PUT /api/travel-companion/itinerary/:id
// @access  Private
exports.updateItinerary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const itinerary = await Itinerary.query()
    .findById(id)
    .where('user_id', req.user.id)
    .first();

  if (!itinerary) {
    res.status(404);
    throw new Error('Itinerary not found');
  }

  const updatedItinerary = await itinerary.$query().patchAndFetch(updateData);

  res.json({
    success: true,
    data: updatedItinerary,
    message: 'Itinerary updated successfully'
  });
});

// @desc    Share itinerary
// @route   PUT /api/travel-companion/itinerary/:id/share
// @access  Private
exports.shareItinerary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isShared } = req.body;

  const itinerary = await Itinerary.query()
    .findById(id)
    .where('user_id', req.user.id)
    .first();

  if (!itinerary) {
    res.status(404);
    throw new Error('Itinerary not found');
  }

  const updatedItinerary = await itinerary.$query().patch({ is_shared: isShared });

  res.json({
    success: true,
    data: {
      share_code: updatedItinerary.share_code,
      is_shared: updatedItinerary.is_shared
    },
    message: `Itinerary ${isShared ? 'shared' : 'unshared'} successfully`
  });
});

// @desc    Get shared itinerary
// @route   GET /api/travel-companion/shared/:shareCode
// @access  Public
exports.getSharedItinerary = asyncHandler(async (req, res) => {
  const { shareCode } = req.params;

  const itinerary = await Itinerary.getSharedItinerary(shareCode);

  if (!itinerary) {
    res.status(404);
    throw new Error('Shared itinerary not found');
  }

  res.json({
    success: true,
    data: itinerary
  });
});

// @desc    Update checklist item
// @route   PUT /api/travel-companion/itinerary/:id/checklist/:itemId
// @access  Private
exports.updateChecklistItem = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;
  const { completed } = req.body;

  const itinerary = await Itinerary.query()
    .findById(id)
    .where('user_id', req.user.id)
    .first();

  if (!itinerary) {
    res.status(404);
    throw new Error('Itinerary not found');
  }

  const updatedChecklist = await itinerary.updateChecklist(itemId, completed);

  res.json({
    success: true,
    data: updatedChecklist,
    message: 'Checklist item updated successfully'
  });
});

// @desc    Upload travel document
// @route   POST /api/travel-companion/itinerary/:id/documents
// @access  Private
exports.uploadTravelDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { documentType, documentName, expiryDate, metadata } = req.body;

  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const itinerary = await Itinerary.query()
    .findById(id)
    .where('user_id', req.user.id)
    .first();

  if (!itinerary) {
    res.status(404);
    throw new Error('Itinerary not found');
  }

  const document = await itinerary.addDocument({
    document_type: documentType,
    document_name: documentName,
    file_path: req.file.path,
    file_type: req.file.mimetype,
    file_size: req.file.size,
    metadata: metadata || {},
    expiry_date: expiryDate ? new Date(expiryDate) : null
  });

  res.status(200).json({
    success: true,
    data: document,
    message: 'Document uploaded successfully'
  });
});

// @desc    Get travel documents
// @route   GET /api/travel-companion/documents
// @access  Private
exports.getTravelDocuments = asyncHandler(async (req, res) => {
  const { type, status } = req.query;

  let documents;

  if (type) {
    documents = await TravelDocument.getByType(req.user.id, type);
  } else if (status === 'expiring') {
    documents = await TravelDocument.getExpiringDocuments(req.user.id);
  } else if (status === 'expired') {
    documents = await TravelDocument.getExpiredDocuments(req.user.id);
  } else {
    documents = await TravelDocument.query()
      .where('user_id', req.user.id)
      .withGraphFetched('itinerary(selectBasicInfo)')
      .modifiers({
        selectBasicInfo(builder) {
          builder.select('id', 'title', 'start_date', 'end_date');
        }
      })
      .orderBy('created_at', 'desc');
  }

  // Add status to each document
  const documentsWithStatus = documents.map(doc => ({
    ...doc,
    status: doc.getStatus(),
    is_expiring_soon: doc.isExpiringSoon(),
    is_expired: doc.isExpired()
  }));

  res.json({
    success: true,
    data: documentsWithStatus
  });
});

// @desc    Delete travel document
// @route   DELETE /api/travel-companion/documents/:id
// @access  Private
exports.deleteTravelDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const document = await TravelDocument.query()
    .findById(id)
    .where('user_id', req.user.id)
    .first();

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Remove from itinerary documents array
  const itinerary = await Itinerary.query().findById(document.itinerary_id);
  if (itinerary) {
    const documents = itinerary.documents || [];
    const updatedDocuments = documents.filter(doc => doc.id !== parseInt(id));
    await itinerary.$query().patch({ documents: updatedDocuments });
  }

  await TravelDocument.query().deleteById(id);

  res.json({
    success: true,
    message: 'Document deleted successfully'
  });
});

// @desc    Get travel companion dashboard
// @route   GET /api/travel-companion/dashboard
// @access  Private
exports.getTravelCompanionDashboard = asyncHandler(async (req, res) => {
  // Get upcoming trips
  const upcomingTrips = await Itinerary.query()
    .where('user_id', req.user.id)
    .where('start_date', '>', new Date())
    .orderBy('start_date', 'asc')
    .limit(3);

  // Get expiring documents
  const expiringDocuments = await TravelDocument.getExpiringDocuments(req.user.id, 30);

  // Get recent documents
  const recentDocuments = await TravelDocument.query()
    .where('user_id', req.user.id)
    .orderBy('created_at', 'desc')
    .limit(5);

  // Get checklist progress
  const currentTrips = await Itinerary.query()
    .where('user_id', req.user.id)
    .where('start_date', '<=', new Date())
    .where('end_date', '>=', new Date())
    .withGraphFetched('documents');

  const checklistProgress = currentTrips.map(trip => {
    const checklist = trip.checklist || [];
    const completed = checklist.filter(item => item.completed).length;
    return {
      trip_id: trip.id,
      trip_title: trip.title,
      completed,
      total: checklist.length,
      progress: checklist.length > 0 ? Math.round((completed / checklist.length) * 100) : 0
    };
  });

  res.json({
    success: true,
    data: {
      upcoming_trips: upcomingTrips.map(trip => trip.getSummary()),
      expiring_documents: expiringDocuments.map(doc => ({
        ...doc,
        status: doc.getStatus()
      })),
      recent_documents: recentDocuments,
      checklist_progress: checklistProgress
    }
  });
});
