const asyncHandler = require('express-async-handler');
const Partner = require('../models/Partner');
const PartnerService = require('../models/PartnerService');
const PartnerBooking = require('../models/PartnerBooking');
const User = require('../models/User');

// @desc    Apply to become a partner
// @route   POST /api/partners/apply
// @access  Public
exports.applyToBePartner = asyncHandler(async (req, res) => {
  const { 
    companyName, 
    contactPerson, 
    email, 
    phone, 
    website, 
    address, 
    businessType, 
    services 
  } = req.body;

  // Check if email already exists
  const existingPartner = await Partner.query().findOne({ email });
  if (existingPartner) {
    res.status(400);
    throw new Error('Email already registered as partner');
  }

  const partner = await Partner.query().insert({
    company_name: companyName,
    contact_person: contactPerson,
    email,
    phone,
    website,
    address,
    business_type: businessType,
    services: services || [],
    status: 'pending'
  });

  res.status(200).json({
    success: true,
    data: partner,
    message: 'Partner application submitted successfully'
  });
});

// @desc    Get all partners (Admin)
// @route   GET /api/partners
// @access  Private/Admin
exports.getPartners = asyncHandler(async (req, res) => {
  const { status, businessType, limit = 20, page = 1 } = req.query;

  let query = Partner.query()
    .withGraphFetched('approver(selectBasicInfo)')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'email');
      }
    })
    .orderBy('created_at', 'desc');

  if (status) {
    query = query.where('status', status);
  }

  if (businessType) {
    query = query.where('business_type', businessType);
  }

  const partners = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));

  res.json({
    success: true,
    data: partners,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});

// @desc    Get partner details
// @route   GET /api/partners/:id
// @access  Private/Admin
exports.getPartnerDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const partner = await Partner.query()
    .findById(id)
    .withGraphFetched('[approver(selectBasicInfo), services, bookings.user(selectBasicInfo)]')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'email');
      }
    })
    .first();

  if (!partner) {
    res.status(404);
    throw new Error('Partner not found');
  }

  const statistics = await partner.getStatistics();

  res.json({
    success: true,
    data: {
      partner,
      statistics
    }
  });
});

// @desc    Approve partner
// @route   POST /api/partners/:id/approve
// @access  Private/Admin
exports.approvePartner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const partner = await Partner.query().findById(id);
  if (!partner) {
    res.status(404);
    throw new Error('Partner not found');
  }

  const approvedPartner = await partner.approve(req.user.id);

  res.json({
    success: true,
    data: approvedPartner,
    message: 'Partner approved successfully'
  });
});

// @desc    Suspend partner
// @route   POST /api/partners/:id/suspend
// @access  Private/Admin
exports.suspendPartner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const partner = await Partner.query().findById(id);
  if (!partner) {
    res.status(404);
    throw new Error('Partner not found');
  }

  const suspendedPartner = await partner.suspend();

  res.json({
    success: true,
    data: suspendedPartner,
    message: 'Partner suspended successfully'
  });
});

// @desc    Reject partner
// @route   POST /api/partners/:id/reject
// @access  Private/Admin
exports.rejectPartner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const partner = await Partner.query().findById(id);
  if (!partner) {
    res.status(404);
    throw new Error('Partner not found');
  }

  const rejectedPartner = await partner.reject();

  res.json({
    success: true,
    data: rejectedPartner,
    message: 'Partner rejected successfully'
  });
});

// @desc    Get partner services
// @route   GET /api/partners/:id/services
// @access  Private/Admin
exports.getPartnerServices = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { serviceType, isActive } = req.query;

  let query = PartnerService.query()
    .where('partner_id', id)
    .orderBy('created_at', 'desc');

  if (serviceType) {
    query = query.where('service_type', serviceType);
  }

  if (isActive !== undefined) {
    query = query.where('is_active', isActive === 'true');
  }

  const services = await query;

  res.json({
    success: true,
    data: services
  });
});

// @desc    Create partner service
// @route   POST /api/partners/:id/services
// @access  Private/Admin
exports.createPartnerService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    serviceName, 
    description, 
    serviceType, 
    price, 
    currency, 
    details, 
    availableQuantity, 
    validFrom, 
    validUntil 
  } = req.body;

  const partner = await Partner.query().findById(id);
  if (!partner) {
    res.status(404);
    throw new Error('Partner not found');
  }

  const service = await PartnerService.query().insert({
    partner_id: id,
    service_name: serviceName,
    description,
    service_type: serviceType,
    price,
    currency,
    details: details || {},
    available_quantity: availableQuantity || -1,
    valid_from: validFrom ? new Date(validFrom) : null,
    valid_until: validUntil ? new Date(validUntil) : null
  });

  res.status(200).json({
    success: true,
    data: service,
    message: 'Partner service created successfully'
  });
});

// @desc    Get partner bookings
// @route   GET /api/partners/:id/bookings
// @access  Private/Admin
exports.getPartnerBookings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, limit = 20, page = 1 } = req.query;

  let query = PartnerBooking.query()
    .where('partner_id', id)
    .withGraphFetched('[user(selectBasicInfo), service]')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'email');
      }
    })
    .orderBy('created_at', 'desc');

  if (status) {
    query = query.where('status', status);
  }

  const bookings = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));

  res.json({
    success: true,
    data: bookings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});

// @desc    Update booking status
// @route   PUT /api/partners/bookings/:id/status
// @access  Private/Admin
exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const booking = await PartnerBooking.query().findById(id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  let updatedBooking;
  switch (status) {
    case 'confirmed':
      updatedBooking = await booking.confirm();
      break;
    case 'completed':
      updatedBooking = await booking.complete();
      break;
    case 'cancelled':
      updatedBooking = await booking.cancel();
      break;
    default:
      res.status(400);
      throw new Error('Invalid status');
  }

  res.json({
    success: true,
    data: updatedBooking,
    message: 'Booking status updated successfully'
  });
});

// @desc    Get partner portal dashboard
// @route   GET /api/partners/dashboard
// @access  Private/Admin
exports.getPartnerDashboard = asyncHandler(async (req, res) => {
  const { period = 30 } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // Partner statistics
  const totalPartners = await Partner.query().resultSize();
  const approvedPartners = await Partner.query().where('status', 'approved').resultSize();
  const pendingPartners = await Partner.query().where('status', 'pending').resultSize();
  const recentPartners = await Partner.query()
    .where('created_at', '>=', daysAgo)
    .resultSize();

  // Service statistics
  const totalServices = await PartnerService.query().resultSize();
  const activeServices = await PartnerService.query().where('is_active', true).resultSize();

  // Booking statistics
  const totalBookings = await PartnerBooking.query().resultSize();
  const recentBookings = await PartnerBooking.query()
    .where('created_at', '>=', daysAgo)
    .resultSize();

  // Revenue statistics
  const totalRevenue = await PartnerBooking.query()
    .sum('total_amount as total')
    .first();

  const totalCommission = await PartnerBooking.query()
    .sum('commission_amount as total')
    .first();

  // Recent partners
  const recentPartnersList = await Partner.query()
    .withGraphFetched('approver(selectBasicInfo)')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'email');
      }
    })
    .orderBy('created_at', 'desc')
    .limit(5);

  // Recent bookings
  const recentBookingsList = await PartnerBooking.query()
    .withGraphFetched('[user(selectBasicInfo), service, partner(selectBasicInfo)]')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'email');
      }
    })
    .orderBy('created_at', 'desc')
    .limit(10);

  res.json({
    success: true,
    data: {
      partners: {
        total: totalPartners,
        approved: approvedPartners,
        pending: pendingPartners,
        recent: recentPartners
      },
      services: {
        total: totalServices,
        active: activeServices
      },
      bookings: {
        total: totalBookings,
        recent: recentBookings
      },
      revenue: {
        total: parseFloat(totalRevenue.total) || 0,
        commission: parseFloat(totalCommission.total) || 0
      },
      recent_partners: recentPartnersList,
      recent_bookings: recentBookingsList
    }
  });
});

// @desc    Get available partner services for customers
// @route   GET /api/partners/services/available
// @access  Public
exports.getAvailableServices = asyncHandler(async (req, res) => {
  const { serviceType, partnerId, limit = 20, page = 1 } = req.query;

  let query = PartnerService.query()
    .where('is_active', true)
    .withGraphFetched('partner(selectBasicInfo)')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'company_name', 'business_type');
      }
    })
    .orderBy('created_at', 'desc');

  if (serviceType) {
    query = query.where('service_type', serviceType);
  }

  if (partnerId) {
    query = query.where('partner_id', partnerId);
  }

  const services = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));

  // Add availability info
  const servicesWithAvailability = await Promise.all(
    services.map(async (service) => {
      const availableQuantity = await service.getAvailableQuantity();
      return {
        ...service,
        available_quantity: availableQuantity,
        is_available: service.isAvailable()
      };
    })
  );

  res.json({
    success: true,
    data: servicesWithAvailability,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});

// @desc    Book partner service
// @route   POST /api/partners/services/:serviceId/book
// @access  Private
exports.bookPartnerService = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const { bookingDetails } = req.body;

  const service = await PartnerService.query()
    .findById(serviceId)
    .withGraphFetched('partner')
    .first();

  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  if (!service.isAvailable()) {
    res.status(400);
    throw new Error('Service is not available');
  }

  const booking = await PartnerBooking.createBooking(
    service.partner_id,
    serviceId,
    req.user.id,
    bookingDetails,
    service.price
  );

  res.status(200).json({
    success: true,
    data: booking,
    message: 'Service booked successfully'
  });
});

// @desc    Get user's partner bookings
// @route   GET /api/partners/my-bookings
// @access  Private
exports.getMyPartnerBookings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, limit = 20, page = 1 } = req.query;

  let query = PartnerBooking.query()
    .where('user_id', userId)
    .withGraphFetched('[partner(selectBasicInfo), service]')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'company_name', 'business_type');
      }
    })
    .orderBy('created_at', 'desc');

  if (status) {
    query = query.where('status', status);
  }

  const bookings = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));

  res.json({
    success: true,
    data: bookings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});