const asyncHandler = require('express-async-handler');
const DownloadTracking = require('../models/DownloadTracking');
const MembershipCard = require('../models/MembershipCard');
const User = require('../models/User');
const Membership = require('../models/Membership');
const path = require('path');
const fs = require('fs');
const { generateMembershipCardPDF } = require('../utils/pdfGenerator');

const fsPromises = fs.promises;

const truthy = (value, extras = []) => {
  if (value === undefined || value === null) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized.length > 0 && (['1', 'true', 'yes'].concat(extras)).includes(normalized);
};

const extractRawToken = (req) => {
  if (req.query?.token) return req.query.token;
  if (req.query?.access_token) return req.query.access_token;
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

const pickFileBaseRoute = (req) => {
  if (req.baseUrl && req.baseUrl.includes('/api')) {
    return '/api/files';
  }
  return '/files';
};

const formatMemberName = (user = {}) => {
  if (!user) return 'ALTAYAR Member';
  if (user.name) return user.name;
  const first = user.first_name || user.firstName;
  const last = user.last_name || user.lastName;
  const combined = [first, last].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  return user.email || 'ALTAYAR Member';
};

const ensureMembershipCardPdf = async (card) => {
  const uploadsDir = path.join(__dirname, '../uploads/memberships');
  const filename = `membership-card-${card.card_number || card.id}.pdf`;
  const absolutePath = path.join(uploadsDir, filename);

  try {
    await fsPromises.access(absolutePath);
  } catch (error) {
    const pdfBuffer = await generateMembershipCardPDF(card.membership || {}, {
      id: card.user_id,
      name: formatMemberName(card.user),
      email: card.user?.email || '',
      points: card.user?.points || 0,
      cashback: card.user?.cashback || 0
    });

    await fsPromises.mkdir(uploadsDir, { recursive: true });
    await fsPromises.writeFile(absolutePath, pdfBuffer);
  }

  return {
    absolutePath,
    relativePath: `/uploads/memberships/${filename}`
  };
};

// @desc    Generate and download membership card PDF
// @route   GET /api/files/membership-card
// @access  Private
exports.downloadMembershipCard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Get or create membership card
  let card = await MembershipCard.getUserCard(userId);
  
  if (!card) {
    // Create new membership card
    const user = await User.query().findById(userId).withGraphFetched('membership');
    if (!user.membership_id) {
      res.status(400);
      throw new Error('User does not have an active membership');
    }
    
    card = await MembershipCard.createCard(userId, user.membership_id);
  }

  // CRITICAL FIX: Track download using correct method
  // trackDownload is a static method, so we use it correctly
  try {
    await DownloadTracking.trackDownload(userId, 'membership_card', 'membership-card.pdf', '', {
      source: 'web',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      card_id: card.id
    });
  } catch (trackError) {
    console.log('⚠️ [DOWNLOAD TRACKING] Could not track download:', trackError.message);
    // Continue even if tracking fails
  }

  const baseRoute = pickFileBaseRoute(req);
  const responsePayload = {
    success: true,
    data: {
      card: card.getCardData(),
      download_url: `${baseRoute}/membership-card/pdf/${card.id}`,
      message: 'Membership card ready for download'
    }
  };

  const wantsDownload = truthy(req.query.download, ['download', 'file', 'pdf']);
  const formatValue = (req.query.format || '').toString().toLowerCase();
  const wantsJsonParam = formatValue === 'json';
  const hasAuthHeader = Boolean(req.headers.authorization);
  const acceptsJson = (req.headers.accept || '').toLowerCase().includes('application/json');
  const shouldRespondWithJson = !wantsDownload && (wantsJsonParam || hasAuthHeader || acceptsJson);

  if (shouldRespondWithJson) {
    return res.json(responsePayload);
  }

  const downloadToken = extractRawToken(req);
  if (!downloadToken) {
    return res.status(400).json({
      success: false,
      message: 'Download token missing. Please append ?token=YOUR_JWT when opening the link.'
    });
  }

  const redirectParams = new URLSearchParams();
  redirectParams.set('token', downloadToken);
  redirectParams.set('download', '1');
  if (req.query.t) {
    redirectParams.set('t', req.query.t);
  }

  const redirectTarget = `${baseRoute}/membership-card/pdf/${card.id}?${redirectParams.toString()}`;
  return res.redirect(302, redirectTarget);
});

// @desc    Download membership card PDF
// @route   GET /api/files/membership-card/pdf/:cardId
// @access  Private
exports.downloadMembershipCardPDF = asyncHandler(async (req, res) => {
  const { cardId } = req.params;
  const userId = req.user.id;

  const card = await MembershipCard.query()
    .findById(cardId)
    .where('user_id', userId)
    .withGraphFetched('[user, membership]')
    .first();

  if (!card) {
    res.status(404);
    throw new Error('Membership card not found');
  }

  try {
    const { absolutePath, relativePath } = await ensureMembershipCardPdf(card);

    await DownloadTracking.trackDownload(userId, 'membership_card_pdf', `membership-card-${card.card_number}.pdf`, relativePath, {
      source: 'web',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      card_id: card.id
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="membership-card-${card.card_number}.pdf"`);
    return res.sendFile(absolutePath);
  } catch (error) {
    console.error('Error generating membership card PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to generate membership card PDF. Please try again shortly.'
    });
  }
});

// @desc    Download voucher PDF
// @route   GET /api/files/voucher/:voucherId
// @access  Private
exports.downloadVoucher = asyncHandler(async (req, res) => {
  const { voucherId } = req.params;
  const userId = req.user.id;

  const Voucher = require('../models/Voucher');
  const voucher = await Voucher.query()
    .findById(voucherId)
    .where('user_id', userId)
    .first();

  if (!voucher) {
    res.status(404);
    throw new Error('Voucher not found');
  }

  // Track download
  await DownloadTracking.trackDownload(userId, 'voucher', `voucher-${voucher.code}.pdf`, '', {
    source: 'web',
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    voucher_id: voucher.id
  });

  res.json({
    success: true,
    message: 'Voucher download initiated',
    data: {
      voucher_code: voucher.code,
      voucher_type: voucher.type,
      value: voucher.value,
      expires_at: voucher.expires_at
    }
  });
});

// @desc    Download invoice PDF
// @route   GET /api/files/invoice/:bookingId
// @access  Private
exports.downloadInvoice = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  const Booking = require('../models/Booking');
  const Package = require('../models/Package');
  const User = require('../models/User');
  const { generateInvoicePDF } = require('../utils/invoicePdfGenerator');

  // Fetch booking with related data
  const booking = await Booking.query()
    .findById(bookingId)
    .where('user_id', userId)
    .withGraphFetched('user')
    .first();

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Get user details if not loaded
  let user = booking.user;
  if (!user) {
    try {
      user = await User.query()
        .findById(booking.user_id)
        .select('id', 'name', 'email');
    } catch (error) {
      console.error('Error fetching user:', error);
      user = { name: 'User', email: null };
    }
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
  const invoiceNumber = booking.invoice_id || `INV-${Date.now()}-${booking.id}`;
  
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
      numberOfDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    }
  } else if (packageData?.days) {
    numberOfDays = packageData.days;
  }

  // Calculate pricing dynamically
  const participants = booking.details?.participants || 1;
  let basePrice = 0;
  let dailyRate = 0;
  let totalPrice = parseFloat(booking.total_price) || 0;

  // If package exists, use package pricing
  if (packageData) {
    basePrice = parseFloat(packageData.price) || 0;
    if (packageData.days && packageData.days > 0) {
      dailyRate = basePrice / packageData.days;
    } else {
      dailyRate = basePrice;
    }
    totalPrice = (dailyRate * numberOfDays) * participants;
  } else if (booking.total_price) {
    totalPrice = parseFloat(booking.total_price);
    if (numberOfDays > 0) {
      dailyRate = totalPrice / (numberOfDays * participants);
    }
  } else {
    dailyRate = 100;
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

  // Build invoice data
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
        quantity: numberOfDays,
        rate: dailyRate,
        adjustment: 0,
        total: dailyRate * numberOfDays * participants,
      },
    ],
    subtotal: totalPrice,
    total: totalPrice,
    terms: 'Payment is due within 30 days from date of invoice. All prices are in EGP.',
    createdAt: booking.created_at,
  };

  try {
    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Track download
    try {
      await DownloadTracking.trackDownload(userId, 'invoice', `invoice-${invoiceNumber}.pdf`, '', {
        source: 'web',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        booking_id: booking.id,
        invoice_id: invoiceNumber,
      });
    } catch (err) {
      console.log('⚠️ [DOWNLOAD TRACKING] Could not track download:', err.message);
    }

    // Set headers for PDF download
    const filename = `invoice-${invoiceNumber}.pdf`;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // PDF content headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @desc    Get user download history
// @route   GET /api/files/downloads
// @access  Private
exports.getUserDownloads = asyncHandler(async (req, res) => {
  const { limit = 50, page = 1 } = req.query;

  const downloads = await DownloadTracking.getUserDownloads(req.user.id, parseInt(limit));

  res.json({
    success: true,
    data: downloads,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: downloads.length
    }
  });
});

// @desc    Get download statistics (Admin)
// @route   GET /api/files/statistics
// @access  Private/Admin
exports.getDownloadStatistics = asyncHandler(async (req, res) => {
  const { period = 30 } = req.query;

  const stats = await DownloadTracking.getDownloadStats(parseInt(period));

  res.json({
    success: true,
    data: stats,
    period: `${period} days`
  });
});

// @desc    Get popular downloads (Admin)
// @route   GET /api/files/popular
// @access  Private/Admin
exports.getPopularDownloads = asyncHandler(async (req, res) => {
  const { limit = 10, period = 30 } = req.query;

  const popularDownloads = await DownloadTracking.getPopularDownloads(parseInt(limit), parseInt(period));

  res.json({
    success: true,
    data: popularDownloads,
    period: `${period} days`
  });
});

// @desc    Generate QR code for membership card
// @route   GET /api/files/membership-card/qr/:cardId
// @access  Private
exports.getMembershipCardQR = asyncHandler(async (req, res) => {
  const { cardId } = req.params;
  const userId = req.user.id;

  const card = await MembershipCard.query()
    .findById(cardId)
    .where('user_id', userId)
    .first();

  if (!card) {
    res.status(404);
    throw new Error('Membership card not found');
  }

  // Track QR code access
  await DownloadTracking.trackDownload(userId, 'qr_code', `qr-${card.card_number}.png`, '', {
    source: 'web',
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    card_id: card.id
  });

  res.json({
    success: true,
    data: {
      qr_code: card.qr_code,
      card_number: card.card_number,
      qr_url: `/api/files/membership-card/qr-image/${card.qr_code}`
    }
  });
});

// @desc    Upload custom file
// @route   POST /api/files/upload
// @access  Private
exports.uploadCustomFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const { fileType, description } = req.body;

  // Track file upload
  await DownloadTracking.trackDownload(req.user.id, 'upload', req.file.originalname, req.file.path, {
    source: 'web',
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    file_type: fileType,
    description: description,
    file_size: req.file.size
  });

  res.json({
    success: true,
    data: {
      file_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      file_type: fileType
    },
    message: 'File uploaded successfully'
  });
});

// @desc    Get file download URL
// @route   GET /api/files/download-url/:fileType/:id
// @access  Private
exports.getDownloadUrl = asyncHandler(async (req, res) => {
  const { fileType, id } = req.params;
  const userId = req.user.id;

  let downloadUrl = '';
  let fileName = '';

  switch (fileType) {
    case 'membership-card':
      const card = await MembershipCard.query()
        .findById(id)
        .where('user_id', userId)
        .first();
      if (card) {
        downloadUrl = `/api/files/membership-card/pdf/${id}`;
        fileName = `membership-card-${card.card_number}.pdf`;
      }
      break;

    case 'voucher':
      const Voucher = require('../models/Voucher');
      const voucher = await Voucher.query()
        .findById(id)
        .where('user_id', userId)
        .first();
      if (voucher) {
        downloadUrl = `/api/files/voucher/${id}`;
        fileName = `voucher-${voucher.code}.pdf`;
      }
      break;

    case 'invoice':
      const Booking = require('../models/Booking');
      const booking = await Booking.query()
        .findById(id)
        .where('user_id', userId)
        .first();
      if (booking) {
        downloadUrl = `/api/files/invoice/${id}`;
        fileName = `invoice-${booking.invoice_id}.pdf`;
      }
      break;

    default:
      res.status(400);
      throw new Error('Invalid file type');
  }

  if (!downloadUrl) {
    res.status(404);
    throw new Error('File not found');
  }

  res.json({
    success: true,
    data: {
      download_url: downloadUrl,
      file_name: fileName,
      file_type: fileType
    }
  });
});
