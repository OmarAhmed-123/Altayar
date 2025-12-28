/**
 * Invoice PDF Generator
 * Generates professional PDF invoices for bookings
 * Supports Arabic and English text with Google Translate integration
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const {
  registerCairoFonts,
  formatTextForPDF,
  drawText,
  drawBoldText,
  cleanText,
  isArabic,
} = require('./pdfFontHelper');

// Try to use Google Translate API if available, otherwise fallback to dictionary
let translate = null;
try {
  // Use google-translate-api-x if installed
  translate = require('google-translate-api-x');
} catch (e) {
  // Fallback: will use dictionary translation
  console.log('ℹ️ [TRANSLATION] Google Translate API not available, using dictionary fallback');
}

/**
 * Comprehensive translation dictionary for common Arabic terms (fallback)
 */
const translationDictionary = {
  // Common booking types
  'رحلة عامة': 'General Trip',
  'رحلة سياحية': 'Tour Trip',
  'رحلة ثقافية': 'Cultural Trip',
  'رحلة دينية': 'Religious Trip',
  'رحلة ترفيهية': 'Recreational Trip',
  'رحلة مغامرة': 'Adventure Trip',
  'رحلة شاطئية': 'Beach Trip',
  'رحلة جبلية': 'Mountain Trip',
  'رحلة صحراوية': 'Desert Trip',
  'رحلة نيلية': 'Nile Trip',
  'رحلة بحرية': 'Sea Trip',
  'رحلة برية': 'Land Trip',
  
  // Common service names
  'باقة سياحية': 'Tour Package',
  'باقة فاخرة': 'Luxury Package',
  'باقة اقتصادية': 'Economy Package',
  'باقة عائلية': 'Family Package',
  'باقة رومانسية': 'Romantic Package',
  'باقة شهر عسل': 'Honeymoon Package',
  'باقة سياحية شاملة': 'Comprehensive Tour Package',
  'باقة سياحية متميزة': 'Premium Tour Package',
  
  // Common words
  'رحلة': 'Trip',
  'باقة': 'Package',
  'جولة': 'Tour',
  'سياحة': 'Tourism',
  'سفر': 'Travel',
  'عطلة': 'Holiday',
  'إجازة': 'Vacation',
  
  // Duration words
  'يوم': 'day',
  'أيام': 'days',
  'ليلة': 'night',
  'ليالي': 'nights',
  'أسبوع': 'week',
  'أسابيع': 'weeks',
  'شهر': 'month',
  'أشهر': 'months',
  
  // People words
  'شخص': 'person',
  'أشخاص': 'people',
  'مشارك': 'participant',
  'مشاركين': 'participants',
  'فرد': 'individual',
  'أفراد': 'individuals',
  'عائلة': 'family',
  'عائلات': 'families',
  
  // Common phrases
  'رحلة لمدة': 'Trip for',
  'باقة لمدة': 'Package for',
  'لشخص': 'for person',
  'لشخصين': 'for 2 people',
  'لأشخاص': 'for people',
  'للمشاركين': 'for participants',
  'للأفراد': 'for individuals',
  'للعائلة': 'for family',
  
  // Common terms
  'خصم': 'Discount',
  'عرض خاص': 'Special Offer',
  'تأكيد فوري': 'Instant Confirmation',
  'إلغاء مجاني': 'Free Cancellation',
  'استرجاع كامل': 'Full Refund',
  'دعم على مدار الساعة': '24/7 Support',
  'شامل': 'Inclusive',
  'غير شامل': 'Not Inclusive',
  'وجبات': 'Meals',
  'إقامة': 'Accommodation',
  'نقل': 'Transfer',
  'تذاكر': 'Tickets',
  'دليل سياحي': 'Tour Guide',
  
  // Membership types
  'عضوية فضية': 'Silver Membership',
  'عضوية ذهبية': 'Gold Membership',
  'عضوية بلاتينية': 'Platinum Membership',
  'عضوية ماسية': 'Diamond Membership',
  'عضوية VIP': 'VIP Membership',
  'عضوية الأعمال': 'Business Membership',
  'عضوية برونزية': 'Bronze Membership',
};

/**
 * Translate Arabic text to English using Google Translate API
 * Falls back to dictionary if API is not available
 */
async function translateToEnglish(text) {
  if (!text || typeof text !== 'string') return text;
  
  // If text is not Arabic, return as is
  if (!isArabic(text)) {
    return text;
  }

  const trimmedText = text.trim();
  
  // Try Google Translate API first if available
  if (translate) {
    try {
      // Use Promise.race with timeout to avoid hanging
      const translationPromise = translate(trimmedText, { to: 'en' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Translation timeout')), 10000)
      );
      
      const result = await Promise.race([translationPromise, timeoutPromise]);
      
      // google-translate-api-x returns { text: '...', from: { language: {...} }, raw: {...} }
      let translatedText = null;
      if (result) {
        if (typeof result === 'string') {
          translatedText = result;
        } else if (result.text) {
          translatedText = result.text;
        } else if (result[0] && result[0].text) {
          // Array response
          translatedText = result[0].text;
        }
      }
      
      if (translatedText && translatedText.trim() && translatedText !== trimmedText) {
        return translatedText.trim();
      }
    } catch (error) {
      // If translation fails, fall back to dictionary
      console.log('⚠️ [TRANSLATION] Google Translate failed, using dictionary:', error.message);
    }
  }
  
  // Fallback to dictionary translation
  // Check exact match in dictionary first
  if (translationDictionary[trimmedText]) {
    return translationDictionary[trimmedText];
  }

  // Try to build a proper English description from Arabic text
  // Extract numbers and common patterns
  const daysMatch = trimmedText.match(/(\d+)\s*(?:يوم|أيام)/);
  const nightsMatch = trimmedText.match(/(\d+)\s*(?:ليلة|ليالي)/);
  const peopleMatch = trimmedText.match(/(\d+)\s*(?:شخص|أشخاص|مشارك|مشاركين|فرد|أفراد)/);
  
  // Extract package/trip type
  let packageType = '';
  if (trimmedText.includes('باقة')) {
    packageType = 'Package';
  } else if (trimmedText.includes('رحلة')) {
    packageType = 'Trip';
  } else if (trimmedText.includes('جولة')) {
    packageType = 'Tour';
  }
  
  // Build English description
  let englishParts = [];
  
  if (packageType) {
    // Try to find specific package type
    for (const [arabic, english] of Object.entries(translationDictionary)) {
      if (trimmedText.includes(arabic) && (arabic.includes('باقة') || arabic.includes('رحلة'))) {
        packageType = english;
        break;
      }
    }
    englishParts.push(packageType);
  }
  
  if (daysMatch) {
    const days = daysMatch[1];
    englishParts.push(`for ${days} ${days === '1' ? 'day' : 'days'}`);
  } else if (nightsMatch) {
    const nights = nightsMatch[1];
    englishParts.push(`for ${nights} ${nights === '1' ? 'night' : 'nights'}`);
  }
  
  if (peopleMatch) {
    const people = peopleMatch[1];
    englishParts.push(`for ${people} ${people === '1' ? 'person' : 'people'}`);
  }
  
  // If we have meaningful parts, build sentence
  if (englishParts.length > 0) {
    return englishParts.join(' ');
  }
  
  // Try partial matching for common patterns
  let translated = trimmedText;
  for (const [arabic, english] of Object.entries(translationDictionary)) {
    if (translated.includes(arabic)) {
      translated = translated.replace(new RegExp(arabic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), english);
    }
  }
  
  // If still Arabic, try to extract any useful information
  if (isArabic(translated)) {
    // Extract numbers
    const numbers = translated.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      // Try to understand context from remaining text
      if (translated.includes('يوم') || translated.includes('أيام')) {
        return `Tour Package - ${numbers.join(', ')} days`;
      } else if (translated.includes('شخص') || translated.includes('مشارك')) {
        return `Tour Package - ${numbers.join(', ')} participants`;
      } else {
        return `Tour Package - ${numbers.join(', ')}`;
      }
    }
    
    // Last resort: return generic but meaningful description
    if (translated.length > 0) {
      // Try to extract first meaningful word
      const words = translated.split(/\s+/);
      for (const word of words) {
        if (translationDictionary[word]) {
          return translationDictionary[word] + ' Package';
        }
      }
    }
    
    return 'Tour Package';
  }
  
  return translated;
}

/**
 * Helper function to safely get text value
 */
function safeText(value, defaultValue = 'N/A') {
  if (value === null || value === undefined || value === '') return defaultValue;
  return String(value);
}

/**
 * Helper function to format currency
 */
function formatCurrency(amount) {
  if (typeof amount === 'string') {
    amount = parseFloat(amount) || 0;
  }
  return `${amount.toFixed(2)} EGP`;
}

/**
 * Generate invoice PDF using pdfkit with Google Translate
 * @param {Object} invoiceData - Invoice data
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateInvoicePDF(invoiceData) {
  return new Promise(async (resolve, reject) => {
    try {
      // Translate Arabic text to English before generating PDF
      const translations = {};
      
      // Translate user name if Arabic
      if (invoiceData.user?.name && isArabic(invoiceData.user.name)) {
        translations.userName = await translateToEnglish(invoiceData.user.name);
      }
      
      // Translate booking type if Arabic
      if (invoiceData.booking?.bookingType && isArabic(invoiceData.booking.bookingType)) {
        translations.bookingType = await translateToEnglish(invoiceData.booking.bookingType);
      }
      
      // Translate service names and descriptions
      if (invoiceData.services && invoiceData.services.length > 0) {
        translations.services = await Promise.all(
          invoiceData.services.map(async (service) => {
            const translatedService = { ...service };
            
            if (service.name && isArabic(service.name)) {
              translatedService.name = await translateToEnglish(service.name);
            }
            
            if (service.description && isArabic(service.description)) {
              translatedService.description = await translateToEnglish(service.description);
            }
            
            return translatedService;
          })
        );
      }
      
      // Translate package name if exists
      if (invoiceData.package?.name && isArabic(invoiceData.package.name)) {
        translations.packageName = await translateToEnglish(invoiceData.package.name);
      }
      
      // Translate terms if Arabic
      if (invoiceData.terms && isArabic(invoiceData.terms)) {
        translations.terms = await translateToEnglish(invoiceData.terms);
      }

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Invoice ${invoiceData.invoiceNumber}`,
          Author: 'ALTAYAR VIP',
          Subject: 'Invoice',
          Creator: 'ALTAYAR VIP System',
        }
      });

      // Register Cairo fonts for Arabic support
      const { cairoRegular, cairoBold } = await registerCairoFonts(doc);
      const hasCairo = !!(cairoRegular && cairoBold);

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fillColor('#2265c3')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('ALTAYAR VIP', 50, 50, { align: 'center' });

      doc.fillColor('#000000')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('INVOICE', 50, 80, { align: 'center' });

      // Invoice Details
      let yPos = 130;
      doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Invoice #:', 50, yPos);
      doc.font('Helvetica-Bold')
        .fillColor('#000000')
        .text(safeText(invoiceData.invoiceNumber), 150, yPos);
      yPos += 20;

      doc.font('Helvetica')
        .fillColor('#666666')
        .text('Date:', 50, yPos);
      doc.font('Helvetica-Bold')
        .fillColor('#000000')
        .text(safeText(invoiceData.invoiceDate), 150, yPos);
      yPos += 20;

      if (invoiceData.dueDate) {
        doc.font('Helvetica')
          .fillColor('#666666')
          .text('Due Date:', 50, yPos);
        doc.font('Helvetica-Bold')
          .fillColor('#000000')
          .text(safeText(invoiceData.dueDate), 150, yPos);
        yPos += 20;
      }

      // Customer Information
      yPos += 10;
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Bill To:', 50, yPos);
      yPos += 20;

      // Use translated name if available, otherwise original
      const userName = translations.userName || safeText(invoiceData.user?.name, 'Customer');
      const userNameFormatted = formatTextForPDF(userName, hasCairo);
      doc.fontSize(11)
        .font(userNameFormatted.font)
        .fillColor('#000000')
        .text(userNameFormatted.text, 50, yPos, {
          align: userNameFormatted.alignment
        });
      yPos += 15;

      if (invoiceData.user?.email) {
        doc.text(safeText(invoiceData.user.email), 50, yPos);
        yPos += 15;
      }

      // Booking Information
      if (invoiceData.booking) {
        yPos += 10;
        doc.fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Booking Details:', 50, yPos);
        yPos += 20;

        doc.fontSize(11)
          .font('Helvetica')
          .fillColor('#666666')
          .text('Booking ID:', 50, yPos);
        doc.font('Helvetica-Bold')
          .fillColor('#000000')
          .text(`#${invoiceData.booking.id}`, 150, yPos);
        yPos += 15;

        if (invoiceData.booking.bookingType) {
          // Use translated booking type if available
          const bookingType = translations.bookingType || safeText(invoiceData.booking.bookingType);
          doc.font('Helvetica')
            .fillColor('#666666')
            .text('Type:', 50, yPos);
          doc.font('Helvetica-Bold')
            .fillColor('#000000')
            .text(bookingType, 150, yPos);
          yPos += 15;
        }

        if (invoiceData.booking.participants) {
          doc.font('Helvetica')
            .fillColor('#666666')
            .text('Participants:', 50, yPos);
          doc.font('Helvetica-Bold')
            .fillColor('#000000')
            .text(safeText(invoiceData.booking.participants), 150, yPos);
          yPos += 15;
        }

        if (invoiceData.booking.numberOfDays) {
          doc.font('Helvetica')
            .fillColor('#666666')
            .text('Duration:', 50, yPos);
          doc.font('Helvetica-Bold')
            .fillColor('#000000')
            .text(`${invoiceData.booking.numberOfDays} ${invoiceData.booking.numberOfDays === 1 ? 'day' : 'days'}`, 150, yPos);
          yPos += 15;
        }
      }

      // Services Table
      yPos += 20;
      doc.strokeColor('#CCCCCC')
        .lineWidth(1)
        .moveTo(50, yPos)
        .lineTo(545, yPos)
        .stroke();
      yPos += 10;

      // Table Header
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Description', 50, yPos);
      doc.text('Quantity', 350, yPos);
      doc.text('Rate', 400, yPos);
      doc.text('Total', 480, yPos);
      yPos += 15;

      doc.strokeColor('#CCCCCC')
        .lineWidth(1)
        .moveTo(50, yPos)
        .lineTo(545, yPos)
        .stroke();
      yPos += 10;

      // Services Items - Use translated services if available
      const servicesToUse = translations.services || invoiceData.services || [];
      
      if (servicesToUse.length > 0) {
        servicesToUse.forEach((service) => {
          if (yPos > 650) {
            doc.addPage();
            yPos = 50;
          }

          const serviceName = safeText(service.name);
          const serviceDesc = service.description ? safeText(service.description) : '';

          // Service name with RTL support
          const serviceNameFormatted = formatTextForPDF(serviceName, hasCairo);
          doc.fontSize(10)
            .font(serviceNameFormatted.font)
            .fillColor('#000000')
            .text(serviceNameFormatted.text, 50, yPos, { 
              width: 280,
              align: serviceNameFormatted.alignment
            });

          // Service description - directly under the name with RTL support
          if (serviceDesc) {
            const serviceDescFormatted = formatTextForPDF(serviceDesc, hasCairo);
            doc.fontSize(9)
              .font(serviceDescFormatted.font)
              .fillColor('#666666')
              .text(serviceDescFormatted.text, 50, yPos + 12, { 
                width: 280,
                align: serviceDescFormatted.alignment
              });
          }

          const quantity = service.quantity || 1;
          const rate = parseFloat(service.rate || 0);
          const total = parseFloat(service.total || rate * quantity);

          // Calculate Y position for quantity/rate/total (aligned with service name)
          const valueY = yPos;

          doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#000000')
            .text(quantity.toString(), 350, valueY);
          doc.text(formatCurrency(rate), 400, valueY);
          doc.font('Helvetica-Bold')
            .text(formatCurrency(total), 480, valueY);

          // Move Y position based on whether description exists
          yPos += serviceDesc ? 30 : 20;
        });
      } else {
        // Fallback: show booking info as service
        const serviceName = translations.packageName || 
                           invoiceData.package?.name || 
                           translations.bookingType ||
                           invoiceData.booking?.bookingType || 
                           'Service';
        const quantity = invoiceData.booking?.numberOfDays || invoiceData.booking?.participants || 1;
        const rate = parseFloat(invoiceData.subtotal || invoiceData.total || 0) / quantity;
        const total = parseFloat(invoiceData.total || invoiceData.subtotal || 0);

        doc.fontSize(10)
          .font('Helvetica')
          .fillColor('#000000')
          .text(safeText(serviceName), 50, yPos, { width: 280 });
        
        doc.text(quantity.toString(), 350, yPos);
        doc.text(formatCurrency(rate), 400, yPos);
        doc.font('Helvetica-Bold')
          .text(formatCurrency(total), 480, yPos);

        yPos += 20;
      }

      // Totals
      yPos += 10;
      doc.strokeColor('#CCCCCC')
        .lineWidth(1)
        .moveTo(50, yPos)
        .lineTo(545, yPos)
        .stroke();
      yPos += 20;

      const subtotal = parseFloat(invoiceData.subtotal || invoiceData.total || 0);
      const total = parseFloat(invoiceData.total || subtotal);

      doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#000000')
        .text('Subtotal:', 400, yPos);
      doc.font('Helvetica-Bold')
        .text(formatCurrency(subtotal), 480, yPos);
      yPos += 20;

      if (invoiceData.tax && parseFloat(invoiceData.tax) > 0) {
        doc.font('Helvetica')
          .text(`Tax (${invoiceData.taxRate || 0}%):`, 400, yPos);
        doc.font('Helvetica-Bold')
          .text(formatCurrency(invoiceData.tax), 480, yPos);
        yPos += 20;
      }

      if (invoiceData.discount && parseFloat(invoiceData.discount) > 0) {
        doc.font('Helvetica')
          .text(`Discount:`, 400, yPos);
        doc.font('Helvetica-Bold')
          .fillColor('#00AA00')
          .text(`-${formatCurrency(invoiceData.discount)}`, 480, yPos);
        doc.fillColor('#000000');
        yPos += 20;
      }

      doc.strokeColor('#2265c3')
        .lineWidth(2)
        .moveTo(400, yPos)
        .lineTo(545, yPos)
        .stroke();
      yPos += 20;

      doc.fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#2265c3')
        .text('Total:', 400, yPos);
      doc.text(formatCurrency(total), 480, yPos);

      // Terms and Conditions
      if (invoiceData.terms) {
        yPos += 40;
        // Use translated terms if available
        const terms = translations.terms || safeText(invoiceData.terms);
        
        doc.fontSize(10)
          .font('Helvetica-Oblique')
          .fillColor('#666666')
          .text('Terms & Conditions:', 50, yPos);
        yPos += 15;
        
        doc.font('Helvetica')
          .fillColor('#000000')
          .text(terms, 50, yPos, { width: 495 });
      }

      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#999999')
        .text('Thank you for your business!', 50, pageHeight - 40, { align: 'center' });
      doc.text('ALTAYAR VIP - Your trusted travel partner', 50, pageHeight - 25, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateInvoicePDF
};
