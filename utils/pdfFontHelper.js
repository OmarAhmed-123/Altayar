/**
 * PDF Font Helper
 * Provides Cairo font support and RTL text handling for PDF generation
 * Ensures proper Arabic and English text rendering
 */

const path = require('path');
const fs = require('fs').promises;

/**
 * Register Cairo fonts with PDFDocument
 * @param {PDFDocument} doc - PDFDocument instance
 * @returns {Promise<void>}
 */
async function registerCairoFonts(doc) {
  try {
    // Cairo font paths (you need to add these fonts to your project)
    const fontPaths = {
      regular: path.join(__dirname, '../assets/fonts/Cairo-Regular.ttf'),
      bold: path.join(__dirname, '../assets/fonts/Cairo-Bold.ttf'),
      // Check in static subdirectory (common location)
      regularStatic: path.join(__dirname, '../assets/fonts/static/Cairo-Regular.ttf'),
      boldStatic: path.join(__dirname, '../assets/fonts/static/Cairo-Bold.ttf'),
      // Fallback to Flutter assets if backend fonts don't exist
      regularFallback: path.join(__dirname, '../../AltayarFlutter/Altayar/assets/fonts/Cairo-Regular.ttf'),
      boldFallback: path.join(__dirname, '../../AltayarFlutter/Altayar/assets/fonts/Cairo-Bold.ttf'),
      // Additional fallback paths
      regularAlt: path.join(process.cwd(), 'assets/fonts/Cairo-Regular.ttf'),
      boldAlt: path.join(process.cwd(), 'assets/fonts/Cairo-Bold.ttf'),
      regularAltStatic: path.join(process.cwd(), 'assets/fonts/static/Cairo-Regular.ttf'),
      boldAltStatic: path.join(process.cwd(), 'assets/fonts/static/Cairo-Bold.ttf'),
    };

    // Try to register Cairo fonts
    let cairoRegular = null;
    let cairoBold = null;

    // Try regular font - check all possible paths
    const regularPaths = [
      fontPaths.regular,
      fontPaths.regularStatic,
      fontPaths.regularAlt,
      fontPaths.regularAltStatic,
      fontPaths.regularFallback
    ];

    for (const fontPath of regularPaths) {
      try {
        await fs.access(fontPath);
        // Verify it's actually a file (not a directory)
        const stats = await fs.stat(fontPath);
        if (stats.isFile()) {
          cairoRegular = fontPath;
          doc.registerFont('Cairo-Regular', fontPath);
          console.log('✅ [PDF Font] Cairo Regular registered:', fontPath);
          break;
        }
      } catch (error) {
        // Try next path
        continue;
      }
    }

    // Try bold font - check all possible paths
    const boldPaths = [
      fontPaths.bold,
      fontPaths.boldStatic,
      fontPaths.boldAlt,
      fontPaths.boldAltStatic,
      fontPaths.boldFallback
    ];

    for (const fontPath of boldPaths) {
      try {
        await fs.access(fontPath);
        // Verify it's actually a file (not a directory)
        const stats = await fs.stat(fontPath);
        if (stats.isFile()) {
          cairoBold = fontPath;
          doc.registerFont('Cairo-Bold', fontPath);
          console.log('✅ [PDF Font] Cairo Bold registered:', fontPath);
          break;
        }
      } catch (error) {
        // Try next path
        continue;
      }
    }

    if (!cairoRegular || !cairoBold) {
      console.warn('⚠️ [PDF Font] Cairo fonts not found, using Helvetica fallback');
      console.warn('⚠️ [PDF Font] Arabic text may not display correctly. Please install Cairo fonts.');
      console.warn('⚠️ [PDF Font] See scripts/setupArabicFonts.md for instructions.');
    }

    return { cairoRegular, cairoBold };
  } catch (error) {
    console.error('❌ [PDF Font] Error registering Cairo fonts:', error);
    return { cairoRegular: null, cairoBold: null };
  }
}

/**
 * Detect if text contains Arabic characters
 * @param {string} text - Text to check
 * @returns {boolean}
 */
function isArabic(text) {
  if (!text || typeof text !== 'string') return false;
  // Arabic Unicode range: \u0600-\u06FF
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Detect if text contains English characters
 * @param {string} text - Text to check
 * @returns {boolean}
 */
function isEnglish(text) {
  if (!text || typeof text !== 'string') return false;
  // English/Latin characters
  return /[a-zA-Z]/.test(text);
}

/**
 * Check if text is mixed (Arabic and English)
 * @param {string} text - Text to check
 * @returns {boolean}
 */
function isMixed(text) {
  return isArabic(text) && isEnglish(text);
}

/**
 * Clean and normalize text for PDF
 * Removes extra spaces, normalizes line breaks, etc.
 * @param {string} text - Text to clean
 * @returns {string}
 */
function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Normalize line breaks
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove control characters except newlines and tabs
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return text;
}

/**
 * Get appropriate font for text
 * @param {string} text - Text to get font for
 * @param {boolean} bold - Whether to use bold font
 * @param {boolean} hasCairo - Whether Cairo fonts are available
 * @returns {string} Font name
 */
function getFontForText(text, bold = false, hasCairo = false) {
  if (!text) return bold ? 'Helvetica-Bold' : 'Helvetica';
  
  const hasArabic = isArabic(text);
  
  if (hasArabic && hasCairo) {
    return bold ? 'Cairo-Bold' : 'Cairo-Regular';
  }
  
  // Fallback to Helvetica
  return bold ? 'Helvetica-Bold' : 'Helvetica';
}

/**
 * Get text alignment for RTL support
 * @param {string} text - Text to get alignment for
 * @returns {string} Alignment ('right' for Arabic, 'left' for English)
 */
function getTextAlignment(text) {
  if (!text) return 'left';
  
  const hasArabic = isArabic(text);
  const hasEnglish = isEnglish(text);
  
  // If mostly Arabic, use right alignment
  if (hasArabic && !hasEnglish) {
    return 'right';
  }
  
  // If mixed or English, use left alignment
  return 'left';
}

/**
 * Reverse text for RTL display (if needed)
 * Note: PDFKit doesn't support RTL natively, so we handle it manually
 * @param {string} text - Text to reverse
 * @param {boolean} isRTL - Whether text is RTL
 * @returns {string} Reversed text if RTL
 */
function prepareRTLText(text, isRTL = false) {
  if (!text || !isRTL) return text;
  
  // For RTL, we might need to reverse the text
  // But PDFKit handles this automatically with right alignment
  // So we just return the text as is
  return text;
}

/**
 * Format text for PDF display
 * Handles Arabic/English text properly
 * @param {string} text - Text to format
 * @param {boolean} hasCairo - Whether Cairo fonts are available
 * @returns {Object} Formatted text info
 */
function formatTextForPDF(text, hasCairo = false) {
  if (!text) {
    return {
      text: '',
      font: 'Helvetica',
      alignment: 'left',
      isRTL: false,
      isArabic: false,
    };
  }
  
  const cleaned = cleanText(text);
  const isArabicText = isArabic(cleaned);
  const isEnglishText = isEnglish(cleaned);
  const isRTL = isArabicText && !isEnglishText;
  
  return {
    text: cleaned,
    font: getFontForText(cleaned, false, hasCairo),
    boldFont: getFontForText(cleaned, true, hasCairo),
    alignment: getTextAlignment(cleaned),
    isRTL,
    isArabic: isArabicText,
    isEnglish: isEnglishText,
    isMixed: isMixed(cleaned),
  };
}

/**
 * Draw text with proper RTL support
 * @param {PDFDocument} doc - PDFDocument instance
 * @param {string} text - Text to draw
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} options - Text options
 * @param {boolean} hasCairo - Whether Cairo fonts are available
 */
function drawText(doc, text, x, y, options = {}, hasCairo = false) {
  const formatted = formatTextForPDF(text, hasCairo);
  
  const textOptions = {
    ...options,
    font: formatted.font,
    align: formatted.alignment,
  };
  
  // If RTL and Cairo is available, use Cairo font
  if (formatted.isRTL && hasCairo) {
    textOptions.font = formatted.font;
  }
  
  doc.text(formatted.text, x, y, textOptions);
}

/**
 * Draw bold text with proper RTL support
 * @param {PDFDocument} doc - PDFDocument instance
 * @param {string} text - Text to draw
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} options - Text options
 * @param {boolean} hasCairo - Whether Cairo fonts are available
 */
function drawBoldText(doc, text, x, y, options = {}, hasCairo = false) {
  const formatted = formatTextForPDF(text, hasCairo);
  
  const textOptions = {
    ...options,
    font: formatted.boldFont,
    align: formatted.alignment,
  };
  
  doc.text(formatted.text, x, y, textOptions);
}

module.exports = {
  registerCairoFonts,
  isArabic,
  isEnglish,
  isMixed,
  cleanText,
  getFontForText,
  getTextAlignment,
  prepareRTLText,
  formatTextForPDF,
  drawText,
  drawBoldText,
};

