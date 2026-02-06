/**
 * Professional PDF Report Generator for ALTAYARVIP
 * This file contains the complete code for generating beautiful PDF reports
 * 
 * Installation required:
 * npm install pdfkit
 * npm install fs
 * npm install path
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');

/**
 * Generate professional user report PDF
 * @param {Object} reportData - User report data
 * @param {Object} user - User object
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateUserReportPDF(reportData, user) {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `User Report - ${user.name || user.email}`,
          Author: 'ALTAYARVIP',
          Subject: 'User Activity Report',
          Creator: 'ALTAYARVIP System',
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // ==========================================
      // HEADER SECTION - Logo and Company Info
      // ==========================================
      drawHeader(doc, user);

      // ==========================================
      // USER INFORMATION SECTION
      // ==========================================
      drawUserInfo(doc, reportData, user);

      // ==========================================
      // MEMBERSHIP INFORMATION SECTION
      // ==========================================
      if (reportData.membership) {
        drawMembershipInfo(doc, reportData.membership);
      }

      // ==========================================
      // STATISTICS SECTION
      // ==========================================
      drawStatistics(doc, reportData.statistics);

      // ==========================================
      // RECENT BOOKINGS SECTION
      // ==========================================
      if (reportData.bookings && reportData.bookings.length > 0) {
        drawBookingsTable(doc, reportData.bookings);
      }

      // ==========================================
      // RECENT TRIPS SECTION
      // ==========================================
      if (reportData.trips && reportData.trips.length > 0) {
        drawTripsTable(doc, reportData.trips);
      }

      // ==========================================
      // TRANSACTIONS SECTION
      // ==========================================
      if (reportData.transactions && reportData.transactions.length > 0) {
        drawTransactionsTable(doc, reportData.transactions);
      }

      // ==========================================
      // FOOTER SECTION
      // ==========================================
      drawFooter(doc);

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Draw header with logo and company information
 */
function drawHeader(doc, user) {
  // Background color for header
  doc.rect(0, 0, 595, 120)
     .fillColor('#0078D4')
     .fill();

  // Try to load logo image if exists, otherwise use text icon
  const logoPath = path.join(__dirname, '../public/images/logo.png');
  const logoExists = fs.existsSync(logoPath);
  
  if (logoExists) {
    try {
      // Draw logo image
      doc.image(logoPath, 50, 25, { width: 60, height: 60 });
    } catch (error) {
      console.log('Logo image not found, using text icon:', error?.message || error);
      // Fallback to text icon
      doc.fillColor('#FFFFFF')
         .fontSize(32)
         .text('✈', 50, 30, { align: 'left' });
    }
  } else {
    // Draw logo circle with icon
    doc.circle(80, 55, 25)
       .fillColor('#FFFFFF')
       .fill();
    
    doc.fillColor('#0078D4')
       .fontSize(24)
       .text('✈', 70, 45, { align: 'left' });
  }

  // Company name
  doc.fillColor('#FFFFFF')
     .fontSize(28)
     .font('Helvetica-Bold')
     .text('ALTAYARVIP', 120, 25, { align: 'left' });

  // Tagline
  doc.fillColor('#FFFFFF')
     .fontSize(10)
     .font('Helvetica')
     .text('HERE, THERE, AND EVERYWHERE', 120, 50, { align: 'left' });

  // Website
  doc.fillColor('#FFFFFF')
     .fontSize(9)
     .font('Helvetica-Oblique')
     .text('https://altayarvip.com', 120, 65, { align: 'left' });

  // Report title
  doc.fillColor('#FFFFFF')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('User Activity Report', 400, 40, { align: 'right' });

  // Report date
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.fillColor('#FFFFFF')
     .fontSize(10)
     .font('Helvetica')
     .text(`Generated: ${reportDate}`, 400, 60, { align: 'right' });

  // Reset fill color
  doc.fillColor('#000000');
  
  // Add spacing
  doc.moveDown(3);
}

/**
 * Draw user information section
 */
function drawUserInfo(doc, reportData, user) {
  const startY = doc.y;
  
  // Section title
  doc.fillColor('#0078D4')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('User Information', 50, startY + 10);

  // Underline
  doc.strokeColor('#0078D4')
     .lineWidth(2)
     .moveTo(50, startY + 30)
     .lineTo(545, startY + 30)
     .stroke();

  // Reset colors
  doc.fillColor('#000000');
  doc.strokeColor('#000000');

  const infoY = startY + 40;
  let currentY = infoY;

  // Name
  doc.fontSize(11)
     .font('Helvetica')
     .fillColor('#666666')
     .text('Name:', 50, currentY);
  doc.font('Helvetica-Bold')
     .fillColor('#000000')
     .text(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A', 150, currentY);
  currentY += 20;

  // Email
  doc.font('Helvetica')
     .fillColor('#666666')
     .text('Email:', 50, currentY);
  doc.font('Helvetica-Bold')
     .fillColor('#000000')
     .text(user.email || 'N/A', 150, currentY);
  currentY += 20;

  // Phone
  if (user.phone) {
    doc.font('Helvetica')
       .fillColor('#666666')
       .text('Phone:', 50, currentY);
    doc.font('Helvetica-Bold')
       .fillColor('#000000')
       .text(user.phone, 150, currentY);
    currentY += 20;
  }

  // Role
  doc.font('Helvetica')
     .fillColor('#666666')
     .text('Role:', 50, currentY);
  doc.font('Helvetica-Bold')
     .fillColor('#000000')
     .text(user.role || 'Customer', 150, currentY);
  currentY += 20;

  // Member Since
  if (user.created_at || user.createdAt) {
    const memberSince = new Date(user.created_at || user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.font('Helvetica')
       .fillColor('#666666')
       .text('Member Since:', 50, currentY);
    doc.font('Helvetica-Bold')
       .fillColor('#000000')
       .text(memberSince, 150, currentY);
    currentY += 20;
  }

  // Add spacing
  doc.moveDown(1);
}

/**
 * Draw membership information section
 */
function drawMembershipInfo(doc, membership) {
  const startY = doc.y;
  
  // Check if we need a new page
  if (startY > 700) {
    doc.addPage();
  }

  // Section title
  doc.fillColor('#0078D4')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('Membership Information', 50, doc.y + 10);

  // Underline
  doc.strokeColor('#0078D4')
     .lineWidth(2)
     .moveTo(50, doc.y + 10)
     .lineTo(545, doc.y + 10)
     .stroke();

  // Reset colors
  doc.fillColor('#000000');
  doc.strokeColor('#000000');

  const infoY = doc.y + 20;
  let currentY = infoY;

  // Type
  doc.fontSize(11)
     .font('Helvetica')
     .fillColor('#666666')
     .text('Type:', 50, currentY);
  doc.font('Helvetica-Bold')
     .fillColor('#000000')
     .text(membership.type || 'N/A', 150, currentY);
  currentY += 20;

  // Status
  doc.font('Helvetica')
     .fillColor('#666666')
     .text('Status:', 50, currentY);
  const statusColor = membership.status === 'active' ? '#00C853' : '#E60012';
  doc.font('Helvetica-Bold')
     .fillColor(statusColor)
     .text(membership.status || 'N/A', 150, currentY);
  currentY += 20;

  // Subscription Date
  if (membership.subscriptionDate) {
    const subDate = new Date(membership.subscriptionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.font('Helvetica')
       .fillColor('#666666')
       .text('Subscription Date:', 50, currentY);
    doc.font('Helvetica-Bold')
       .fillColor('#000000')
       .text(subDate, 150, currentY);
    currentY += 20;
  }

  // Expiry Date
  if (membership.expiryDate) {
    const expDate = new Date(membership.expiryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.font('Helvetica')
       .fillColor('#666666')
       .text('Expiry Date:', 50, currentY);
    doc.font('Helvetica-Bold')
       .fillColor('#000000')
       .text(expDate, 150, currentY);
    currentY += 20;
  }

  // Cashback Balance
  if (membership.cashbackBalance !== undefined) {
    doc.font('Helvetica')
       .fillColor('#666666')
       .text('Cashback Balance:', 50, currentY);
    doc.font('Helvetica-Bold')
       .fillColor('#0078D4')
       .text(`${membership.cashbackBalance.toFixed(2)} EGP`, 150, currentY);
    currentY += 20;
  }

  // Add spacing
  doc.moveDown(1);
}

/**
 * Draw statistics section with cards
 */
function drawStatistics(doc, statistics) {
  const startY = doc.y;
  
  // Check if we need a new page
  if (startY > 650) {
    doc.addPage();
  }

  // Section title
  doc.fillColor('#0078D4')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('Statistics Overview', 50, doc.y + 10);

  // Underline
  doc.strokeColor('#0078D4')
     .lineWidth(2)
     .moveTo(50, doc.y + 10)
     .lineTo(545, doc.y + 10)
     .stroke();

  // Reset colors
  doc.fillColor('#000000');
  doc.strokeColor('#000000');

  const cardY = doc.y + 25;
  const cardWidth = 120;
  const cardHeight = 80;
  const cardSpacing = 20;
  const startX = 50;

  // Statistics cards
  const stats = [
    { label: 'Total Bookings', value: statistics.totalBookings || 0, color: '#0078D4' },
    { label: 'Total Trips', value: statistics.totalTrips || 0, color: '#00B2EE' },
    { label: 'Total Spent', value: `${(statistics.totalSpent || 0).toFixed(2)} EGP`, color: '#FF6B35' },
    { label: 'Total Cashback', value: `${(statistics.totalCashback || 0).toFixed(2)} EGP`, color: '#00C853' },
    { label: 'Pending Payments', value: `${(statistics.pendingPayments || 0).toFixed(2)} EGP`, color: '#E60012' },
  ];

  let currentX = startX;
  let currentY = cardY;
  let cardsPerRow = 0;

  stats.forEach((stat, index) => {
    // Check if we need a new row
    if (cardsPerRow >= 4) {
      currentY += cardHeight + cardSpacing;
      currentX = startX;
      cardsPerRow = 0;
    }

    // Draw card background
    doc.rect(currentX, currentY, cardWidth, cardHeight)
       .fillColor(stat.color + '15')
       .fill()
       .strokeColor(stat.color)
       .lineWidth(1)
       .stroke();

    // Draw value
    doc.fillColor(stat.color)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(stat.value.toString(), currentX + 10, currentY + 15, {
         width: cardWidth - 20,
         align: 'center'
       });

    // Draw label
    doc.fillColor('#666666')
       .fontSize(9)
       .font('Helvetica')
       .text(stat.label, currentX + 10, currentY + 45, {
         width: cardWidth - 20,
         align: 'center'
       });

    currentX += cardWidth + cardSpacing;
    cardsPerRow++;
  });

  // Reset fill color
  doc.fillColor('#000000');
  
  // Move to next section
  doc.y = currentY + cardHeight + 30;
}

/**
 * Draw bookings table
 */
function drawBookingsTable(doc, bookings) {
  const startY = doc.y;
  
  // Check if we need a new page
  if (startY > 600) {
    doc.addPage();
  }

  // Section title
  doc.fillColor('#0078D4')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text(`Recent Bookings (${bookings.length})`, 50, doc.y + 10);

  // Underline
  doc.strokeColor('#0078D4')
     .lineWidth(2)
     .moveTo(50, doc.y + 10)
     .lineTo(545, doc.y + 10)
     .stroke();

  // Reset colors
  doc.fillColor('#000000');
  doc.strokeColor('#000000');

  const tableY = doc.y + 25;
  const tableWidth = 495;
  const rowHeight = 30;
  const colWidths = [200, 100, 100, 95];

  // Table header
  doc.fillColor('#0078D4')
     .rect(50, tableY, tableWidth, rowHeight)
     .fill();

  doc.fillColor('#FFFFFF')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('Package', 55, tableY + 8, { width: colWidths[0] });
  doc.text('Date', 255, tableY + 8, { width: colWidths[1] });
  doc.text('Amount', 355, tableY + 8, { width: colWidths[2] });
  doc.text('Status', 455, tableY + 8, { width: colWidths[3] });

  // Table rows
  let currentY = tableY + rowHeight;
  bookings.slice(0, 10).forEach((booking, index) => {
    // Alternate row colors
    if (index % 2 === 0) {
      doc.fillColor('#F5F5F5')
         .rect(50, currentY, tableWidth, rowHeight)
         .fill();
    }

    doc.fillColor('#000000')
       .fontSize(9)
       .font('Helvetica')
       .text(booking.packageName || 'N/A', 55, currentY + 8, { width: colWidths[0] });

    const bookingDate = new Date(booking.bookingDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    doc.text(bookingDate, 255, currentY + 8, { width: colWidths[1] });

    doc.text(`${(booking.totalAmount || 0).toFixed(2)} EGP`, 355, currentY + 8, { width: colWidths[2] });

    const statusColor = booking.status === 'confirmed' ? '#00C853' : 
                       booking.status === 'pending' ? '#FF6B35' : '#E60012';
    doc.fillColor(statusColor)
       .text(booking.status || 'N/A', 455, currentY + 8, { width: colWidths[3] });

    // Draw row border
    doc.strokeColor('#E0E0E0')
       .lineWidth(0.5)
       .moveTo(50, currentY + rowHeight)
       .lineTo(545, currentY + rowHeight)
       .stroke();

    currentY += rowHeight;
  });

  // Table border
  doc.strokeColor('#0078D4')
     .lineWidth(2)
     .rect(50, tableY, tableWidth, currentY - tableY)
     .stroke();

  // Reset colors
  doc.fillColor('#000000');
  doc.strokeColor('#000000');

  doc.y = currentY + 20;
}

/**
 * Draw trips table
 */
function drawTripsTable(doc, trips) {
  const startY = doc.y;
  
  // Check if we need a new page
  if (startY > 600) {
    doc.addPage();
  }

  // Section title
  doc.fillColor('#0078D4')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text(`Recent Trips (${trips.length})`, 50, doc.y + 10);

  // Underline
  doc.strokeColor('#0078D4')
     .lineWidth(2)
     .moveTo(50, doc.y + 10)
     .lineTo(545, doc.y + 10)
     .stroke();

  // Reset colors
  doc.fillColor('#000000');
  doc.strokeColor('#000000');

  const tableY = doc.y + 25;
  const tableWidth = 495;
  const rowHeight = 30;
  const colWidths = [200, 120, 100, 75];

  // Table header
  doc.fillColor('#0078D4')
     .rect(50, tableY, tableWidth, rowHeight)
     .fill();

  doc.fillColor('#FFFFFF')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('Destination', 55, tableY + 8, { width: colWidths[0] });
  doc.text('Start Date', 255, tableY + 8, { width: colWidths[1] });
  doc.text('Cost', 375, tableY + 8, { width: colWidths[2] });
  doc.text('Status', 475, tableY + 8, { width: colWidths[3] });

  // Table rows
  let currentY = tableY + rowHeight;
  trips.slice(0, 10).forEach((trip, index) => {
    // Alternate row colors
    if (index % 2 === 0) {
      doc.fillColor('#F5F5F5')
         .rect(50, currentY, tableWidth, rowHeight)
         .fill();
    }

    doc.fillColor('#000000')
       .fontSize(9)
       .font('Helvetica')
       .text(trip.destination || 'N/A', 55, currentY + 8, { width: colWidths[0] });

    const startDate = new Date(trip.startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    doc.text(startDate, 255, currentY + 8, { width: colWidths[1] });

    doc.text(`${(trip.totalCost || 0).toFixed(2)} EGP`, 375, currentY + 8, { width: colWidths[2] });

    const statusColor = trip.status === 'completed' ? '#00C853' : 
                       trip.status === 'ongoing' ? '#0078D4' : '#FF6B35';
    doc.fillColor(statusColor)
       .text(trip.status || 'N/A', 475, currentY + 8, { width: colWidths[3] });

    // Draw row border
    doc.strokeColor('#E0E0E0')
       .lineWidth(0.5)
       .moveTo(50, currentY + rowHeight)
       .lineTo(545, currentY + rowHeight)
       .stroke();

    currentY += rowHeight;
  });

  // Table border
  doc.strokeColor('#0078D4')
     .lineWidth(2)
     .rect(50, tableY, tableWidth, currentY - tableY)
     .stroke();

  // Reset colors
  doc.fillColor('#000000');
  doc.strokeColor('#000000');

  doc.y = currentY + 20;
}

/**
 * Draw transactions table
 */
function drawTransactionsTable(doc, transactions) {
  const startY = doc.y;
  
  // Check if we need a new page
  if (startY > 600) {
    doc.addPage();
  }

  // Section title
  doc.fillColor('#0078D4')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text(`Recent Transactions (${transactions.length})`, 50, doc.y + 10);

  // Underline
  doc.strokeColor('#0078D4')
     .lineWidth(2)
     .moveTo(50, doc.y + 10)
     .lineTo(545, doc.y + 10)
     .stroke();

  // Reset colors
  doc.fillColor('#000000');
  doc.strokeColor('#000000');

  const tableY = doc.y + 25;
  const tableWidth = 495;
  const rowHeight = 25;
  const colWidths = [150, 200, 100, 45];

  // Table header
  doc.fillColor('#0078D4')
     .rect(50, tableY, tableWidth, rowHeight)
     .fill();

  doc.fillColor('#FFFFFF')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('Type', 55, tableY + 6, { width: colWidths[0] });
  doc.text('Description', 205, tableY + 6, { width: colWidths[1] });
  doc.text('Amount', 405, tableY + 6, { width: colWidths[2] });
  doc.text('Status', 505, tableY + 6, { width: colWidths[3] });

  // Table rows
  let currentY = tableY + rowHeight;
  transactions.slice(0, 15).forEach((transaction, index) => {
    // Alternate row colors
    if (index % 2 === 0) {
      doc.fillColor('#F5F5F5')
         .rect(50, currentY, tableWidth, rowHeight)
         .fill();
    }

    doc.fillColor('#000000')
       .fontSize(8)
       .font('Helvetica')
       .text(transaction.type || 'N/A', 55, currentY + 6, { width: colWidths[0] });

    doc.text(transaction.description || 'N/A', 205, currentY + 6, { width: colWidths[1] });

    const amountColor = transaction.amount >= 0 ? '#00C853' : '#E60012';
    doc.fillColor(amountColor)
       .text(`${Math.abs(transaction.amount || 0).toFixed(2)} EGP`, 405, currentY + 6, { width: colWidths[2] });

    const statusColor = transaction.status === 'completed' ? '#00C853' : '#FF6B35';
    doc.fillColor(statusColor)
       .fontSize(7)
       .text(transaction.status || 'N/A', 505, currentY + 6, { width: colWidths[3] });

    // Draw row border
    doc.strokeColor('#E0E0E0')
       .lineWidth(0.5)
       .moveTo(50, currentY + rowHeight)
       .lineTo(545, currentY + rowHeight)
       .stroke();

    currentY += rowHeight;
  });

  // Table border
  doc.strokeColor('#0078D4')
     .lineWidth(2)
     .rect(50, tableY, tableWidth, currentY - tableY)
     .stroke();

  // Reset colors
  doc.fillColor('#000000');
  doc.strokeColor('#000000');

  doc.y = currentY + 20;
}

/**
 * Draw footer with company information
 */
function drawFooter(doc) {
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 80;

  // Footer line
  doc.strokeColor('#0078D4')
     .lineWidth(1)
     .moveTo(50, footerY)
     .lineTo(545, footerY)
     .stroke();

  // Company info
  doc.fillColor('#666666')
     .fontSize(9)
     .font('Helvetica')
     .text('ALTAYARVIP - Here, There, and Everywhere', 50, footerY + 10, { align: 'center' });

  doc.text('https://altayarvip.com | support@altayarvip.com', 50, footerY + 25, { align: 'center' });

  // Page number
  const pageNumber = doc.bufferedPageRange().count;
  doc.text(`Page ${pageNumber}`, 50, footerY + 40, { align: 'center' });

  // Confidential notice
  doc.fillColor('#999999')
     .fontSize(8)
     .font('Helvetica-Oblique')
     .text('This report is confidential and intended for the recipient only.', 50, footerY + 55, { align: 'center' });

  // Reset colors
  doc.fillColor('#000000');
  doc.strokeColor('#000000');
}

module.exports = {
  generateUserReportPDF
};

