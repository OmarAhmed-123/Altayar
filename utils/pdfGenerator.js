/**
 * PDF Generator Utility for Membership Cards
 * Generates professional PDF membership cards automatically
 * Supports both Arabic and English text with beautiful design
 */

const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Helper function to format dates in both Arabic and English
 */
function formatDate(date, lang = 'en') {
  if (!date) date = new Date();
  if (typeof date === 'string') date = new Date(date);
  
  if (lang === 'ar') {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Helper function to format numbers with commas
 */
function formatNumber(num) {
  if (!num && num !== 0) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * CRITICAL: Translate Arabic text to English using Google Translate API
 * This ensures all text in PDF is clear and readable
 */
async function translateToEnglish(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return text;
  }
  
  // Check if text contains Arabic characters
  const arabicRegex = /[\u0600-\u06FF]/;
  if (!arabicRegex.test(text)) {
    return text; // Already in English or no Arabic
  }
  
  try {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodedText}`;
    
    return new Promise((resolve, reject) => {
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
    });
  } catch (error) {
    console.log('⚠️ [PDF] Translation failed, using original text:', error.message);
    return text;
  }
}

/**
 * Generate membership card PDF with beautiful design
 * @param {Object} membershipData - Membership data
 * @param {Object} userData - User data
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateMembershipCardPDF(membershipData, userData) {
  return new Promise(async (resolve, reject) => {
    try {
      // Card dimensions - larger for better design
      const cardWidth = 600;
      const cardHeight = 380;
      
      const doc = new PDFDocument({
        size: [cardWidth, cardHeight],
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        info: {
          Title: `Membership Card - ${userData.name || 'Member'}`,
          Author: 'ALTAYAR VIP',
          Subject: 'Membership Card',
          Creator: 'ALTAYAR VIP System',
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // ========== BACKGROUND DESIGN ==========
      // Gradient-like background (using multiple rectangles)
      const primaryColor = '#1a4d8c'; // Dark blue
      const secondaryColor = '#2265c3'; // Lighter blue
      
      // Main background
      doc.rect(0, 0, cardWidth, cardHeight).fill(primaryColor);
      
      // Decorative top bar
      doc.rect(0, 0, cardWidth, 80).fill(secondaryColor);
      
      // White content area with rounded corners effect
      doc.rect(30, 100, cardWidth - 60, cardHeight - 140)
        .fill('#FFFFFF')
        .stroke('#E0E0E0');

      // ========== LOGO/ICON ==========
      // CRITICAL: Try multiple paths for app logo/icon
      const logoPaths = [
        path.join(__dirname, '../uploads/logos/altayarvip.png'),
        path.join(__dirname, '../lib/assets/images/icon.png'),
        path.join(__dirname, '../assets/images/icon.png'),
      ];
      let logoAdded = false;
      
      for (const logoPath of logoPaths) {
        try {
          await fs.access(logoPath);
          // Add logo if exists - larger size for better visibility
          doc.image(logoPath, 50, 20, { 
            width: 80, 
            height: 80,
            fit: [80, 80]
          });
          logoAdded = true;
          console.log('✅ [PDF] Logo added successfully from:', logoPath);
          break;
        } catch (error) {
          // Try next path
          continue;
        }
      }
      
      if (!logoAdded) {
        console.log('⚠️ [PDF] Logo not found in any path, continuing without logo');
      }

      // ========== HEADER SECTION ==========
      const headerY = 30;
      
      // App Name - English
      doc.fillColor('#FFFFFF')
        .fontSize(32)
        .font('Helvetica-Bold')
        .text('ALTAYAR VIP', logoAdded ? 130 : 50, headerY, {
          width: cardWidth - (logoAdded ? 200 : 120),
          align: 'left'
        });

      // App Name - Arabic (if needed)
      // Note: PDFKit has limited Arabic support, so we'll use English primarily
      // For full Arabic support, you'd need to use a library like pdfmake or register Arabic fonts
      
      // ========== MEMBERSHIP TYPE ==========
      // CRITICAL: Translate membership name to English for clarity
      const membershipName = membershipData.name || 'Premium Membership';
      const translatedMembershipName = await translateToEnglish(membershipName);
      
      const membershipY = 110;
      doc.fillColor('#1a4d8c')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(translatedMembershipName, 50, membershipY, {
          width: cardWidth - 100,
          align: 'center'
        });

      // ========== MEMBER INFORMATION SECTION ==========
      const infoStartY = 150;
      let currentY = infoStartY;
      const lineHeight = 30;
      const labelWidth = 200;
      const valueWidth = cardWidth - 270;

      // Name - Clear and readable
      doc.fillColor('#333333')
        .fontSize(11)
        .font('Helvetica')
        .text('Name:', 50, currentY, { width: labelWidth });
      
      doc.fillColor('#000000')
        .fontSize(15)
        .font('Helvetica-Bold')
        .text(userData.name || 'Member Name', 260, currentY, { width: valueWidth });
      
      currentY += lineHeight;

      // Email - Clear and readable
      doc.fillColor('#333333')
        .fontSize(11)
        .font('Helvetica')
        .text('Email:', 50, currentY, { width: labelWidth });
      
      doc.fillColor('#000000')
        .fontSize(12)
        .font('Helvetica')
        .text(userData.email || 'email@example.com', 260, currentY, { width: valueWidth });
      
      currentY += lineHeight;

      // Membership Number - Clear format
      const membershipNumber = `ALT-${userData.id.toString().padStart(6, '0')}`;
      doc.fillColor('#333333')
        .fontSize(11)
        .font('Helvetica')
        .text('Membership Number:', 50, currentY, { width: labelWidth });
      
      doc.fillColor('#1a4d8c')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(membershipNumber, 260, currentY, { width: valueWidth });
      
      currentY += lineHeight;

      // Subscription Date - Clear format
      const subscriptionDate = userData.membership_subscription_date || new Date();
      const formattedDate = formatDate(subscriptionDate, 'en');
      
      doc.fillColor('#333333')
        .fontSize(11)
        .font('Helvetica')
        .text('Subscription Date:', 50, currentY, { width: labelWidth });
      
      doc.fillColor('#000000')
        .fontSize(12)
        .font('Helvetica')
        .text(formattedDate, 260, currentY, { width: valueWidth });
      
      currentY += lineHeight + 10;

      // ========== STATISTICS SECTION ==========
      // Divider line
      doc.strokeColor('#E0E0E0')
        .lineWidth(1)
        .moveTo(50, currentY)
        .lineTo(cardWidth - 50, currentY)
        .stroke();
      
      currentY += 15;

      // Points and Cashback in two columns
      const statsY = currentY;
      
      // Points Box - Clear label
      doc.rect(50, statsY, (cardWidth - 120) / 2, 50)
        .fill('#F5F9FF')
        .stroke('#1a4d8c');
      
      doc.fillColor('#1a4d8c')
        .fontSize(11)
        .font('Helvetica')
        .text('Points', 60, statsY + 8, { width: (cardWidth - 120) / 2 - 20, align: 'center' });
      
      doc.fillColor('#1a4d8c')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(formatNumber(userData.points || 0), 60, statsY + 22, { 
          width: (cardWidth - 120) / 2 - 20, 
          align: 'center' 
        });

      // Cashback Box - Clear label
      const cashbackX = 50 + (cardWidth - 120) / 2 + 20;
      doc.rect(cashbackX, statsY, (cardWidth - 120) / 2, 50)
        .fill('#F5F9FF')
        .stroke('#1a4d8c');
      
      doc.fillColor('#1a4d8c')
        .fontSize(11)
        .font('Helvetica')
        .text('Cashback', cashbackX + 10, statsY + 8, { 
          width: (cardWidth - 120) / 2 - 20, 
          align: 'center' 
        });
      
      doc.fillColor('#1a4d8c')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(formatNumber(userData.cashback || 0), cashbackX + 10, statsY + 22, { 
          width: (cardWidth - 120) / 2 - 20, 
          align: 'center' 
        });

      // ========== FOOTER ==========
      const footerY = cardHeight - 30;
      doc.fillColor('#666666')
        .fontSize(9)
        .font('Helvetica')
        .text('© ALTAYAR VIP - Premium Membership Program', 50, footerY, {
          width: cardWidth - 100,
          align: 'center'
        });

      doc.end();
    } catch (error) {
      console.error('Error generating membership card PDF:', error);
      reject(error);
    }
  });
}

/**
 * Save PDF to file
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} filename - Filename
 * @returns {Promise<string>} File path
 */
async function saveMembershipPDF(pdfBuffer, filename) {
  const uploadsDir = path.join(__dirname, '../uploads/memberships');
  
  // Ensure directory exists
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, pdfBuffer);
  
  return `/uploads/memberships/${filename}`;
}

module.exports = {
  generateMembershipCardPDF,
  saveMembershipPDF
};

