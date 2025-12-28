/**
 * Report Controller
 * Handles PDF report generation for users
 * Secure and professional implementation with proper error handling
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const https = require('https');
const asyncHandler = require('express-async-handler');
const { db } = require('../config/db');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const Transaction = require('../models/Transaction');
const Membership = require('../models/Membership');
const {
  registerCairoFonts,
  formatTextForPDF,
  cleanText,
  isArabic,
} = require('../utils/pdfFontHelper');

/**
 * CRITICAL: Translate Arabic text to English using Google Translate API
 * This ensures all text in PDF is clear and readable
 */
function translateToEnglish(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return Promise.resolve(text);
  }
  
  // Check if text contains Arabic characters
  const arabicRegex = /[\u0600-\u06FF]/;
  if (!arabicRegex.test(text)) {
    return Promise.resolve(text); // Already in English or no Arabic
  }
  
  return new Promise((resolve) => {
    try {
      const encodedText = encodeURIComponent(text);
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodedText}`;
      
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result && result[0] && Array.isArray(result[0])) {
              const translated = result[0]
                .map(item => item[0] || '')
                .join('')
                .trim();
              resolve(translated || text);
            } else {
              resolve(text);
            }
          } catch (parseError) {
            console.log('⚠️ [PDF] Translation parse error, using original text');
            resolve(text);
          }
        });
      }).on('error', (error) => {
        console.log('⚠️ [PDF] Translation error, using original text:', error.message);
        resolve(text);
      }).setTimeout(5000, () => {
        console.log('⚠️ [PDF] Translation timeout, using original text');
        resolve(text);
      });
    } catch (error) {
      console.log('⚠️ [PDF] Translation failed, using original text:', error.message);
      resolve(text);
    }
  });
}

/**
 * Generate user report PDF
 * GET /api/reports/user-pdf
 * @access Private
 */
exports.generateUserReportPDF = asyncHandler(async (req, res) => {
  // CRITICAL: Handle OPTIONS preflight requests for CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(200).end();
  }

  // Debug logging for PDF generation requests
  if (process.env.NODE_ENV === 'development') {
    console.log('📄 [PDF REQUEST]', {
      path: req.path,
      url: req.url,
      hasUser: !!req.user,
      userId: req.user?.id,
      hasTokenInQuery: !!(req.query && req.query.token),
      hasTokenInHeader: !!(req.headers.authorization),
      timestamp: new Date().toISOString()
    });
  }

  const userId = req.user?.id;

  // Validate user ID
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  try {
    // Fetch user data
    const user = await User.query().findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Fetch membership with error handling
    // Note: memberships table doesn't have user_id, use user.membership_id instead
    let membership = null;
    try {
      if (user.membership_id) {
        membership = await Membership.query()
          .findById(user.membership_id)
          .first();
      }
    } catch (error) {
      console.error('Error fetching membership for PDF:', error);
      membership = null;
    }

    // Fetch bookings with error handling
    let bookings = [];
    try {
      bookings = await Booking.query()
        .where('user_id', userId)
        .orderBy('created_at', 'desc');
      if (!Array.isArray(bookings)) {
        bookings = [];
      }
    } catch (error) {
      console.error('Error fetching bookings for PDF:', error);
      bookings = [];
    }

    // Fetch trips with error handling
    let trips = [];
    try {
      trips = await Trip.query()
        .where('user_id', userId)
        .orderBy('start_date', 'desc');
      if (!Array.isArray(trips)) {
        trips = [];
      }
    } catch (error) {
      console.error('Error fetching trips for PDF:', error);
      trips = [];
    }

    // Fetch transactions with error handling
    let transactions = [];
    try {
      transactions = await Transaction.query()
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(50);
      if (!Array.isArray(transactions)) {
        transactions = [];
      }
    } catch (error) {
      console.error('Error fetching transactions for PDF:', error);
      transactions = [];
    }

    // Calculate statistics with safe defaults
    const totalBookings = Array.isArray(bookings) ? bookings.length : 0;
    const totalTrips = Array.isArray(trips) ? trips.length : 0;
    const totalSpent = Array.isArray(transactions)
      ? transactions
          .filter(t => t && typeof t.amount === 'number' && t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      : 0;
    const totalCashback = Array.isArray(transactions)
      ? transactions
          .filter(t => t && t.type === 'cashback' && typeof t.amount === 'number' && t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0)
      : 0;
    const pendingPayments = Array.isArray(transactions)
      ? transactions
          .filter(t => 
            t && 
            typeof t.amount === 'number' && 
            t.amount < 0 && 
            (t.type === 'invoice_payment' || t.type === 'booking_payment')
          )
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      : 0;

    // Create PDF document with error handling
    let doc;
    let hasCairo = false;
    try {
      doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `User Report - ${user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User'}`,
          Author: 'ALTAYAR VIP',
          Subject: 'User Activity Report',
          Creator: 'ALTAYAR VIP System',
        },
      });
      
      // Register Cairo fonts for Arabic support
      try {
        const { cairoRegular, cairoBold } = await registerCairoFonts(doc);
        hasCairo = !!(cairoRegular && cairoBold);
      } catch (fontError) {
        console.warn('⚠️ [PDF] Cairo fonts not available, using Helvetica:', fontError.message);
        hasCairo = false;
      }
      
      // Set default font
      doc.font('Helvetica');
    } catch (pdfError) {
      console.error('Error creating PDF document:', pdfError);
      return res.status(500).json({
        success: false,
        message: 'Error initializing PDF generation',
        error: process.env.NODE_ENV === 'development' ? pdfError.message : undefined,
      });
    }

    // Set response headers for PDF download
    // CRITICAL: Add CORS headers to allow cross-origin requests (for React Native and web)
    const sanitizedFileName = `user_report_${user.id}_${Date.now()}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // CORS headers for PDF downloads
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // PDF content headers - Use inline for browser viewing, attachment for download
    // Check if user wants to download (via query parameter) or view inline
    const shouldDownload = req.query.download === 'true' || req.query.download === '1';
    const disposition = shouldDownload ? 'attachment' : 'inline';
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${sanitizedFileName}"`
    );
    
    // Cache control - allow caching for inline viewing, no cache for downloads
    if (shouldDownload) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    }
    
    // Support range requests for better PDF viewing
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Handle PDF generation errors
    doc.on('error', (error) => {
      console.error('PDF generation error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error generating PDF',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
      }
    });

    // Pipe PDF to response
    doc.pipe(res);

    // Helper function to safely get text value
    const safeText = (value, defaultValue = 'N/A') => {
      if (value === null || value === undefined) return defaultValue;
      return String(value);
    };

    // Helper function to safely format date
    const safeDate = (dateValue) => {
      if (!dateValue) return 'N/A';
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } catch (error) {
        return 'N/A';
      }
    };

    // Helper function to format date and time
    const safeDateTime = (dateValue) => {
      if (!dateValue) return 'N/A';
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return 'N/A';
      }
    };

    // Safely extract user name - handle both name and first_name/last_name formats
    let userName = '';
    if (user.first_name || user.last_name) {
      userName = `${safeText(user.first_name)} ${safeText(user.last_name)}`.trim();
    } else if (user.name) {
      userName = safeText(user.name);
    }
    if (!userName) {
      userName = 'User';
    }

    // ============================================
    // PROFESSIONAL PDF DESIGN WITH ALTAYAR LOGO
    // ============================================

    // Define colors (Professional Altayar Theme - Enhanced)
    const colors = {
      primary: '#1a237e',      // Deep Blue (Altayar primary)
      secondary: '#0d47a1',   // Dark Blue
      accent: '#1976d2',       // Medium Blue
      accentLight: '#42a5f5', // Light Blue for highlights
      success: '#4caf50',      // Green
      warning: '#ff9800',      // Orange
      danger: '#f44336',       // Red
      text: '#212121',         // Dark Gray
      textLight: '#757575',    // Light Gray
      background: '#fafafa',   // Very Light Gray Background (enhanced)
      border: '#e0e0e0',       // Border Gray
      headerGradient: '#283593' // Darker blue for gradient effect
    };

    // Helper function to draw a colored box
    const drawBox = (x, y, width, height, color, fill = true) => {
      if (fill) {
        doc.rect(x, y, width, height).fillColor(color).fill();
      } else {
        doc.rect(x, y, width, height).strokeColor(color).lineWidth(1).stroke();
      }
    };

    // Helper function to draw a section header (Clean, no icons, with smart page break)
    const drawSectionHeader = (title, y) => {
      const pageWidth = doc.page.width;
      const margin = 50;
      const headerHeight = 24; // Further reduced
      
      // Ensure header doesn't get orphaned at bottom of page
      const footerHeight = 50;
      const minSpaceAfterHeader = 50; // Minimum space needed after header
      if (y + headerHeight + minSpaceAfterHeader > doc.page.height - footerHeight && y > margin + 100) {
        doc.addPage();
        y = margin;
      }
      
      // Draw colored header background with gradient effect
      doc.rect(margin, y, pageWidth - (margin * 2), headerHeight)
        .fillColor(colors.primary)
        .fill();
      
      // Add decorative line on left
      doc.rect(margin, y, 4, headerHeight)
        .fillColor(colors.accent)
        .fill();
      
      // Add title text (no icon)
      doc.fontSize(13)
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .text(title, margin + 12, y + 5, {
          width: pageWidth - (margin * 2) - 20,
          align: 'left'
        });
      
      // Reset font
      doc.font('Helvetica');
      
      return y + headerHeight + 4; // Minimal spacing
    };

    // Helper function to draw text with Cairo font and RTL support
    const drawTextWithFont = (text, x, y, options = {}) => {
      if (!text) return;
      
      const formatted = formatTextForPDF(String(text), hasCairo);
      const fontSize = options.fontSize || doc._fontSize || 12;
      const color = options.color || colors.text || '#000000';
      
      // Set font size and color
      doc.fontSize(fontSize)
         .fillColor(color);
      
      const textOptions = {
        ...options,
        font: formatted.font,
        align: formatted.alignment || options.align || 'left',
      };
      
      // Remove fontSize and color from textOptions to avoid conflicts
      delete textOptions.fontSize;
      delete textOptions.color;
      
      doc.text(formatted.text, x, y, textOptions);
    };

    // Helper function to draw bold text with Cairo font and RTL support
    const drawBoldTextWithFont = (text, x, y, options = {}) => {
      if (!text) return;
      
      const formatted = formatTextForPDF(String(text), hasCairo);
      const textOptions = {
        ...options,
        font: formatted.boldFont,
        align: formatted.alignment || options.align || 'left',
      };
      
      doc.text(formatted.text, x, y, textOptions);
    };

    // Helper function to draw an info card (Enhanced with accent color)
    // CRITICAL: Use translated text (translation should be done before calling this)
    const drawInfoCard = (label, value, x, y, width) => {
      const cardHeight = 35; // Reduced from 40 to save space
      const padding = 8;
      
      // Draw card background with subtle shadow effect
      doc.rect(x, y, width, cardHeight)
        .fillColor('#ffffff')
        .fill()
        .strokeColor(colors.border)
        .lineWidth(0.5)
        .stroke();
      
      // Add accent color bar on left
      doc.rect(x, y, 3, cardHeight)
        .fillColor(colors.accent)
        .fill();
      
      // Label (smaller) - use formatted text with Cairo support
      doc.fontSize(8)
        .fillColor(colors.textLight);
      drawTextWithFont(String(label), x + padding + 2, y + 3, {
        width: width - (padding * 2) - 2
      });
      
      // Value (slightly smaller) - use formatted text with Cairo support
      doc.fontSize(11)
        .fillColor(colors.text);
      drawBoldTextWithFont(String(value), x + padding + 2, y + 15, {
        width: width - (padding * 2) - 2
      });
      
      // Reset font
      doc.font('Helvetica');
    };

    // Helper function to check if we need a new page (SMART - prevents orphaned content)
    const checkPageBreak = (requiredHeight) => {
      const footerHeight = 50;
      const pageHeight = doc.page.height;
      const availableHeight = pageHeight - footerHeight - currentY;
      const minContentToKeep = 100; // Minimum content to keep on current page before breaking
      
      // If we don't have enough space for the required content
      if (availableHeight < requiredHeight) {
        // Check if current page has enough content to justify keeping it
        const currentPageContent = currentY - margin;
        
        // If we have significant content on current page, add new page
        if (currentPageContent >= minContentToKeep) {
          doc.addPage();
          currentY = margin;
          return true;
        }
        // If current page has little content AND required content is large, 
        // try to fit more on current page by reducing spacing
        else if (requiredHeight > 200 && availableHeight > 50) {
          // Try to fit at least part of the content on current page
          // This prevents creating pages with just a header
          return false; // Don't break, try to fit content
        }
        // If both are small, add new page to keep content together
        else {
          doc.addPage();
          currentY = margin;
          return true;
        }
      }
      return false;
    };
    
    // Helper function to ensure section fits completely on page (prevents orphaned headers)
    const ensureSectionFits = (sectionHeight) => {
      const footerHeight = 50;
      const pageHeight = doc.page.height;
      const availableHeight = pageHeight - footerHeight - currentY;
      
      // If section won't fit, move to next page
      if (availableHeight < sectionHeight) {
        // Only move if current page has content
        if (currentY > margin + 80) {
          doc.addPage();
          currentY = margin;
          return true;
        }
      }
      return false;
    };

    // ============================================
    // HEADER WITH ALTAYAR LOGO IMAGE
    // ============================================
    const pageWidth = doc.page.width;
    const margin = 50;
    let currentY = margin;

    // Draw header background with gradient effect (enhanced)
    const headerHeight = 100; // Increased to accommodate larger logo
    // Main header background
    doc.rect(0, 0, pageWidth, headerHeight)
      .fillColor(colors.primary)
      .fill();
    // Gradient effect overlay (darker bottom)
    doc.rect(0, headerHeight - 10, pageWidth, 10)
      .fillColor(colors.headerGradient)
      .fill();

    // CRITICAL: Try multiple paths for app logo/icon
    let logoAdded = false;
    const logoPaths = [
      path.join(__dirname, '../uploads/logos/altayarvip.png'),
      path.join(__dirname, '../lib/assets/images/icon.png'),
      path.join(__dirname, '../assets/images/icon.png'),
    ];
    
    for (const logoPath of logoPaths) {
      try {
        if (fs.existsSync(logoPath)) {
          // Larger logo size for better visibility
          const logoWidth = 150;
          const logoHeight = 80;
          // Center the logo horizontally
          const logoX = (pageWidth - logoWidth) / 2;
          const logoY = 10;
          
          doc.image(logoPath, logoX, logoY, {
            width: logoWidth,
            height: logoHeight,
            fit: [logoWidth, logoHeight],
            align: 'center'
          });
          logoAdded = true;
          console.log('✅ [PDF] Logo added successfully from:', logoPath);
          break;
        }
      } catch (logoError) {
        // Try next path
        continue;
      }
    }
    
    if (!logoAdded) {
      console.log('⚠️ [PDF] Logo not found in any path, continuing without logo');
    }

    // Report Title (Centered below logo, only if logo is added)
    if (logoAdded) {
      doc.fontSize(16)
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .text('User Activity Report', margin, 95, {
          width: pageWidth - (margin * 2),
          align: 'center'
        });
    } else {
      // Fallback: Show title if logo not found
      doc.fontSize(28)
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .text('ALTAYAR', margin, 35, {
          width: pageWidth - (margin * 2),
          align: 'center'
        });
      
      doc.fontSize(16)
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .text('User Activity Report', margin, 70, {
          width: pageWidth - (margin * 2),
          align: 'center'
        });
    }

    // CRITICAL FIX: Reset font to built-in Helvetica to avoid TTF font errors
    // Only use built-in fonts: Helvetica, Helvetica-Bold, Times-Roman, Courier
    doc.font('Helvetica'); // Built-in font - no TTF required
    currentY = headerHeight + 15; // Reduced spacing

    // ============================================
    // USER INFORMATION SECTION (Compact Cards - 3 per row)
    // CRITICAL: Translate Arabic text to English for clarity
    // ============================================
    currentY = drawSectionHeader('User Information', currentY);
    
    // CRITICAL: Use Arabic text directly if Cairo fonts are available
    // Otherwise, translate to English for better readability
    const userNameFormatted = formatTextForPDF(userName, hasCairo);
    const emailFormatted = formatTextForPDF(safeText(user.email), hasCairo);
    const roleFormatted = formatTextForPDF(safeText(user.role), hasCairo);
    
    // Use original Arabic text if Cairo is available, otherwise translate
    let translatedUserName = userName;
    let translatedEmail = safeText(user.email);
    let translatedRole = safeText(user.role);
    
    if (hasCairo) {
      // Use Arabic text directly with Cairo font
      translatedUserName = userNameFormatted.isArabic ? cleanText(userName) : userName;
      translatedEmail = emailFormatted.isArabic ? cleanText(safeText(user.email)) : safeText(user.email);
      translatedRole = roleFormatted.isArabic ? cleanText(safeText(user.role)) : safeText(user.role);
    } else {
      // Translate Arabic to English if Cairo not available
      if (userNameFormatted.isArabic) {
        translatedUserName = await translateToEnglish(userName);
      }
      if (emailFormatted.isArabic) {
        translatedEmail = await translateToEnglish(safeText(user.email));
      }
      if (roleFormatted.isArabic) {
        translatedRole = await translateToEnglish(safeText(user.role));
      }
    }
    
    // Use 3 cards per row to save space
    const cardWidth = (pageWidth - (margin * 2) - 30) / 3; // 3 cards per row
    const cardSpacing = 15;
    let cardX = margin;
    let cardY = currentY;

    // Row 1: Name, Email, Phone
    const displayName = translatedUserName.length > 20 ? translatedUserName.substring(0, 20) + '...' : translatedUserName;
    drawInfoCard('Full Name', displayName, cardX, cardY, cardWidth);
    cardX += cardWidth + cardSpacing;

    const displayEmail = translatedEmail.length > 25 ? translatedEmail.substring(0, 25) + '...' : translatedEmail;
    drawInfoCard('Email', displayEmail, cardX, cardY, cardWidth);
    cardX += cardWidth + cardSpacing;

    if (user.phone) {
      drawInfoCard('Phone', safeText(user.phone), cardX, cardY, cardWidth);
    } else {
      drawInfoCard('Role', translatedRole.toUpperCase(), cardX, cardY, cardWidth);
    }
    
    cardX = margin;
    cardY += 40; // Reduced from 50

    // Row 2: Role, Member Since
    if (user.phone) {
      drawInfoCard('Role', translatedRole.toUpperCase(), cardX, cardY, cardWidth);
      cardX += cardWidth + cardSpacing;
    }
    
    drawInfoCard('Member Since', safeDate(user.created_at), cardX, cardY, cardWidth);
    
    // Add decorative separator line (only if there's space)
    if (cardY + 45 < doc.page.height - 100) {
      doc.moveTo(margin, cardY + 45)
        .lineTo(pageWidth - margin, cardY + 45)
        .strokeColor(colors.border)
        .lineWidth(0.5)
        .stroke();
      currentY = cardY + 50;
    } else {
      currentY = cardY + 40;
    }

    // ============================================
    // MEMBERSHIP INFORMATION SECTION (Compact)
    // ============================================
    // Calculate section height first
    const membershipSectionHeight = membership ? 120 : 50;
    ensureSectionFits(membershipSectionHeight);

    currentY = drawSectionHeader('Membership Information', currentY);
    
    if (membership) {
      cardX = margin;
      cardY = currentY;
      const compactCardWidth = (pageWidth - (margin * 2) - 20) / 2; // 2 cards per row

      // CRITICAL: Use Arabic text if Cairo available, otherwise translate
      const membershipTypeFormatted = formatTextForPDF(safeText(membership.membership_type || membership.name), hasCairo);
      const statusFormatted = formatTextForPDF(safeText(membership.status, 'Active'), hasCairo);
      
      let translatedMembershipType = safeText(membership.membership_type || membership.name);
      let translatedStatus = safeText(membership.status, 'Active');
      
      if (hasCairo) {
        translatedMembershipType = membershipTypeFormatted.isArabic 
          ? cleanText(safeText(membership.membership_type || membership.name))
          : safeText(membership.membership_type || membership.name);
        translatedStatus = statusFormatted.isArabic
          ? cleanText(safeText(membership.status, 'Active'))
          : safeText(membership.status, 'Active');
      } else {
        if (membershipTypeFormatted.isArabic) {
          translatedMembershipType = await translateToEnglish(safeText(membership.membership_type || membership.name));
        }
        if (statusFormatted.isArabic) {
          translatedStatus = await translateToEnglish(safeText(membership.status, 'Active'));
        }
      }
      
      // Row 1: Type and Status
      drawInfoCard('Membership Type', translatedMembershipType.toUpperCase(), cardX, cardY, compactCardWidth);
      cardX += compactCardWidth + 20;

      drawInfoCard('Status', translatedStatus.toUpperCase(), cardX, cardY, compactCardWidth);
      cardX = margin;
      cardY += 40;

      // Row 2: Dates
      if (membership.subscription_date) {
        drawInfoCard('Subscription', safeDate(membership.subscription_date), cardX, cardY, compactCardWidth);
        cardX += compactCardWidth + 20;
      }

      if (membership.expiry_date) {
        drawInfoCard('Expiry Date', safeDate(membership.expiry_date), cardX, cardY, compactCardWidth);
        cardX = margin;
        cardY += 40;
      }

      // Row 3: Cashback (if exists)
      if (membership.cashback_balance !== null && membership.cashback_balance !== undefined) {
        const balance = typeof membership.cashback_balance === 'number' 
          ? membership.cashback_balance.toFixed(2) 
          : '0.00';
        drawInfoCard('Cashback Balance', `${balance} EGP`, cardX, cardY, compactCardWidth);
        cardY += 40;
      }
      
      currentY = cardY + 5; // Minimal spacing
    } else {
      // No membership message (compact)
      doc.fontSize(10)
        .fillColor(colors.textLight)
        .text('No active membership', margin + 10, currentY, {
          width: pageWidth - (margin * 2) - 20
        });
      currentY += 25;
    }

    // ============================================
    // STATISTICS SECTION (Compact - All in one row if possible)
    // ============================================
    // Statistics section is compact, ensure it fits
    ensureSectionFits(80);

    currentY = drawSectionHeader('Statistics Overview', currentY);
    
    // Statistics in a single row (5 cards) to save space
    const statCardWidth = (pageWidth - (margin * 2) - 40) / 5; // 5 cards per row
    cardX = margin;
    cardY = currentY;

    // All statistics in one row (no icons)
    drawInfoCard('Bookings', totalBookings.toString(), cardX, cardY, statCardWidth);
    cardX += statCardWidth + 10;

    drawInfoCard('Trips', totalTrips.toString(), cardX, cardY, statCardWidth);
    cardX += statCardWidth + 10;

    drawInfoCard('Spent', `${totalSpent.toFixed(2)} EGP`, cardX, cardY, statCardWidth);
    cardX += statCardWidth + 10;

    drawInfoCard('Cashback', `${totalCashback.toFixed(2)} EGP`, cardX, cardY, statCardWidth);
    cardX += statCardWidth + 10;

    drawInfoCard('Pending', `${pendingPayments.toFixed(2)} EGP`, cardX, cardY, statCardWidth);
    
    currentY = cardY + 35; // Reduced spacing

    // ============================================
    // RECENT BOOKINGS SECTION (Compact Table)
    // ============================================
    // Calculate table height: header (24) + section header (24) + rows (8 * 20) + spacing (20) = ~220
    const bookingsTableHeight = 24 + 24 + (8 * 20) + 20;
    ensureSectionFits(bookingsTableHeight);

    currentY = drawSectionHeader('Recent Bookings', currentY);

    if (Array.isArray(bookings) && bookings.length > 0) {
      // Compact table header
      const tableTop = currentY;
      const tableLeft = margin;
      const colWidths = {
        num: 25,
        package: pageWidth - (margin * 2) - 180,
        status: 70,
        amount: 85
      };
      const rowHeight = 20; // Reduced from 25
      let tableY = tableTop;

      // Draw table header background
      doc.rect(tableLeft, tableY, pageWidth - (margin * 2), rowHeight)
        .fillColor(colors.secondary)
        .fill();

      // Header text (smaller)
      doc.fontSize(9)
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .text('#', tableLeft + 3, tableY + 5, { width: colWidths.num })
        .text('Package', tableLeft + colWidths.num + 3, tableY + 5, { width: colWidths.package })
        .text('Status', tableLeft + colWidths.num + colWidths.package + 3, tableY + 5, { width: colWidths.status })
        .text('Amount', tableLeft + colWidths.num + colWidths.package + colWidths.status + 3, tableY + 5, { width: colWidths.amount })
        .font('Helvetica');
      
      tableY += rowHeight;

      // CRITICAL: Translate all booking data before rendering
      // Table rows (show only 8 instead of 10 to save space)
      const bookingsToRender = bookings.slice(0, 8);
      for (let index = 0; index < bookingsToRender.length; index++) {
        const booking = bookingsToRender[index];
        if (!booking) continue;
        
        // Check if row fits on current page, if not move to next page
        const footerHeight = 50;
        if (tableY + rowHeight > doc.page.height - footerHeight && index > 0) {
          // Only break if we're not at the first row
          doc.addPage();
          tableY = margin + 24; // Reset to after section header
          // Redraw table header on new page
          doc.rect(tableLeft, tableY, pageWidth - (margin * 2), rowHeight)
            .fillColor(colors.secondary)
            .fill();
          doc.fontSize(9)
            .fillColor('#ffffff')
            .font('Helvetica-Bold')
            .text('#', tableLeft + 3, tableY + 5, { width: colWidths.num })
            .text('Package', tableLeft + colWidths.num + 3, tableY + 5, { width: colWidths.package })
            .text('Status', tableLeft + colWidths.num + colWidths.package + 3, tableY + 5, { width: colWidths.status })
            .text('Amount', tableLeft + colWidths.num + colWidths.package + colWidths.status + 3, tableY + 5, { width: colWidths.amount })
            .font('Helvetica');
          tableY += rowHeight;
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.rect(tableLeft, tableY, pageWidth - (margin * 2), rowHeight)
            .fillColor(colors.background)
            .fill();
        }

        // CRITICAL: Use Arabic text if Cairo available, otherwise translate
        const packageName = safeText(booking.package_name, 'Package');
        const status = safeText(booking.status);
        const amount = typeof booking.total_amount === 'number' 
          ? booking.total_amount 
          : (typeof booking.totalAmount === 'number' ? booking.totalAmount : 0);
        
        const packageNameFormatted = formatTextForPDF(packageName, hasCairo);
        const statusFormatted = formatTextForPDF(status, hasCairo);
        
        let translatedPackageName = packageName;
        let translatedStatus = status;
        
        if (hasCairo) {
          translatedPackageName = packageNameFormatted.isArabic ? cleanText(packageName) : packageName;
          translatedStatus = statusFormatted.isArabic ? cleanText(status) : status;
        } else {
          if (packageNameFormatted.isArabic) {
            translatedPackageName = await translateToEnglish(packageName);
          }
          if (statusFormatted.isArabic) {
            translatedStatus = await translateToEnglish(status);
          }
        }

        // Use formatted text with proper font support
        doc.fontSize(8)
          .fillColor(colors.text)
          .font('Helvetica')
          .text((index + 1).toString(), tableLeft + 3, tableY + 6, { width: colWidths.num });
        
        // Use drawTextWithFont for package name to ensure proper Arabic rendering
        const packageNameToDisplay = translatedPackageName.length > 30 ? translatedPackageName.substring(0, 30) + '...' : translatedPackageName;
        drawTextWithFont(packageNameToDisplay, tableLeft + colWidths.num + 3, tableY + 6, { 
          width: colWidths.package,
          fontSize: 8,
          color: colors.text
        });
        
        // Use drawTextWithFont for status
        const statusToDisplay = translatedStatus.length > 10 ? translatedStatus.substring(0, 10) : translatedStatus;
        drawTextWithFont(statusToDisplay, tableLeft + colWidths.num + colWidths.package + 3, tableY + 6, { 
          width: colWidths.status,
          fontSize: 8,
          color: colors.text
        });
        
        // Amount (always numeric, use regular font)
        doc.fontSize(8)
          .fillColor(colors.text)
          .font('Helvetica')
          .text(`${amount.toFixed(2)} EGP`, tableLeft + colWidths.num + colWidths.package + colWidths.status + 3, tableY + 6, { width: colWidths.amount });

        // Draw border
        doc.moveTo(tableLeft, tableY + rowHeight)
          .lineTo(tableLeft + pageWidth - (margin * 2), tableY + rowHeight)
          .strokeColor(colors.border)
          .lineWidth(0.3)
          .stroke();

        tableY += rowHeight;
      }

      if (bookings.length > 8) {
        doc.fontSize(8)
          .fillColor(colors.textLight)
          .text(`... and ${bookings.length - 8} more bookings`, tableLeft + 5, tableY + 3);
        tableY += 15;
      }

      currentY = tableY + 5; // Minimal spacing
    } else {
      doc.fontSize(10)
        .fillColor(colors.textLight)
        .text('No bookings found', margin + 10, currentY, {
          width: pageWidth - (margin * 2) - 20
        });
      currentY += 25;
    }

    // ============================================
    // RECENT TRIPS SECTION (Compact Table)
    // ============================================
    // Calculate table height: header (24) + section header (24) + rows (8 * 20) + spacing (20) = ~220
    const tripsTableHeight = 24 + 24 + (8 * 20) + 20;
    ensureSectionFits(tripsTableHeight);

    currentY = drawSectionHeader('Recent Trips', currentY);

    if (Array.isArray(trips) && trips.length > 0) {
      // Compact table header
      const tableTop = currentY;
      const tableLeft = margin;
      const colWidths = {
        num: 25,
        destination: pageWidth - (margin * 2) - 180,
        status: 70,
        cost: 85
      };
      const rowHeight = 20; // Reduced from 25
      let tableY = tableTop;

      // Draw table header background
      doc.rect(tableLeft, tableY, pageWidth - (margin * 2), rowHeight)
        .fillColor(colors.secondary)
        .fill();

      // Header text (smaller)
      doc.fontSize(9)
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .text('#', tableLeft + 3, tableY + 5, { width: colWidths.num })
        .text('Destination', tableLeft + colWidths.num + 3, tableY + 5, { width: colWidths.destination })
        .text('Status', tableLeft + colWidths.num + colWidths.destination + 3, tableY + 5, { width: colWidths.status })
        .text('Cost', tableLeft + colWidths.num + colWidths.destination + colWidths.status + 3, tableY + 5, { width: colWidths.cost })
        .font('Helvetica');
      
      tableY += rowHeight;

      // Table rows (show only 8 instead of 10 to save space)
      trips.slice(0, 8).forEach((trip, index) => {
        if (!trip) return;
        
        // Check if row fits on current page, if not move to next page
        const footerHeight = 50;
        if (tableY + rowHeight > doc.page.height - footerHeight && index > 0) {
          // Only break if we're not at the first row
          doc.addPage();
          tableY = margin + 24; // Reset to after section header
          // Redraw table header on new page
          doc.rect(tableLeft, tableY, pageWidth - (margin * 2), rowHeight)
            .fillColor(colors.secondary)
            .fill();
          doc.fontSize(9)
            .fillColor('#ffffff')
            .font('Helvetica-Bold')
            .text('#', tableLeft + 3, tableY + 5, { width: colWidths.num })
            .text('Destination', tableLeft + colWidths.num + 3, tableY + 5, { width: colWidths.destination })
            .text('Status', tableLeft + colWidths.num + colWidths.destination + 3, tableY + 5, { width: colWidths.status })
            .text('Cost', tableLeft + colWidths.num + colWidths.destination + colWidths.status + 3, tableY + 5, { width: colWidths.cost })
            .font('Helvetica');
          tableY += rowHeight;
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.rect(tableLeft, tableY, pageWidth - (margin * 2), rowHeight)
            .fillColor(colors.background)
            .fill();
        }

        const destination = safeText(trip.destination, 'Destination');
        const status = safeText(trip.status);
        const cost = typeof trip.total_cost === 'number' 
          ? trip.total_cost 
          : (typeof trip.totalCost === 'number' ? trip.totalCost : 0);

        doc.fontSize(8)
          .fillColor(colors.text)
          .text((index + 1).toString(), tableLeft + 3, tableY + 6, { width: colWidths.num })
          .text(destination.length > 25 ? destination.substring(0, 25) + '...' : destination, 
                tableLeft + colWidths.num + 3, tableY + 6, { width: colWidths.destination })
          .text(status.length > 8 ? status.substring(0, 8) : status, tableLeft + colWidths.num + colWidths.destination + 3, tableY + 6, { width: colWidths.status })
          .text(`${cost.toFixed(2)} EGP`, tableLeft + colWidths.num + colWidths.destination + colWidths.status + 3, tableY + 6, { width: colWidths.cost });

        // Draw border
        doc.moveTo(tableLeft, tableY + rowHeight)
          .lineTo(tableLeft + pageWidth - (margin * 2), tableY + rowHeight)
          .strokeColor(colors.border)
          .lineWidth(0.3)
          .stroke();

        tableY += rowHeight;
      });

      if (trips.length > 8) {
        doc.fontSize(8)
          .fillColor(colors.textLight)
          .text(`... and ${trips.length - 8} more trips`, tableLeft + 5, tableY + 3);
        tableY += 15;
      }

      currentY = tableY + 5; // Minimal spacing
    } else {
      doc.fontSize(10)
        .fillColor(colors.textLight)
        .text('No trips found', margin + 10, currentY, {
          width: pageWidth - (margin * 2) - 20
        });
      currentY += 25;
    }

    // ============================================
    // RECENT TRANSACTIONS SECTION (Compact Table)
    // ============================================
    // Calculate table height: header (24) + section header (24) + rows (12 * 18) + spacing (20) = ~260
    const transactionsTableHeight = 24 + 24 + (12 * 18) + 20;
    ensureSectionFits(transactionsTableHeight);

    currentY = drawSectionHeader('Recent Transactions', currentY);

    if (Array.isArray(transactions) && transactions.length > 0) {
      // Compact table header
      const tableTop = currentY;
      const tableLeft = margin;
      const colWidths = {
        num: 20,
        type: 80,
        description: pageWidth - (margin * 2) - 320,
        amount: 85,
        date: 70,
        status: 55
      };
      const rowHeight = 18; // Reduced from 22
      let tableY = tableTop;

      // Draw table header background
      doc.rect(tableLeft, tableY, pageWidth - (margin * 2), rowHeight)
        .fillColor(colors.secondary)
        .fill();

      // Header text (smaller)
      doc.fontSize(8)
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .text('#', tableLeft + 2, tableY + 5, { width: colWidths.num })
        .text('Type', tableLeft + colWidths.num + 2, tableY + 5, { width: colWidths.type })
        .text('Description', tableLeft + colWidths.num + colWidths.type + 2, tableY + 5, { width: colWidths.description })
        .text('Amount', tableLeft + colWidths.num + colWidths.type + colWidths.description + 2, tableY + 5, { width: colWidths.amount })
        .text('Date', tableLeft + colWidths.num + colWidths.type + colWidths.description + colWidths.amount + 2, tableY + 5, { width: colWidths.date })
        .text('Status', tableLeft + colWidths.num + colWidths.type + colWidths.description + colWidths.amount + colWidths.date + 2, tableY + 5, { width: colWidths.status })
        .font('Helvetica');
      
      tableY += rowHeight;

      // Table rows (show only 12 instead of 20 to save space)
      transactions.slice(0, 12).forEach((transaction, index) => {
        if (!transaction) return;
        
        // Check if row fits on current page, if not move to next page
        const footerHeight = 50;
        if (tableY + rowHeight > doc.page.height - footerHeight && index > 0) {
          // Only break if we're not at the first row
          doc.addPage();
          tableY = margin + 24; // Reset to after section header
          // Redraw table header on new page
          doc.rect(tableLeft, tableY, pageWidth - (margin * 2), rowHeight)
            .fillColor(colors.secondary)
            .fill();
          doc.fontSize(8)
            .fillColor('#ffffff')
            .font('Helvetica-Bold')
            .text('#', tableLeft + 2, tableY + 5, { width: colWidths.num })
            .text('Type', tableLeft + colWidths.num + 2, tableY + 5, { width: colWidths.type })
            .text('Description', tableLeft + colWidths.num + colWidths.type + 2, tableY + 5, { width: colWidths.description })
            .text('Amount', tableLeft + colWidths.num + colWidths.type + colWidths.description + 2, tableY + 5, { width: colWidths.amount })
            .text('Date', tableLeft + colWidths.num + colWidths.type + colWidths.description + colWidths.amount + 2, tableY + 5, { width: colWidths.date })
            .text('Status', tableLeft + colWidths.num + colWidths.type + colWidths.description + colWidths.amount + colWidths.date + 2, tableY + 5, { width: colWidths.status })
            .font('Helvetica');
          tableY += rowHeight;
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.rect(tableLeft, tableY, pageWidth - (margin * 2), rowHeight)
            .fillColor(colors.background)
            .fill();
        }

        const amount = typeof transaction.amount === 'number' ? transaction.amount : 0;
        const sign = amount >= 0 ? '+' : '';
        const type = safeText(transaction.type, 'Transaction');
        const description = safeText(transaction.description);
        const date = safeDate(transaction.created_at);
        const status = safeText(transaction.status);
        
        // Color code amount (green for positive, red for negative)
        const amountColor = amount >= 0 ? colors.success : colors.danger;

        doc.fontSize(7)
          .fillColor(colors.text)
          .text((index + 1).toString(), tableLeft + 2, tableY + 5, { width: colWidths.num })
          .text(type.length > 12 ? type.substring(0, 12) + '...' : type, 
                tableLeft + colWidths.num + 2, tableY + 5, { width: colWidths.type })
          .text(description.length > 20 ? description.substring(0, 20) + '...' : description, 
                tableLeft + colWidths.num + colWidths.type + 2, tableY + 5, { width: colWidths.description })
          .fillColor(amountColor)
          .font('Helvetica-Bold')
          .text(`${sign}${amount.toFixed(2)}`, 
                tableLeft + colWidths.num + colWidths.type + colWidths.description + 2, tableY + 5, { width: colWidths.amount })
          .fillColor(colors.text)
          .font('Helvetica')
          .text(date.length > 8 ? date.substring(0, 8) : date, 
                tableLeft + colWidths.num + colWidths.type + colWidths.description + colWidths.amount + 2, tableY + 5, { width: colWidths.date })
          .text(status.length > 6 ? status.substring(0, 6) : status, 
                tableLeft + colWidths.num + colWidths.type + colWidths.description + colWidths.amount + colWidths.date + 2, tableY + 5, { width: colWidths.status });

        // Draw border
        doc.moveTo(tableLeft, tableY + rowHeight)
          .lineTo(tableLeft + pageWidth - (margin * 2), tableY + rowHeight)
          .strokeColor(colors.border)
          .lineWidth(0.3)
          .stroke();

        tableY += rowHeight;
      });

      if (transactions.length > 12) {
        doc.fontSize(8)
          .fillColor(colors.textLight)
          .text(`... and ${transactions.length - 12} more transactions`, tableLeft + 5, tableY + 3);
        tableY += 15;
      }

      currentY = tableY + 5; // Minimal spacing
    } else {
      doc.fontSize(10)
        .fillColor(colors.textLight)
        .text('No transactions found', margin + 10, currentY, {
          width: pageWidth - (margin * 2) - 20
        });
      currentY += 25;
    }

    // ============================================
    // FOOTER WITH ALTAYAR BRANDING (Smart Footer - Only if enough content)
    // ============================================
    // Check if current page has enough content to justify a footer
    // If content is too little, we'll add footer closer to content to avoid empty pages
    const minContentForFooter = 250; // Minimum content height before adding footer at bottom
    const footerHeight = 50;
    let footerY;
    
    // Calculate optimal footer position
    if (currentY < minContentForFooter && doc.bufferedPageRange().count > 1) {
      // If we're on a page with little content (likely last page), place footer closer
      footerY = currentY + 20; // Place footer 20 points after content
    } else {
      // Normal case: footer at bottom
      footerY = doc.page.height - footerHeight;
    }
    
    // Ensure footer doesn't go beyond page
    if (footerY + footerHeight > doc.page.height) {
      footerY = doc.page.height - footerHeight;
    }
    
    // Ensure footer doesn't overlap with content
    if (footerY < currentY + 15) {
      footerY = currentY + 15;
    }
    
    // Only add footer if we have enough space and it makes sense
    if (footerY + footerHeight <= doc.page.height && currentY > margin + 100) {
      // Draw footer background with gradient
      doc.rect(0, footerY, pageWidth, doc.page.height - footerY)
        .fillColor(colors.primary)
        .fill();
      
      // Gradient effect overlay (darker top)
      doc.rect(0, footerY, pageWidth, 5)
        .fillColor(colors.headerGradient)
        .fill();

      // Footer text (compact, no icon)
      const generatedDate = new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      doc.fontSize(9)
        .fillColor('#ffffff')
        .text(`Generated: ${generatedDate}`, margin, footerY + 8, {
          width: pageWidth - (margin * 2),
          align: 'center'
        });

      doc.fontSize(8)
        .fillColor('#e3f2fd')
        .text('© Altayar Tourism & Travel Services - All Rights Reserved', margin, footerY + 25, {
          width: pageWidth - (margin * 2),
          align: 'center'
        });
      
      // Add decorative line at top of footer
      doc.moveTo(margin, footerY)
        .lineTo(pageWidth - margin, footerY)
        .strokeColor(colors.accent)
        .lineWidth(2)
        .stroke();
    }

    // Finalize PDF
    doc.end();

    // Handle PDF stream completion
    doc.on('end', () => {
      console.log('✅ [PDF GENERATED] PDF report generated successfully:', {
        userId,
        timestamp: new Date().toISOString(),
      });
    });

  } catch (error) {
    console.error('❌ [PDF ERROR] Error generating PDF report:', {
      error: error.message,
      stack: error.stack?.substring(0, 500),
      userId,
      timestamp: new Date().toISOString(),
    });
    
    // If headers already sent, we can't send JSON response
    if (res.headersSent) {
      console.error('⚠️ [PDF ERROR] Headers already sent, cannot send error response');
      return res.end();
    }

    // Set CORS headers even for errors
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get report download URL with token
 * GET /api/reports/download-url
 * @access Private
 * Returns a URL that can be used to download the PDF with token in query string
 */
exports.getReportDownloadUrl = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  // Validate user ID
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  try {
    // Get token from request (header or query)
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    } else if (req.query.access_token) {
      token = req.query.access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token not found',
      });
    }

    // Helper function to get server host/IP for React Native compatibility
    const getServerHost = () => {
      const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'http';
      let host = req.get('host');
      
      // If host is localhost or 127.0.0.1, get actual network IP
      if (!host || host.includes('localhost') || host.includes('127.0.0.1')) {
        const os = require('os');
        const networkInterfaces = os.networkInterfaces();
        let serverIP = process.env.SERVER_IP || '192.168.1.2'; // Use env var or default
        
        // Find first non-internal IPv4 address (prefer 192.168.x.x)
        Object.keys(networkInterfaces).forEach((interfaceName) => {
          networkInterfaces[interfaceName].forEach((iface) => {
            if (iface.family === 'IPv4' && !iface.internal) {
              // Prefer 192.168.x.x addresses for local network
              if (iface.address.startsWith('192.168.')) {
                serverIP = iface.address;
              } else if (serverIP === (process.env.SERVER_IP || '192.168.1.2') && !iface.address.startsWith('127.')) {
                serverIP = iface.address;
              }
            }
          });
        });
        
        host = `${serverIP}:${process.env.PORT || 5000}`;
      }
      
      return { protocol, host, fullUrl: `${protocol}://${host}` };
    };

    const serverInfo = getServerHost();
    const downloadUrl = `${serverInfo.fullUrl}/api/reports/user-pdf?token=${encodeURIComponent(token)}`;

    res.json({
      success: true,
      data: {
        downloadUrl,
        expiresIn: '1 hour', // Token expiry time
        instructions: 'Use this URL to download the PDF. The URL includes the authentication token in the query string.',
      },
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating download URL',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get user report data (without PDF)
 * GET /api/reports/user-data
 * @access Private
 */
exports.getUserReportData = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  // Validate user ID
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  try {
    // Fetch user data
    const user = await User.query().findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Fetch membership with error handling
    // Note: memberships table doesn't have user_id, use user.membership_id instead
    let membership = null;
    try {
      if (user.membership_id) {
        membership = await Membership.query()
          .findById(user.membership_id)
          .first();
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
      membership = null;
    }

    // Fetch bookings with error handling
    let bookings = [];
    try {
      bookings = await Booking.query()
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .catch((err) => {
          console.error('Error in Booking query:', err);
          return [];
        });
      if (!Array.isArray(bookings)) {
        bookings = [];
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      bookings = [];
    }

    // Fetch trips with error handling
    let trips = [];
    try {
      trips = await Trip.query()
        .where('user_id', userId)
        .orderBy('start_date', 'desc');
      if (!Array.isArray(trips)) {
        trips = [];
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      trips = [];
    }

    // Fetch transactions with error handling
    let transactions = [];
    try {
      transactions = await Transaction.query()
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(50);
      if (!Array.isArray(transactions)) {
        transactions = [];
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      transactions = [];
    }

    // Calculate statistics with safe defaults
    const totalBookings = Array.isArray(bookings) ? bookings.length : 0;
    const totalTrips = Array.isArray(trips) ? trips.length : 0;
    const totalSpent = Array.isArray(transactions)
      ? transactions
          .filter(t => t && typeof t.amount === 'number' && t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      : 0;
    const totalCashback = Array.isArray(transactions)
      ? transactions
          .filter(t => t && t.type === 'cashback' && typeof t.amount === 'number' && t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0)
      : 0;
    const pendingPayments = Array.isArray(transactions)
      ? transactions
          .filter(t => 
            t && 
            typeof t.amount === 'number' && 
            t.amount < 0 && 
            (t.type === 'invoice_payment' || t.type === 'booking_payment')
          )
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      : 0;

    // Safely extract user name - handle both name and first_name/last_name formats
    let firstName = '';
    let lastName = '';
    if (user.first_name || user.last_name) {
      firstName = user.first_name || '';
      lastName = user.last_name || '';
    } else if (user.name) {
      // Split name if stored as single field
      const nameParts = user.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // CRITICAL FIX: Get complete membership information
    let completeMembership = null;
    if (membership) {
      completeMembership = {
        id: membership.id,
        name: membership.name || membership.membership_type || 'Standard',
        type: membership.membership_type || membership.name || 'Standard',
        price: membership.price || 0,
        points: membership.points || 0,
        benefits: Array.isArray(membership.benefits) 
          ? membership.benefits 
          : (typeof membership.benefits === 'string' ? JSON.parse(membership.benefits || '[]') : []),
        subscriptionDate: membership.subscription_date || user.membership_subscription_date || null,
        expiryDate: membership.expiry_date || user.membership_expiry_date || null,
        status: membership.status || (membership.expiry_date && new Date(membership.expiry_date) > new Date() ? 'active' : 'expired'),
        cashbackBalance: membership.cashback_balance || user.cashback || 0,
        welcomePoints: membership.welcome_points || 0,
        welcomeCashback: membership.welcome_cashback || 0,
        imageUrl: membership.image_url || null,
        pdfUrl: membership.pdf_url || null
      };
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: firstName,
          lastName: lastName,
          name: user.name || `${firstName} ${lastName}`.trim() || 'User',
          email: user.email || '',
          phone: user.phone || null,
          role: user.role || 'customer',
          points: user.points || 0,
          cashback: user.cashback || 0,
          membershipId: user.membership_id || null,
          profilePictureUrl: user.profile_picture_url || null,
          createdAt: user.created_at || new Date().toISOString(),
          updatedAt: user.updated_at || null,
        },
        membership: completeMembership,
        bookings: Array.isArray(bookings) 
          ? bookings.map(b => {
              try {
                return {
                  id: b?.id || null,
                  packageName: b?.package_name || b?.details?.packageName || null,
                  status: b?.status || null,
                  totalAmount: typeof b?.total_amount === 'number' ? b.total_amount : (typeof b?.totalAmount === 'number' ? b.totalAmount : (typeof b?.total_price === 'number' ? b.total_price : 0)),
                  bookingDate: b?.created_at || b?.booking_date || null,
                  travelDate: b?.travel_date || b?.details?.startDate || null,
                };
              } catch (err) {
                console.error('Error mapping booking:', err);
                return {
                  id: b?.id || null,
                  packageName: null,
                  status: null,
                  totalAmount: 0,
                  bookingDate: null,
                  travelDate: null,
                };
              }
            })
          : [],
        trips: Array.isArray(trips)
          ? trips.map(t => ({
              id: t?.id || null,
              destination: t?.destination || null,
              status: t?.status || null,
              startDate: t?.start_date || t?.startDate || null,
              endDate: t?.end_date || t?.endDate || null,
              totalCost: t?.total_cost || t?.totalCost || 0,
            }))
          : [],
        transactions: Array.isArray(transactions)
          ? transactions.map(tr => ({
              id: tr?.id || null,
              type: tr?.type || null,
              amount: typeof tr?.amount === 'number' ? tr.amount : 0,
              description: tr?.description || null,
              createdAt: tr?.created_at || null,
              status: tr?.status || null,
            }))
          : [],
        statistics: {
          totalBookings,
          totalTrips,
          totalSpent,
          totalCashback,
          pendingPayments,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get payment history for user
 * GET /api/reports/payment-history
 * @access Private
 */
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  try {
    const { limit = 50, page = 1, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = Transaction.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    // Apply date filters if provided
    if (startDate) {
      query = query.where('created_at', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('created_at', '<=', new Date(endDate));
    }

    // Get total count
    const totalQuery = query.clone().clearSelect().clearOrder().count('* as count').first();
    const totalResult = await totalQuery;
    const total = totalResult?.count || 0;

    // Get paginated results
    const transactions = await query.limit(parseInt(limit)).offset(offset);

    // Calculate summary statistics
    const allTransactions = await Transaction.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    const totalPaid = allTransactions
      .filter(t => t && typeof t.amount === 'number' && t.amount < 0 && (t.status === 'completed' || t.status === 'paid'))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalPending = allTransactions
      .filter(t => t && typeof t.amount === 'number' && t.amount < 0 && (t.status === 'pending' || t.status === 'processing'))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalReceived = allTransactions
      .filter(t => t && typeof t.amount === 'number' && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        transactions: Array.isArray(transactions) ? transactions.map(tr => ({
          id: tr?.id || null,
          type: tr?.type || null,
          amount: typeof tr?.amount === 'number' ? tr.amount : 0,
          currency: tr?.currency || 'EGP',
          description: tr?.description || null,
          createdAt: tr?.created_at || null,
          status: tr?.status || null,
          paymentMethod: tr?.payment_method || null,
        })) : [],
        summary: {
          totalPaid,
          totalPending,
          totalReceived,
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

