/**
 * Quotation PDF Generator
 * Generates professional PDF quotations/proposals
 */

const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate quotation PDF
 * @param {Object} quotation - Quotation data with relations
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateQuotationPDF(quotation) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Quotation #${quotation.id}`,
          Author: 'ALTAYARVIP',
          Subject: 'Sales Quotation',
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

      // Header
      doc.fillColor('#2265c3')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('ALTAYAR VIP', 50, 50, { align: 'center' });

      doc.fillColor('#000000')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('QUOTATION / PROPOSAL', 50, 80, { align: 'center' });

      // Quotation Details
      let yPos = 120;
      doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Quotation #:', 50, yPos);
      doc.font('Helvetica-Bold')
        .fillColor('#000000')
        .text(quotation.id.toString(), 150, yPos);
      yPos += 20;

      doc.font('Helvetica')
        .fillColor('#666666')
        .text('Date:', 50, yPos);
      doc.font('Helvetica-Bold')
        .fillColor('#000000')
        .text(new Date(quotation.created_at).toLocaleDateString('en-US'), 150, yPos);
      yPos += 20;

      if (quotation.valid_until) {
        doc.font('Helvetica')
          .fillColor('#666666')
          .text('Valid Until:', 50, yPos);
        doc.font('Helvetica-Bold')
          .fillColor('#000000')
          .text(new Date(quotation.valid_until).toLocaleDateString('en-US'), 150, yPos);
        yPos += 20;
      }

      // Customer Information
      yPos += 20;
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#2265c3')
        .text('Customer Information', 50, yPos);
      yPos += 20;

      if (quotation.customer) {
        doc.fontSize(11)
          .font('Helvetica')
          .fillColor('#000000')
          .text(`Name: ${quotation.customer.name || quotation.customer.email || 'N/A'}`, 50, yPos);
        yPos += 15;
        doc.text(`Email: ${quotation.customer.email || 'N/A'}`, 50, yPos);
        yPos += 15;
        if (quotation.customer.phone) {
          doc.text(`Phone: ${quotation.customer.phone}`, 50, yPos);
          yPos += 15;
        }
      }

      // Items
      yPos += 20;
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#2265c3')
        .text('Items', 50, yPos);
      yPos += 20;

      let items = [];
      if (quotation.items) {
        try {
          items = typeof quotation.items === 'string' ? JSON.parse(quotation.items) : quotation.items;
        } catch (e) {
          items = [];
        }
      }

      if (quotation.package) {
        doc.fontSize(11)
          .font('Helvetica')
          .fillColor('#000000')
          .text(`Package: ${quotation.package.title || quotation.package.name || 'N/A'}`, 50, yPos);
        yPos += 15;
        doc.text(`Description: ${quotation.package.description || 'N/A'}`, 50, yPos);
        yPos += 15;
        doc.text(`Price: ${quotation.package.price || 0} EGP`, 50, yPos);
        yPos += 20;
      }

      if (items.length > 0) {
        items.forEach((item, index) => {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
          doc.fontSize(11)
            .font('Helvetica')
            .fillColor('#000000')
            .text(`${index + 1}. ${item.name || 'Item'}`, 50, yPos);
          yPos += 15;
          doc.text(`   Quantity: ${item.quantity || 1}`, 70, yPos);
          yPos += 15;
          doc.text(`   Price: ${item.price || 0} EGP`, 70, yPos);
          yPos += 15;
          doc.text(`   Subtotal: ${(item.price || 0) * (item.quantity || 1)} EGP`, 70, yPos);
          yPos += 20;
        });
      }

      // Totals
      yPos += 10;
      doc.strokeColor('#CCCCCC')
        .lineWidth(1)
        .moveTo(50, yPos)
        .lineTo(545, yPos)
        .stroke();
      yPos += 20;

      doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#000000')
        .text('Subtotal:', 400, yPos);
      doc.font('Helvetica-Bold')
        .text(`${quotation.total_amount / (1 - (quotation.discount || 0) / 100)} EGP`, 450, yPos);
      yPos += 20;

      if (quotation.discount > 0) {
        doc.font('Helvetica')
          .text(`Discount (${quotation.discount}%):`, 400, yPos);
        const discountAmount = quotation.total_amount / (1 - (quotation.discount / 100)) - quotation.total_amount;
        doc.font('Helvetica-Bold')
          .text(`-${discountAmount.toFixed(2)} EGP`, 450, yPos);
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
      doc.text(`${quotation.total_amount.toFixed(2)} EGP`, 450, yPos);

      // Notes
      if (quotation.notes) {
        yPos += 40;
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#2265c3')
          .text('Notes:', 50, yPos);
        yPos += 20;
        doc.fontSize(11)
          .font('Helvetica')
          .fillColor('#000000')
          .text(quotation.notes, 50, yPos, { width: 495 });
      }

      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Thank you for your business!', 50, pageHeight - 80, { align: 'center' });
      doc.text('ALTAYAR VIP - Premium Travel Services', 50, pageHeight - 60, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateQuotationPDF
};

