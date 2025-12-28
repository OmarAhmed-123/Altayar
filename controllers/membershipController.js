// File: controllers/membershipController.js
const Membership = require('../models/Membership');
const User = require('../models/User');
const DownloadTracking = require('../models/DownloadTracking');
const Transaction = require('../models/Transaction');
const { generateMembershipCardPDF, saveMembershipPDF } = require('../utils/pdfGenerator');
const { findMembershipPDF, getMembershipPDFUrl } = require('../utils/membershipPdfHelper');
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs'); // For createWriteStream

/**
 * Safely encode filename for Content-Disposition header
 * Handles non-ASCII characters (like Arabic) using RFC 5987 encoding
 * @param {string} filename - The filename to encode
 * @param {string} disposition - 'inline' or 'attachment'
 * @returns {string} - Properly encoded Content-Disposition header value
 */
function encodeContentDisposition(filename, disposition = 'inline') {
  if (!filename || typeof filename !== 'string') {
    filename = 'membership.pdf';
  }

  // Remove or replace invalid characters for HTTP headers
  const sanitizeFilename = (name) => {
    // Remove control characters, quotes, and other problematic chars
    return name.replace(/[\x00-\x1F\x7F"\\<>|:*?\/]/g, '').trim();
  };

  const sanitized = sanitizeFilename(filename);
  
  // Create a safe ASCII fallback filename
  // Replace non-ASCII with underscore, but preserve the structure
  let safeAsciiName = sanitized
    .replace(/[^\x20-\x7E]/g, '_') // Replace non-ASCII with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 200); // Limit length

  // Ensure we have a valid filename
  if (!safeAsciiName || safeAsciiName === '_' || safeAsciiName.length === 0) {
    safeAsciiName = 'membership.pdf';
  }

  // Ensure it ends with .pdf if it doesn't already
  if (!safeAsciiName.toLowerCase().endsWith('.pdf')) {
    safeAsciiName = safeAsciiName.replace(/\.(pdf)?$/i, '') + '.pdf';
  }

  // Check if original filename contains non-ASCII characters
  const hasNonAscii = /[^\x20-\x7E]/.test(sanitized);

  if (!hasNonAscii) {
    // Simple case: ASCII only, use standard format
    return `${disposition}; filename="${safeAsciiName}"`;
  }

  // Complex case: Contains non-ASCII characters, use RFC 5987 encoding
  // Format: disposition; filename="fallback"; filename*=UTF-8''encoded
  // RFC 5987: filename*=charset'lang'value where charset is UTF-8, lang is empty, value is percent-encoded
  const encodedFilename = encodeURIComponent(sanitized)
    .replace(/'/g, '%27') // Escape single quotes
    .replace(/\(/g, '%28') // Escape parentheses
    .replace(/\)/g, '%29');

  return `${disposition}; filename="${safeAsciiName}"; filename*=UTF-8''${encodedFilename}`;
}

// Get all memberships
const getMemberships = asyncHandler(async (req, res) => {
  const memberships = await Membership.query()
    .where('is_active', true)
    .orderBy('price', 'asc');

  console.log(`📊 [Memberships API] Found ${memberships.length} active memberships in database`);
  if (memberships.length > 0) {
    console.log(`📋 [Memberships API] Memberships: ${memberships.map(m => `${m.tier || 'N/A'} - ${m.name}`).join(', ')}`);
  }

  // Construct full URLs for images and PDFs
  // CRITICAL FIX: Use production URL in production, request-based URL in development
  const getBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.BACKEND_URL || 'https://altayar-backend-kuwjte4rda-uc.a.run.app';
    }
    const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'http';
    const host = req.get('host') || `localhost:${process.env.PORT || 5000}`;
    return `${protocol}://${host}`;
  };
  
  const baseUrl = getBaseUrl();
  const membershipsWithUrls = await Promise.all(memberships.map(async (membership) => {
    let imageUrl = membership.image_url;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }
    
    // CRITICAL: Get PDF URL for membership
    // First check if PDF exists in database, otherwise find it from files
    let pdfUrl = membership.pdf_url;
    if (!pdfUrl) {
      // Clean tier value (handle "null" string case)
      let cleanTier = membership.tier;
      if (cleanTier === 'null' || cleanTier === null || cleanTier === undefined || cleanTier === '') {
        cleanTier = null;
      }
      // Try to find PDF file based on membership name and tier
      const pdfPath = await findMembershipPDF(membership.name, cleanTier);
      if (pdfPath) {
        // Generate URL for the PDF
        pdfUrl = getMembershipPDFUrl(membership, req);
      }
    } else if (pdfUrl && !pdfUrl.startsWith('http')) {
      // If pdf_url exists but is relative, make it absolute
      const protocol = req.protocol;
      const host = req.get('host');
      pdfUrl = `${protocol}://${host}${pdfUrl}`;
    }
    
    return {
      ...membership,
      image_url: imageUrl || membership.image_url,
      pdf_url: pdfUrl || null,
      pdf_view_url: pdfUrl ? `${req.protocol}://${req.get('host')}/api/memberships/${membership.id}/pdf/view` : null,
      pdf_download_url: pdfUrl ? `${req.protocol}://${req.get('host')}/api/memberships/${membership.id}/pdf/download` : null
    };
  }));

  console.log(`✅ [Memberships API] Returning ${membershipsWithUrls.length} memberships with URLs`);
  
  res.json({
    success: true,
    data: membershipsWithUrls
  });
});

// Get membership by ID
const getMembershipById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const membership = await Membership.query()
    .findById(id)
    .where('is_active', true);

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: 'Membership not found'
    });
  }

  // Construct full URL for image if it exists
  // CRITICAL FIX: Use production URL in production, request-based URL in development
  const getBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.BACKEND_URL || 'https://altayar-backend-kuwjte4rda-uc.a.run.app';
    }
    const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'http';
    const host = req.get('host') || `localhost:${process.env.PORT || 5000}`;
    return `${protocol}://${host}`;
  };
  
  const baseUrl = getBaseUrl();
  let imageUrl = membership.image_url;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  // CRITICAL: Get PDF URL for membership
  // First check if PDF exists in database, otherwise find it from files
  let pdfUrl = membership.pdf_url;
  if (!pdfUrl) {
    // Clean tier value (handle "null" string case)
    let cleanTier = membership.tier;
    if (cleanTier === 'null' || cleanTier === null || cleanTier === undefined || cleanTier === '') {
      cleanTier = null;
    }
    // Try to find PDF file based on membership name and tier
    const pdfPath = await findMembershipPDF(membership.name, cleanTier);
    if (pdfPath) {
      // Generate URL for the PDF
      pdfUrl = getMembershipPDFUrl(membership, req);
    }
  } else if (pdfUrl && !pdfUrl.startsWith('http')) {
    // If pdf_url exists but is relative, make it absolute
    const protocol = req.protocol;
    const host = req.get('host');
    pdfUrl = `${protocol}://${host}${pdfUrl}`;
  }

  res.json({
    success: true,
    data: {
      ...membership,
      image_url: imageUrl || membership.image_url,
      pdf_url: pdfUrl || null,
      pdf_view_url: pdfUrl ? `${req.protocol}://${req.get('host')}/api/memberships/${id}/pdf/view` : null,
      pdf_download_url: pdfUrl ? `${req.protocol}://${req.get('host')}/api/memberships/${id}/pdf/download` : null
    }
  });
});

// Create new membership (Admin only)
const createMembership = asyncHandler(async (req, res) => {
  const { 
    name, 
    tier,
    price, 
    points, 
    point_multiplier,
    cashback_rate,
    welcome_points,
    welcome_cashback,
    duration_days,
    description,
    benefits, 
    pdf_url,
    is_active
  } = req.body;
  
  const dataToInsert = {
    name: name || 'New Membership',
    tier: tier || 'silver',
    price: price || 0,
    points: points || 0,
    point_multiplier: point_multiplier || 1.0,
    cashback_rate: cashback_rate || 0,
    welcome_points: welcome_points || 0,
    welcome_cashback: welcome_cashback || 0,
    duration_days: duration_days || 30,
    description: description || null,
    benefits: Array.isArray(benefits) 
      ? benefits 
      : (typeof benefits === 'string' 
          ? benefits.split(',').map(b => b.trim()).filter(b => b.length > 0)
          : []),
    pdf_url: pdf_url || null,
    is_active: is_active !== undefined ? is_active : true
  };

  // Handle membership image upload
  if (req.file) {
    const filePath = req.file.path;
    const relativePath = filePath.replace(/\\/g, '/').split('uploads/')[1];
    dataToInsert.image_url = `/uploads/${relativePath}`;
  }

  const membership = await Membership.query().insert(dataToInsert);

  // Construct full URL for image if it exists
  // CRITICAL FIX: Use production URL in production, request-based URL in development
  const getBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.BACKEND_URL || 'https://altayar-backend-kuwjte4rda-uc.a.run.app';
    }
    const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'http';
    const host = req.get('host') || `localhost:${process.env.PORT || 5000}`;
    return `${protocol}://${host}`;
  };
  
  const baseUrl = getBaseUrl();
  let imageUrl = membership.image_url;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  res.status(200).json({
    success: true,
    data: {
      ...membership,
      image_url: imageUrl || membership.image_url
    }
  });
});

// Update membership (Admin only)
const updateMembership = asyncHandler(async (req, res) => {
  const fs = require('fs').promises;
  const path = require('path');
  
  const { id } = req.params;
  const { 
    name, 
    tier,
    price, 
    points, 
    point_multiplier,
    cashback_rate,
    welcome_points,
    welcome_cashback,
    duration_days,
    description,
    benefits, 
    pdf_url, 
    is_active 
  } = req.body;

  // Get current membership to check for old image
  const currentMembership = await Membership.query().findById(id);
  
  if (!currentMembership) {
    return res.status(404).json({
      success: false,
      message: 'Membership not found'
    });
  }

  const dataToUpdate = {};
  if (name !== undefined) dataToUpdate.name = name;
  if (tier !== undefined) dataToUpdate.tier = tier;
  if (price !== undefined) dataToUpdate.price = price;
  if (points !== undefined) dataToUpdate.points = points;
  if (point_multiplier !== undefined) dataToUpdate.point_multiplier = point_multiplier;
  if (cashback_rate !== undefined) dataToUpdate.cashback_rate = cashback_rate;
  if (welcome_points !== undefined) dataToUpdate.welcome_points = welcome_points;
  if (welcome_cashback !== undefined) dataToUpdate.welcome_cashback = welcome_cashback;
  if (duration_days !== undefined) dataToUpdate.duration_days = duration_days;
  if (description !== undefined) dataToUpdate.description = description;
  if (benefits !== undefined) {
    // Handle benefits as array or comma-separated string
    if (Array.isArray(benefits)) {
      dataToUpdate.benefits = benefits;
    } else if (typeof benefits === 'string') {
      dataToUpdate.benefits = benefits.split(',').map(b => b.trim()).filter(b => b.length > 0);
    } else {
      dataToUpdate.benefits = benefits;
    }
  }
  if (pdf_url !== undefined) dataToUpdate.pdf_url = pdf_url;
  if (is_active !== undefined) dataToUpdate.is_active = is_active;

  // Handle membership image upload - Delete old image if exists
  if (req.file) {
    // Delete old membership image if it exists
    if (currentMembership.image_url) {
      try {
        const oldImagePath = currentMembership.image_url.startsWith('/uploads/')
          ? currentMembership.image_url.replace('/uploads/', '')
          : currentMembership.image_url;
        
        const fullOldPath = path.join(__dirname, '../uploads', oldImagePath);
        
        try {
          await fs.access(fullOldPath);
          await fs.unlink(fullOldPath);
          console.log(`Deleted old membership image: ${fullOldPath}`);
        } catch (err) {
          console.log(`Old membership image not found or already deleted: ${fullOldPath}`);
        }
      } catch (deleteError) {
        console.error('Error deleting old membership image:', deleteError);
      }
    }

    // Get the file path relative to the server root
    const filePath = req.file.path;
    const relativePath = filePath.replace(/\\/g, '/').split('uploads/')[1];
    dataToUpdate.image_url = `/uploads/${relativePath}`;
  }

  const membership = await Membership.query()
    .findById(id)
    .patch(dataToUpdate);

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: 'Membership not found'
    });
  }

  const updatedMembership = await Membership.query().findById(id);

  // Construct full URL for image if it exists
  // CRITICAL FIX: Use production URL in production, request-based URL in development
  const getBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.BACKEND_URL || 'https://altayar-backend-kuwjte4rda-uc.a.run.app';
    }
    const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'http';
    const host = req.get('host') || `localhost:${process.env.PORT || 5000}`;
    return `${protocol}://${host}`;
  };
  
  const baseUrl = getBaseUrl();
  let imageUrl = updatedMembership.image_url;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  res.json({
    success: true,
    data: {
      ...updatedMembership,
      image_url: imageUrl || updatedMembership.image_url
    }
  });
});

// Delete membership (Admin only)
const deleteMembership = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const membership = await Membership.query()
    .findById(id)
    .patch({ is_active: false });

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: 'Membership not found'
    });
  }

  res.json({
    success: true,
    message: 'Membership deleted successfully'
  });
});

// View membership PDF (inline - for reading)
// @route   GET /api/memberships/:id/pdf/view
// @access  Public (or Private if needed)
const viewMembershipPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || null;

  const membership = await Membership.query()
    .findById(id)
    .where('is_active', true);

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: 'Membership not found'
    });
  }

  // Find PDF file based on membership name and tier
  let pdfPath = null;
  
  // Clean tier value (handle "null" string case)
  let cleanTier = membership.tier;
  if (cleanTier === 'null' || cleanTier === null || cleanTier === undefined || cleanTier === '') {
    cleanTier = null;
  }
  
  console.log(`🔍 [Membership PDF View] Looking for PDF - ID: ${id}, Name: "${membership.name}", Tier: "${cleanTier}"`);
  
  // First, try to find PDF from database pdf_url
  if (membership.pdf_url) {
    // Check if it's a relative path in uploads
    if (!membership.pdf_url.startsWith('http')) {
      const uploadsPath = path.join(__dirname, '../uploads', membership.pdf_url);
      try {
        await fs.access(uploadsPath);
        pdfPath = uploadsPath;
        console.log(`✅ [Membership PDF View] Found PDF from database pdf_url: ${uploadsPath}`);
      } catch (error) {
        console.log(`⚠️ [Membership PDF View] PDF from database pdf_url not found: ${uploadsPath}`);
        // File not in uploads, continue to check memberships folder
      }
    } else {
      // If it's a full URL, we can't serve it directly, need to find local file
      console.log(`⚠️ [Membership PDF View] pdf_url is a full URL, will search for local file`);
    }
  }
  
  // If not found, try to find in memberships folder using both name and tier
  if (!pdfPath) {
    console.log(`🔍 [Membership PDF View] Searching in memberships folder...`);
    console.log(`🔍 [Membership PDF View] Membership data:`, {
      id: membership.id,
      name: membership.name,
      tier: cleanTier,
    });
    
    // Strategy 1: Try with both name and tier
    pdfPath = await findMembershipPDF(membership.name, cleanTier);
    
    // Strategy 2: Try with tier only (most reliable)
    if (!pdfPath && cleanTier) {
      console.log(`🔍 [Membership PDF View] Trying with tier only: "${cleanTier}"`);
      pdfPath = await findMembershipPDF(null, cleanTier);
    }
    
    // Strategy 3: Try with name only
    if (!pdfPath && membership.name) {
      console.log(`🔍 [Membership PDF View] Trying with name only: "${membership.name}"`);
      pdfPath = await findMembershipPDF(membership.name, null);
    }
    
    // Strategy 4: Try direct file listing and match
    if (!pdfPath) {
      try {
        const membershipsDir = path.join(__dirname, '../memberships');
        const files = await fs.readdir(membershipsDir);
        const pdfFiles = files.filter(f => f.endsWith('.pdf'));
        
        console.log(`🔍 [Membership PDF View] All available PDF files: ${pdfFiles.join(', ')}`);
        
        // Try to match by checking file names directly
        for (const pdfFile of pdfFiles) {
          const filePrefix = pdfFile.split('_')[0].toLowerCase();
          const membershipNameLower = (membership.name || '').toLowerCase();
          const tierLower = (cleanTier || '').toLowerCase();
          
          // Check if file matches membership name or tier
          if ((membershipNameLower && filePrefix.includes(membershipNameLower)) ||
              (tierLower && filePrefix.includes(tierLower)) ||
              (membershipNameLower && membershipNameLower.includes(filePrefix.split('membership')[0])) ||
              (tierLower && tierLower === filePrefix.split('membership')[0])) {
            pdfPath = path.join(membershipsDir, pdfFile);
            console.log(`✅ [Membership PDF View] Found PDF by direct matching: ${pdfFile}`);
            break;
          }
        }
      } catch (dirError) {
        console.error('❌ [Membership PDF View] Error reading memberships directory:', dirError);
      }
    }
  }

  // If PDF not found, try to generate a basic membership information PDF
  if (!pdfPath) {
    console.log(`⚠️ [Membership PDF View] PDF not found, attempting to generate basic membership PDF...`);
    
    try {
      // Generate a basic membership information PDF
      const PDFDocument = require('pdfkit');
      const membershipsDir = path.join(__dirname, '../memberships');
      
      // Ensure memberships directory exists
      try {
        await fs.mkdir(membershipsDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
      
      // Generate PDF filename based on membership
      const membershipPrefix = cleanTier 
        ? (cleanTier.charAt(0).toUpperCase() + cleanTier.slice(1)) + 'Membership'
        : (membership.name || 'Membership').replace(/[^a-zA-Z0-9]/g, '') + 'Membership';
      
      const timestamp = Date.now();
      const pdfFilename = `${membershipPrefix}_${timestamp}.pdf`;
      const pdfFilePath = path.join(membershipsDir, pdfFilename);
      
      // Create a basic PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `${membership.name || 'Membership'} Information`,
          Author: 'ALTAYAR VIP',
          Subject: 'Membership Information',
          Creator: 'ALTAYAR VIP System',
        }
      });
      
      // Write PDF to file
      const writeStream = fsSync.createWriteStream(pdfFilePath);
      doc.pipe(writeStream);
      
      // Add content
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#1a4d8c')
        .text('ALTAYAR VIP', 50, 50, { align: 'center' });
      
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(membership.name || 'Membership', 50, 100, { align: 'center' });
      
      let yPos = 150;
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#1a4d8c')
        .text('Membership Information', 50, yPos);
      
      yPos += 30;
      doc.fontSize(11)
        .font('Helvetica')
        .fillColor('#000000');
      
      if (membership.description) {
        doc.text('Description:', 50, yPos);
        yPos += 20;
        doc.text(membership.description, 50, yPos, { width: 495 });
        yPos += 40;
      }
      
      if (cleanTier) {
        doc.text(`Tier: ${cleanTier}`, 50, yPos);
        yPos += 20;
      }
      
      if (membership.price) {
        doc.text(`Price: ${membership.price} EGP`, 50, yPos);
        yPos += 20;
      }
      
      if (membership.duration_days) {
        doc.text(`Duration: ${membership.duration_days} days`, 50, yPos);
        yPos += 20;
      }
      
      if (membership.benefits && Array.isArray(membership.benefits) && membership.benefits.length > 0) {
        yPos += 20;
        doc.font('Helvetica-Bold')
          .text('Benefits:', 50, yPos);
        yPos += 20;
        doc.font('Helvetica');
        membership.benefits.forEach((benefit, index) => {
          doc.text(`${index + 1}. ${benefit}`, 70, yPos, { width: 475 });
          yPos += 20;
        });
      }
      
      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text('© ALTAYAR VIP - Premium Membership Program', 50, pageHeight - 40, { align: 'center' });
      
      doc.end();
      
      // Wait for file to be written
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      
      // Verify file was created
      await fs.access(pdfFilePath);
      pdfPath = pdfFilePath;
      
      // Update membership with PDF URL
      try {
        const relativePath = `memberships/${pdfFilename}`;
        await Membership.query()
          .findById(id)
          .patch({ pdf_url: relativePath });
        console.log(`✅ [Membership PDF View] Generated and saved PDF: ${pdfFilePath}`);
      } catch (updateError) {
        console.warn('⚠️ [Membership PDF View] Could not update membership pdf_url:', updateError.message);
      }
      
    } catch (generateError) {
      console.error('❌ [Membership PDF View] Error generating PDF:', generateError);
      return res.status(500).json({
        success: false,
        message: 'Error generating membership PDF',
        error: process.env.NODE_ENV === 'development' ? generateError.message : undefined
      });
    }
  }
  
  if (!pdfPath) {
    console.error(`❌ [Membership PDF View] PDF not found and could not generate for membership ID: ${id}, Name: "${membership.name}", Tier: "${cleanTier}"`);
    return res.status(404).json({
      success: false,
      message: 'PDF file not available for this membership and could not be generated'
    });
  }
  
  console.log(`✅ [Membership PDF View] Successfully found PDF: ${pdfPath}`);

  // Track the view/download
  if (userId) {
    try {
      await DownloadTracking.trackDownload(userId, 'membership_pdf', `${membership.name}_membership.pdf`, pdfPath, {
        source: 'web',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        membership_id: id,
        action: 'view'
      });
    } catch (trackError) {
      console.log('⚠️ [DOWNLOAD TRACKING] Could not track PDF view:', trackError.message);
    }
  }
  
  try {
    // Check if file exists
    await fs.access(pdfPath);
    
    // Generate safe filename for Content-Disposition header
    const filename = `${membership.name || 'membership'}_membership.pdf`;
    const contentDisposition = encodeContentDisposition(filename, 'inline');
    
    // Set CORS headers for cross-origin requests (React Native, web browsers)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, Accept-Ranges');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length, Content-Range, Accept-Ranges');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Set headers for PDF viewing (inline)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Accept-Ranges', 'bytes'); // Support range requests for partial content
    res.setHeader('X-Content-Type-Options', 'nosniff'); // Security header
    
    // Send the file
    res.sendFile(pdfPath);
  } catch (error) {
    console.error('Error serving membership PDF:', error);
    // Don't send response if headers already sent
    if (!res.headersSent) {
      res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }
  }
});

// Download membership PDF (attachment - for download)
// @route   GET /api/memberships/:id/pdf/download
// @access  Public (or Private if needed)
const downloadMembershipPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || null;

  const membership = await Membership.query()
    .findById(id)
    .where('is_active', true);

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: 'Membership not found'
    });
  }

  // Find PDF file based on membership name and tier
  let pdfPath = null;
  
  // Clean tier value (handle "null" string case)
  let cleanTier = membership.tier;
  if (cleanTier === 'null' || cleanTier === null || cleanTier === undefined || cleanTier === '') {
    cleanTier = null;
  }
  
  console.log(`🔍 [Membership PDF Download] Looking for PDF - ID: ${id}, Name: "${membership.name}", Tier: "${cleanTier}"`);
  
  // First, try to find PDF from database pdf_url
  if (membership.pdf_url) {
    // Check if it's a relative path in uploads
    if (!membership.pdf_url.startsWith('http')) {
      const uploadsPath = path.join(__dirname, '../uploads', membership.pdf_url);
      try {
        await fs.access(uploadsPath);
        pdfPath = uploadsPath;
        console.log(`✅ [Membership PDF Download] Found PDF from database pdf_url: ${uploadsPath}`);
      } catch (error) {
        console.log(`⚠️ [Membership PDF Download] PDF from database pdf_url not found: ${uploadsPath}`);
        // File not in uploads, continue to check memberships folder
      }
    } else {
      // If it's a full URL, we can't serve it directly, need to find local file
      console.log(`⚠️ [Membership PDF Download] pdf_url is a full URL, will search for local file`);
    }
  }
  
  // If not found, try to find in memberships folder using both name and tier
  if (!pdfPath) {
    console.log(`🔍 [Membership PDF Download] Searching in memberships folder...`);
    console.log(`🔍 [Membership PDF Download] Membership data:`, {
      id: membership.id,
      name: membership.name,
      tier: cleanTier,
    });
    
    // Strategy 1: Try with both name and tier
    pdfPath = await findMembershipPDF(membership.name, cleanTier);
    
    // Strategy 2: Try with tier only (most reliable)
    if (!pdfPath && cleanTier) {
      console.log(`🔍 [Membership PDF Download] Trying with tier only: "${cleanTier}"`);
      pdfPath = await findMembershipPDF(null, cleanTier);
    }
    
    // Strategy 3: Try with name only
    if (!pdfPath && membership.name) {
      console.log(`🔍 [Membership PDF Download] Trying with name only: "${membership.name}"`);
      pdfPath = await findMembershipPDF(membership.name, null);
    }
    
    // Strategy 4: Try direct file listing and match
    if (!pdfPath) {
      try {
        const membershipsDir = path.join(__dirname, '../memberships');
        const files = await fs.readdir(membershipsDir);
        const pdfFiles = files.filter(f => f.endsWith('.pdf'));
        
        console.log(`🔍 [Membership PDF Download] All available PDF files: ${pdfFiles.join(', ')}`);
        
        // Try to match by checking file names directly
        for (const pdfFile of pdfFiles) {
          const filePrefix = pdfFile.split('_')[0].toLowerCase();
          const membershipNameLower = (membership.name || '').toLowerCase();
          const tierLower = (cleanTier || '').toLowerCase();
          
          // Check if file matches membership name or tier
          if ((membershipNameLower && filePrefix.includes(membershipNameLower)) ||
              (tierLower && filePrefix.includes(tierLower)) ||
              (membershipNameLower && membershipNameLower.includes(filePrefix.split('membership')[0])) ||
              (tierLower && tierLower === filePrefix.split('membership')[0])) {
            pdfPath = path.join(membershipsDir, pdfFile);
            console.log(`✅ [Membership PDF Download] Found PDF by direct matching: ${pdfFile}`);
            break;
          }
        }
      } catch (dirError) {
        console.error('❌ [Membership PDF Download] Error reading memberships directory:', dirError);
      }
    }
  }

  // If PDF not found, try to generate a basic membership information PDF
  if (!pdfPath) {
    console.log(`⚠️ [Membership PDF Download] PDF not found, attempting to generate basic membership PDF...`);
    
    try {
      // Generate a basic membership information PDF (same logic as view)
      const PDFDocument = require('pdfkit');
      const membershipsDir = path.join(__dirname, '../memberships');
      
      // Ensure memberships directory exists
      try {
        await fs.mkdir(membershipsDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
      
      // Generate PDF filename based on membership
      const membershipPrefix = cleanTier 
        ? (cleanTier.charAt(0).toUpperCase() + cleanTier.slice(1)) + 'Membership'
        : (membership.name || 'Membership').replace(/[^a-zA-Z0-9]/g, '') + 'Membership';
      
      const timestamp = Date.now();
      const pdfFilename = `${membershipPrefix}_${timestamp}.pdf`;
      const pdfFilePath = path.join(membershipsDir, pdfFilename);
      
      // Create a basic PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `${membership.name || 'Membership'} Information`,
          Author: 'ALTAYAR VIP',
          Subject: 'Membership Information',
          Creator: 'ALTAYAR VIP System',
        }
      });
      
      // Write PDF to file
      const writeStream = fsSync.createWriteStream(pdfFilePath);
      doc.pipe(writeStream);
      
      // Add content
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#1a4d8c')
        .text('ALTAYAR VIP', 50, 50, { align: 'center' });
      
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(membership.name || 'Membership', 50, 100, { align: 'center' });
      
      let yPos = 150;
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#1a4d8c')
        .text('Membership Information', 50, yPos);
      
      yPos += 30;
      doc.fontSize(11)
        .font('Helvetica')
        .fillColor('#000000');
      
      if (membership.description) {
        doc.text('Description:', 50, yPos);
        yPos += 20;
        doc.text(membership.description, 50, yPos, { width: 495 });
        yPos += 40;
      }
      
      if (cleanTier) {
        doc.text(`Tier: ${cleanTier}`, 50, yPos);
        yPos += 20;
      }
      
      if (membership.price) {
        doc.text(`Price: ${membership.price} EGP`, 50, yPos);
        yPos += 20;
      }
      
      if (membership.duration_days) {
        doc.text(`Duration: ${membership.duration_days} days`, 50, yPos);
        yPos += 20;
      }
      
      if (membership.benefits && Array.isArray(membership.benefits) && membership.benefits.length > 0) {
        yPos += 20;
        doc.font('Helvetica-Bold')
          .text('Benefits:', 50, yPos);
        yPos += 20;
        doc.font('Helvetica');
        membership.benefits.forEach((benefit, index) => {
          doc.text(`${index + 1}. ${benefit}`, 70, yPos, { width: 475 });
          yPos += 20;
        });
      }
      
      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text('© ALTAYAR VIP - Premium Membership Program', 50, pageHeight - 40, { align: 'center' });
      
      doc.end();
      
      // Wait for file to be written
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      
      // Verify file was created
      await fs.access(pdfFilePath);
      pdfPath = pdfFilePath;
      
      // Update membership with PDF URL
      try {
        const relativePath = `memberships/${pdfFilename}`;
        await Membership.query()
          .findById(id)
          .patch({ pdf_url: relativePath });
        console.log(`✅ [Membership PDF Download] Generated and saved PDF: ${pdfFilePath}`);
      } catch (updateError) {
        console.warn('⚠️ [Membership PDF Download] Could not update membership pdf_url:', updateError.message);
      }
      
    } catch (generateError) {
      console.error('❌ [Membership PDF Download] Error generating PDF:', generateError);
      return res.status(500).json({
        success: false,
        message: 'Error generating membership PDF',
        error: process.env.NODE_ENV === 'development' ? generateError.message : undefined
      });
    }
  }
  
  if (!pdfPath) {
    console.error(`❌ [Membership PDF Download] PDF not found and could not generate for membership ID: ${id}, Name: "${membership.name}", Tier: "${cleanTier}"`);
    return res.status(404).json({
      success: false,
      message: 'PDF file not available for this membership and could not be generated'
    });
  }
  
  console.log(`✅ [Membership PDF Download] Successfully found PDF: ${pdfPath}`);

  // Track the download
  if (userId) {
    try {
      await DownloadTracking.trackDownload(userId, 'membership_pdf', `${membership.name}_membership.pdf`, pdfPath, {
        source: 'web',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        membership_id: id,
        action: 'download'
      });
    } catch (trackError) {
      console.log('⚠️ [DOWNLOAD TRACKING] Could not track PDF download:', trackError.message);
    }
  }
  
  try {
    // Check if file exists
    await fs.access(pdfPath);
    
    // Generate safe filename for Content-Disposition header
    const filename = `${membership.name || 'membership'}_membership.pdf`;
    const contentDisposition = encodeContentDisposition(filename, 'attachment');
    
    // Set CORS headers for cross-origin requests (React Native, web browsers)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, Accept-Ranges');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length, Content-Range, Accept-Ranges');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Set headers for PDF download (attachment)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Don't cache downloads
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Accept-Ranges', 'bytes'); // Support range requests for partial content
    res.setHeader('X-Content-Type-Options', 'nosniff'); // Security header
    
    // Send the file
    res.sendFile(pdfPath);
  } catch (error) {
    console.error('Error serving membership PDF:', error);
    // Don't send response if headers already sent
    if (!res.headersSent) {
      res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }
  }
});

// Get download statistics (Admin only)
const getDownloadStats = asyncHandler(async (req, res) => {
  const { membershipId } = req.query;

  let query = DownloadTracking.query()
    .select('membership_id', 'download_type')
    .count('* as download_count')
    .groupBy('membership_id', 'download_type');

  if (membershipId) {
    query = query.where('membership_id', membershipId);
  }

  const stats = await query;

  res.json({
    success: true,
    data: stats
  });
});

// Get user's membership card
const getMembershipCard = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        data: null
      });
    }

    // Fetch user with membership relation
    let user;
    try {
      user = await User.query()
        .findById(userId)
        .withGraphFetched('membership');
    } catch (error) {
      console.error('Error fetching user for membership card:', error);
      return res.status(200).json({
        success: false,
        message: 'Error fetching user data',
        data: null
      });
    }

    if (!user) {
      return res.status(200).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    // Safely extract user name
    const userName = user.name || 
      (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : '') ||
      user.first_name || 
      user.last_name || 
      'User';

    // If user doesn't have membership, return 200 with empty data instead of 404
    if (!user.membership_id || !user.membership) {
      return res.status(200).json({
        success: true,
        message: 'No active membership found. Please subscribe to a membership plan.',
        data: {
          hasMembership: false,
          membership_number: null,
          user_name: userName,
          user_email: user.email || '',
          membership_type: null,
          subscription_date: null,
          points_balance: user.points || 0,
          cashback_balance: user.cashback || 0,
          benefits: []
        }
      });
    }

    // Safely extract membership data
    const membership = user.membership || {};
    const membershipName = membership.name || membership.membership_type || 'Standard';
    const membershipBenefits = Array.isArray(membership.benefits) 
      ? membership.benefits 
      : (membership.benefits ? JSON.parse(membership.benefits) : []);

    const membershipCard = {
      hasMembership: true,
      membership_number: `ALT-${user.id.toString().padStart(6, '0')}`,
      user_name: userName,
      user_email: user.email || '',
      membership_type: membershipName,
      subscription_date: user.membership_subscription_date || user.created_at || new Date().toISOString(),
      expiry_date: user.membership_expiry_date || null,
      points_balance: user.points || 0,
      cashback_balance: user.cashback || 0,
      benefits: membershipBenefits || []
    };

    res.status(200).json({
      success: true,
      data: membershipCard
    });
  } catch (error) {
    console.error('Error in getMembershipCard:', error);
    res.status(200).json({
      success: false,
      message: 'Error fetching membership card',
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Subscribe to membership
const subscribeToMembership = asyncHandler(async (req, res) => {
  const { membershipId } = req.body;
  const userId = req.user.id;

  const membership = await Membership.query()
    .findById(membershipId)
    .where('is_active', true);

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: 'Membership not found'
    });
  }

  const user = await User.query().findById(userId);

  // Check if user has enough points or can afford the membership
  if (user.points < membership.points) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient points for this membership'
    });
  }

  // Calculate new points and cashback (if membership has welcome bonus)
  const newPoints = user.points - membership.points + (membership.welcome_points || 0);
  const newCashback = parseFloat(user.cashback || 0) + (membership.welcome_cashback || 0);

  // Update user's membership
  const updatedUser = await User.query()
    .findById(userId)
    .patchAndFetch({
      membership_id: membershipId,
      points: newPoints,
      cashback: newCashback,
      membership_subscription_date: new Date().toISOString(),
      membership_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    });

  // Generate and save membership card PDF
  let pdfUrl = null;
  try {
    const pdfBuffer = await generateMembershipCardPDF(membership, updatedUser);
    const filename = `membership_${userId}_${Date.now()}.pdf`;
    pdfUrl = await saveMembershipPDF(pdfBuffer, filename);
    
    // Update membership with PDF URL if not exists
    if (!membership.pdf_url) {
      await Membership.query()
        .findById(membershipId)
        .patch({ pdf_url: pdfUrl });
    }
  } catch (pdfError) {
    console.error('Error generating membership PDF:', pdfError);
    // Don't fail the subscription if PDF generation fails
  }

  // Create transaction record
  await Transaction.query().insert({
    user_id: userId,
    type: 'membership_purchase',
    amount: -membership.price || 0,
    points_change: -membership.points,
    cashback_change: membership.welcome_cashback || 0,
    description: `Subscription to ${membership.name}`,
    reference_id: membershipId.toString(), // Store membership ID for easy lookup
    status: 'completed'
    });

  // Track the subscription
  await DownloadTracking.query().insert({
    user_id: userId,
    membership_id: membershipId,
    download_type: 'membership_subscription',
    file_path: pdfUrl,
    ip_address: req.ip,
    user_agent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Successfully subscribed to membership',
    data: {
      membership: membership,
      remaining_points: newPoints,
      pdf_url: pdfUrl,
      membership_card: {
        membership_number: `ALT-${userId.toString().padStart(6, '0')}`,
        subscription_date: updatedUser.membership_subscription_date,
        expiry_date: updatedUser.membership_expiry_date
      }
    }
  });
});

// Get bookings related to a membership (Admin only)
// @desc    Get all bookings/subscriptions/payments related to a membership
// @route   GET /api/memberships/:id/bookings
// @access  Private (super_admin, admin, accountant)
const getMembershipBookings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const Booking = require('../models/Booking');
  const { db } = require('../config/db');

  // Verify membership exists
  const membership = await Membership.query().findById(id);
  if (!membership) {
    return res.status(404).json({
      success: false,
      message: 'Membership not found'
    });
  }

  // Get all users who have this membership
  const usersWithMembership = await User.query()
    .where('membership_id', id)
    .select('id');

  const userIds = usersWithMembership.map(u => u.id);

  // Get all bookings from users with this membership
  let bookings = [];
  if (userIds.length > 0) {
    bookings = await Booking.query()
      .whereIn('user_id', userIds)
      .withGraphFetched('user(selectNameAndEmail)')
      .modifiers({
        selectNameAndEmail(builder) {
          builder.select('id', 'name', 'email');
        }
      })
      .orderBy('created_at', 'desc');
  }

  // Get all transactions related to this membership (subscriptions)
  // Search by reference_id (primary method) and payment_details JSON field (fallback)
  const transactions = await Transaction.query()
    .where('type', 'membership_purchase')
    .where(function() {
      // Primary: Check reference_id field (most reliable)
      this.where('reference_id', id.toString())
        // Fallback: Check payment_details JSON field if it contains membership info
        // Handle NULL payment_details safely
        .orWhere(function() {
          this.whereNotNull('payment_details')
            .andWhere(function() {
              this.whereRaw(`payment_details::text LIKE ?`, [`%"membership_id":${id}%`])
                .orWhereRaw(`payment_details::text LIKE ?`, [`%"membershipId":${id}%`])
                .orWhereRaw(`payment_details::text LIKE ?`, [`%"membership_id":"${id}"%`])
                .orWhereRaw(`payment_details::text LIKE ?`, [`%"membershipId":"${id}"%`]);
            });
        });
    })
    .withGraphFetched('user(selectNameAndEmail)')
    .modifiers({
      selectNameAndEmail(builder) {
        builder.select('id', 'name', 'email');
      }
    })
    .orderBy('created_at', 'desc');

  // Separate bookings by status
  const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'paid');
  const pendingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');

  res.json({
    success: true,
    data: {
      membership: {
        id: membership.id,
        name: membership.name,
        tier: membership.tier,
      },
      summary: {
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        pendingBookings: pendingBookings.length,
        totalSubscriptions: transactions.length,
      },
      bookings: bookings.map(b => ({
        id: b.id,
        userId: b.user_id,
        userName: b.user?.name || 'Unknown',
        userEmail: b.user?.email || '',
        status: b.status,
        // CRITICAL FIX: Ensure totalPrice is always a number, not a string
        totalPrice: typeof b.total_price === 'string' 
          ? parseFloat(b.total_price) || 0 
          : (typeof b.total_price === 'number' ? b.total_price : 0),
        bookingType: b.booking_type,
        createdAt: b.created_at,
      })),
      subscriptions: transactions.map(t => ({
        id: t.id,
        userId: t.user_id,
        userName: t.user?.name || 'Unknown',
        userEmail: t.user?.email || '',
        // CRITICAL FIX: Ensure amount is always a number, not a string
        amount: typeof t.amount === 'string' 
          ? parseFloat(t.amount) || 0 
          : (typeof t.amount === 'number' ? t.amount : 0),
        status: t.status,
        createdAt: t.created_at,
      })),
      completedBookings: completedBookings.map(b => ({
        id: b.id,
        userId: b.user_id,
        userName: b.user?.name || 'Unknown',
        userEmail: b.user?.email || '',
        status: b.status,
        // CRITICAL FIX: Ensure totalPrice is always a number, not a string
        totalPrice: typeof b.total_price === 'string' 
          ? parseFloat(b.total_price) || 0 
          : (typeof b.total_price === 'number' ? b.total_price : 0),
        bookingType: b.booking_type,
        createdAt: b.created_at,
      })),
    }
  });
});

module.exports = {
  getMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
  viewMembershipPDF, // NEW: View PDF inline
  downloadMembershipPDF, // Updated: Download PDF as attachment
  getDownloadStats,
  getMembershipCard,
  subscribeToMembership,
  getMembershipBookings // NEW: Get bookings related to membership
};