/**
 * Quotation/Proposal Controller
 * Handles creating and managing sales quotations/proposals
 */

const Quotation = require('../models/Quotation');
const User = require('../models/User');
const Package = require('../models/Package');
const Notification = require('../models/Notification');
const externalApiService = require('../services/externalApiService');
const asyncHandler = require('express-async-handler');
const { generateQuotationPDF: generateQuotationPDFUtil } = require('../utils/quotationPdfGenerator');

// Get all quotations (Admin/Sales only)
const getQuotations = asyncHandler(async (req, res) => {
  const { status, customerId, salesId } = req.query;
  
  let query = Quotation.query()
    .withGraphFetched('[customer, sales, package]')
    .orderBy('created_at', 'desc');

  if (status) {
    query = query.where('status', status);
  }

  if (customerId) {
    query = query.where('customer_id', customerId);
  }

  if (salesId) {
    query = query.where('sales_id', salesId);
  }

  const quotations = await query;

  res.json({
    success: true,
    data: quotations
  });
});

// Get quotation by ID
const getQuotationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quotation = await Quotation.query()
    .findById(id)
    .withGraphFetched('[customer, sales, package, items]');

  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: 'Quotation not found'
    });
  }

  res.json({
    success: true,
    data: quotation
  });
});

// Create new quotation (Sales/Admin only)
const createQuotation = asyncHandler(async (req, res) => {
  const { customerId, packageId, items, notes, validUntil, discount } = req.body;
  const salesId = req.user.id;

  if (!customerId) {
    return res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
  }

  // Calculate total
  let total = 0;
  if (packageId) {
    const packageData = await Package.query().findById(packageId);
    if (packageData) {
      total = packageData.price || 0;
    }
  }

  if (items && Array.isArray(items)) {
    items.forEach(item => {
      total += (item.price || 0) * (item.quantity || 1);
    });
  }

  // Apply discount
  if (discount) {
    total = total * (1 - discount / 100);
  }

  const quotation = await Quotation.query().insert({
    customer_id: customerId,
    sales_id: salesId,
    package_id: packageId,
    items: JSON.stringify(items || []),
    notes: notes || '',
    total_amount: total,
    discount: discount || 0,
    status: 'draft',
    valid_until: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  });

  const quotationWithRelations = await Quotation.query()
    .findById(quotation.id)
    .withGraphFetched('[customer, sales, package]');

  res.status(201).json({
    success: true,
    message: 'Quotation created successfully',
    data: quotationWithRelations
  });
});

// Update quotation
const updateQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items, notes, validUntil, discount, status } = req.body;

  const quotation = await Quotation.query().findById(id);

  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: 'Quotation not found'
    });
  }

  // Check permissions
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin' && quotation.sales_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this quotation'
    });
  }

  const updateData = {};
  if (items !== undefined) updateData.items = JSON.stringify(items);
  if (notes !== undefined) updateData.notes = notes;
  if (validUntil !== undefined) updateData.valid_until = validUntil;
  if (discount !== undefined) updateData.discount = discount;
  if (status !== undefined) updateData.status = status;

  // Recalculate total if items changed
  if (items !== undefined) {
    let total = 0;
    if (quotation.package_id) {
      const packageData = await Package.query().findById(quotation.package_id);
      if (packageData) {
        total = packageData.price || 0;
      }
    }

    if (items && Array.isArray(items)) {
      items.forEach(item => {
        total += (item.price || 0) * (item.quantity || 1);
      });
    }

    if (discount !== undefined) {
      total = total * (1 - (discount / 100));
    } else if (quotation.discount) {
      total = total * (1 - (quotation.discount / 100));
    }

    updateData.total_amount = total;
  }

  await Quotation.query()
    .findById(id)
    .patch(updateData);

  const updatedQuotation = await Quotation.query()
    .findById(id)
    .withGraphFetched('[customer, sales, package]');

  res.json({
    success: true,
    message: 'Quotation updated successfully',
    data: updatedQuotation
  });
});

// Send quotation to customer
const sendQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sendEmail, sendNotification } = req.body || {};

  const quotation = await Quotation.query()
    .findById(id)
    .withGraphFetched('[customer, sales, package]');

  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: 'Quotation not found'
    });
  }

  // Update status to sent
  await Quotation.query()
    .findById(id)
    .patch({ status: 'sent', sent_at: new Date().toISOString() });

  const notificationJobs = [];

  if (sendNotification && quotation.customer_id) {
    notificationJobs.push(
      Notification.query().insert({
        user_id: quotation.customer_id,
        sender_id: req.user?.id || null,
        type: 'offer',
        title: 'عرض سعر جديد من Altayar VIP',
        message: `لدينا عرض جديد بقيمة ${quotation.total_amount || 0} ريال - اضغط للاطلاع على جميع التفاصيل.`,
        reference_id: quotation.id
      })
    );
  }

  if (sendEmail && quotation.customer?.email) {
    const subject = `عرض سعر جديد (#${quotation.id}) - Altayar VIP`;
    const body = `
      مرحباً ${quotation.customer.name || ''},

      أرسلنا لك عرض سعر جديد بقيمة ${quotation.total_amount || 0} ريال.
      يمكنك مراجعة العرض وتحميل نسخة PDF من خلال التطبيق أو الموقع.

      تحياتنا،
      فريق Altayar VIP
    `;

    notificationJobs.push(
      externalApiService
        .sendEmail(quotation.customer.email, subject, body, false)
        .catch(error => {
          console.error('Failed to send quotation email:', error.message);
        })
    );
  }

  await Promise.allSettled(notificationJobs);

  const updatedQuotation = await Quotation.query()
    .findById(id)
    .withGraphFetched('[customer, sales, package]');

  res.json({
    success: true,
    message: 'Quotation sent successfully',
    data: updatedQuotation
  });
});

// Generate PDF for quotation
const generateQuotationPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quotation = await Quotation.query()
    .findById(id)
    .withGraphFetched('[customer, sales, package]');

  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: 'Quotation not found'
    });
  }

  try {
    const pdfBuffer = await generateQuotationPDFUtil(quotation);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quotation_${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF'
    });
  }
});

// Delete quotation
const deleteQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quotation = await Quotation.query().findById(id);

  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: 'Quotation not found'
    });
  }

  // Check permissions
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin' && quotation.sales_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this quotation'
    });
  }

  await Quotation.query().deleteById(id);

  res.json({
    success: true,
    message: 'Quotation deleted successfully'
  });
});

module.exports = {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  sendQuotation,
  generateQuotationPDF,
  deleteQuotation
};

