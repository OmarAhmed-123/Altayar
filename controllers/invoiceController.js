/**
 * Invoice Controller
 * Handles manual invoice creation and management
 * Secure and professional implementation
 */

const asyncHandler = require('express-async-handler');
const { generateInvoicePDF } = require('../utils/invoicePdfGenerator');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const DownloadTracking = require('../models/DownloadTracking');
const Notification = require('../models/Notification');

/**
 * Helper function to safely get text value
 */
function safeText(value, defaultValue = 'N/A') {
  if (value === null || value === undefined || value === '') return defaultValue;
  return String(value);
}

/**
 * Create a manual invoice (not linked to a booking)
 * @route POST /api/invoices/manual
 * @access Private (Admin, Accountant, Sales)
 */
exports.createManualInvoice = asyncHandler(async (req, res) => {
  // Support both formats: Frontend format (ManualInvoiceData) and simple format
  const {
    // Frontend format (ManualInvoiceData)
    id,
    invoiceTitle,
    invoiceDescription,
    invoiceNumber,
    issueDate,
    dueDate,
    status,
    items, // Frontend uses 'items' instead of 'services'
    client, // Frontend uses 'client' object
    discountSettings,
    taxSettings,
    paymentSettings,
    notes,
    internalNotes,
    paymentTerms,
    subtotal,
    total,
    createdAt,
    updatedAt,
    createdBy,
    
    // Simple format (backward compatibility)
    userId,
    customerName,
    customerEmail,
    invoiceDate,
    services,
    tax,
    taxRate,
    discount,
    terms,
  } = req.body;

  // Determine which format is being used
  // Frontend format indicators: items array, client object, discountSettings, taxSettings, etc.
  const hasFrontendIndicators = !!(items !== undefined || client !== undefined || discountSettings !== undefined || taxSettings !== undefined || paymentSettings !== undefined || invoiceTitle !== undefined || invoiceNumber !== undefined);
  const isFrontendFormat = hasFrontendIndicators;
  const isSimpleFormat = !isFrontendFormat && !!(services || userId || customerEmail);

  // Validation
  if (isFrontendFormat) {
    // Frontend format validation
    // Items validation - allow empty items if total or subtotal is provided
    if (items !== undefined && !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array',
      });
    }

    // Items can be empty if total/subtotal is provided
    const itemsArray = Array.isArray(items) ? items : [];
    if (itemsArray.length === 0 && !total && !subtotal) {
      return res.status(400).json({
        success: false,
        message: 'Either items array must not be empty, or total/subtotal must be provided',
      });
    }

    // Client validation - allow empty client if userId is provided
    const clientObj = client || {};
    const clientUserId = clientObj.userId || clientObj.id || userId;
    
    if (!clientObj.name && !clientObj.email && !clientUserId) {
      return res.status(400).json({
        success: false,
        message: 'Either client information (name or email) or userId is required',
      });
    }
  } else if (isSimpleFormat) {
    // Simple format validation
    if (!userId && !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Either userId or customerEmail is required',
      });
    }

    if (!services || !Array.isArray(services)) {
      return res.status(400).json({
        success: false,
        message: 'Services must be an array',
      });
    }

    // Services can be empty if total/subtotal is provided
    if (services.length === 0 && !total && !subtotal) {
      return res.status(400).json({
        success: false,
        message: 'Either services array must not be empty, or total/subtotal must be provided',
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid request format. Please provide either items/client (Frontend format) or services/userId (Simple format)',
    });
  }

  try {
    let customerData = {};
    let finalInvoiceNumber;
    let finalInvoiceDate;
    let finalDueDate;
    let invoiceServices = [];
    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    let calculatedDiscount = 0;
    let calculatedTotal = 0;
    let invoiceTerms = '';
    let invoiceNotes = '';

    if (isFrontendFormat) {
      // Frontend format processing
      const clientObj = client || {};
      customerData = {
        name: safeText(clientObj.name, 'Customer'),
        email: safeText(clientObj.email, null),
      };

      // Get userId from client if available
      const clientUserId = clientObj.userId || clientObj.id || userId;

      // Get user if userId provided
      let user = null;
      if (clientUserId) {
        try {
          user = await User.query()
            .findById(clientUserId)
            .select('id', 'name', 'email');
          if (user) {
            customerData.name = user.name || customerData.name;
            customerData.email = user.email || customerData.email;
          }
        } catch (error) {
          console.warn('⚠️ [Manual Invoice] User not found:', error.message);
        }
      }

      finalInvoiceNumber = invoiceNumber || `INV-MANUAL-${Date.now()}`;
      finalInvoiceDate = issueDate ? new Date(issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      finalDueDate = dueDate ? new Date(dueDate).toISOString().split('T')[0] : (() => {
        const date = new Date(finalInvoiceDate);
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
      })();

      // Process items (handle empty array case)
      const itemsArray = Array.isArray(items) ? items : [];
      if (itemsArray.length > 0) {
        invoiceServices = itemsArray.map(item => ({
          name: safeText(item.name || item.description, 'Service'),
          description: safeText(item.description || item.name, ''),
          quantity: parseFloat(item.quantity) || 1,
          rate: parseFloat(item.rate || item.price || item.unitPrice) || 0,
          total: parseFloat(item.total || item.amount) || (parseFloat(item.rate || item.price || item.unitPrice || 0) * parseFloat(item.quantity || 1)),
        }));
      } else {
        // If items is empty, create a placeholder service
        invoiceServices = [{
          name: 'Invoice Total',
          description: 'Total amount',
          quantity: 1,
          rate: total || subtotal || 0,
          total: total || subtotal || 0,
        }];
      }

      // Calculate totals from Frontend format
      calculatedSubtotal = subtotal || invoiceServices.reduce((sum, service) => sum + service.total, 0);
      
      // Calculate tax from taxSettings
      const taxRateValue = taxSettings?.taxRate || 0;
      calculatedTax = taxSettings?.calculationMethod === 'before_tax' 
        ? (calculatedSubtotal - (discountSettings?.discountValue || 0)) * (taxRateValue / 100)
        : calculatedSubtotal * (taxRateValue / 100);

      // Calculate discount from discountSettings
      if (discountSettings?.discountType === 'percentage') {
        calculatedDiscount = calculatedSubtotal * (discountSettings.discountValue / 100);
      } else if (discountSettings?.discountType === 'fixed') {
        calculatedDiscount = discountSettings.discountValue || 0;
      } else {
        calculatedDiscount = 0;
      }

      calculatedTotal = total || (calculatedSubtotal + calculatedTax - calculatedDiscount);
      invoiceTerms = safeText(paymentTerms, '');
      invoiceNotes = safeText(notes || internalNotes, '');

    } else {
      // Simple format processing
      let user = null;
      if (userId) {
        try {
          user = await User.query()
            .findById(userId)
            .select('id', 'name', 'email');
        } catch (error) {
          console.warn('⚠️ [Manual Invoice] User not found:', error.message);
        }
      }

      customerData = {
        name: customerName || (user ? (user.name || 'Customer') : 'Customer'),
        email: customerEmail || (user ? user.email : null),
      };

      finalInvoiceNumber = invoiceNumber || `INV-MANUAL-${Date.now()}`;
      finalInvoiceDate = invoiceDate || new Date().toISOString().split('T')[0];
      finalDueDate = dueDate || (() => {
        const date = new Date(finalInvoiceDate);
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
      })();

      invoiceServices = services.map(service => ({
        name: safeText(service.name, 'Service'),
        description: safeText(service.description, ''),
        quantity: parseFloat(service.quantity) || 1,
        rate: parseFloat(service.rate) || 0,
        total: parseFloat(service.total) || (parseFloat(service.rate || 0) * parseFloat(service.quantity || 1)),
      }));

      calculatedSubtotal = subtotal || invoiceServices.reduce((sum, service) => sum + service.total, 0);
      calculatedTax = tax || (taxRate ? (calculatedSubtotal * parseFloat(taxRate) / 100) : 0);
      calculatedDiscount = discount || 0;
      calculatedTotal = total || (calculatedSubtotal + calculatedTax - calculatedDiscount);
      invoiceTerms = safeText(terms, '');
      invoiceNotes = safeText(notes, '');
    }

    // Prepare invoice data for PDF generation
    const invoiceData = {
      invoiceNumber: finalInvoiceNumber,
      invoiceDate: finalInvoiceDate,
      dueDate: finalDueDate,
      user: customerData,
      services: invoiceServices,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      taxRate: isFrontendFormat ? (taxSettings?.taxRate || 0) : (taxRate || 0),
      discount: calculatedDiscount,
      total: calculatedTotal,
      terms: invoiceTerms,
      notes: invoiceNotes,
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Create transaction record (optional)
    let createdTransaction = null;
    if (userId) {
      try {
        createdTransaction = await Transaction.query().insert({
          user_id: userId,
          type: 'manual_invoice',
          amount: -calculatedTotal, // Negative because it's money owed
          description: `Manual Invoice ${finalInvoiceNumber}`,
          status: 'pending',
          payment_details: {
            invoiceNumber: finalInvoiceNumber,
            invoiceDate: finalInvoiceDate,
            services: invoiceServices.length,
            invoiceTitle: invoiceTitle || 'Invoice',
            invoiceDescription: invoiceDescription,
            status: status || 'Draft',
            items: invoiceServices,
            client: customerData,
            discountSettings: discountSettings || {},
            taxSettings: taxSettings || {},
            paymentSettings: paymentSettings || {},
            notes: invoiceNotes,
            internalNotes: internalNotes || '',
            paymentTerms: invoiceTerms,
            subtotal: calculatedSubtotal,
            tax: calculatedTax,
            discount: calculatedDiscount,
            total: calculatedTotal,
            createdBy: req.user.id,
          },
        });
      } catch (transactionError) {
        console.warn('⚠️ [Manual Invoice] Could not create transaction record:', transactionError.message);
        // Continue even if transaction creation fails
      }
    }

    // Track download
    try {
      await DownloadTracking.trackDownload(req.user.id, 'manual_invoice', `invoice-${finalInvoiceNumber}.pdf`, '', {
        source: 'web',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        invoice_number: finalInvoiceNumber,
        customer_id: userId,
        action: 'create',
      });
    } catch (trackError) {
      console.warn('⚠️ [Manual Invoice] Could not track download:', trackError.message);
    }

    // Check if client wants JSON response (for API calls) or PDF (for direct download)
    const acceptHeader = req.get('Accept') || '';
    const wantsJson = acceptHeader.includes('application/json') || req.query.format === 'json';

    if (wantsJson) {
      // Return JSON response with invoice data
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      res.status(200).json({
        success: true,
        message: 'Invoice created successfully',
        data: {
          id: createdTransaction?.id || (id || Date.now()), // Use transaction ID if available, or provided ID, or timestamp
          invoice_title: invoiceTitle || 'Invoice',
          invoice_description: invoiceDescription,
          invoice_number: finalInvoiceNumber,
          issue_date: finalInvoiceDate,
          due_date: finalDueDate,
          status: status || 'Draft',
          items: invoiceServices,
          client: {
            name: customerData.name,
            email: customerData.email,
            userId: userId || (client?.userId || client?.id) || null,
          },
          discount_settings: discountSettings || {},
          tax_settings: taxSettings || {},
          payment_settings: paymentSettings || {},
          notes: invoiceNotes,
          internal_notes: internalNotes || '',
          payment_terms: invoiceTerms,
          subtotal: calculatedSubtotal,
          tax: calculatedTax,
          discount: calculatedDiscount,
          total: calculatedTotal,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: req.user.id,
        },
      });
    } else {
      // Return PDF response (default behavior for backward compatibility)
      const filename = `invoice-${finalInvoiceNumber}.pdf`;
      
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
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
    }

  } catch (error) {
    console.error('❌ [Manual Invoice] Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating manual invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get invoice by ID
 * @route GET /api/invoices/:id
 * @access Private
 */
exports.getInvoice = asyncHandler(async (req, res) => {
  // This would require an Invoice model if you want to store invoices
  // For now, we'll return a message indicating manual invoices are not stored
  res.status(200).json({
    success: true,
    message: 'Manual invoices are generated on-demand and not stored in database',
    note: 'Use POST /api/invoices/manual to generate a new invoice',
  });
});

/**
 * Get all invoices (Admin)
 * @route GET /api/invoices
 * @access Private (Admin, Accountant)
 */
exports.getAllInvoices = asyncHandler(async (req, res) => {
  // This would require an Invoice model if you want to store invoices
  // For now, we'll return transactions that are invoices
  try {
    const transactions = await Transaction.query()
      .where('type', 'manual_invoice')
      .orWhere('type', 'like', '%invoice%')
      .withGraphFetched('user(selectNameAndEmail)')
      .modifiers({
        selectNameAndEmail(builder) {
          builder.select('id', 'name', 'email');
        }
      })
      .orderBy('created_at', 'desc')
      .limit(100);

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Download invoice PDF
 * @route GET /api/invoices/:id/pdf
 * @access Private
 */
exports.downloadInvoicePDF = asyncHandler(async (req, res) => {
  // This would require an Invoice model to retrieve invoice data
  // For now, we'll return a message
  res.status(404).json({
    success: false,
    message: 'Invoice not found. Use POST /api/invoices/manual to generate a new invoice',
  });
});

/**
 * Search clients for manual invoice
 * @route GET /api/invoices/clients/search
 * @access Private (Admin, Accountant, Sales)
 */
exports.searchClients = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  try {
    const searchQuery = q.trim().toLowerCase();
    
    // Search users by name or email
    // Note: users table has: id, name, email, profile_picture_url
    // It does NOT have: phone, first_name, last_name, company_name
    const users = await User.query()
      .where((builder) => {
        builder
          .whereRaw('LOWER(name) LIKE ?', [`%${searchQuery}%`])
          .orWhereRaw('LOWER(email) LIKE ?', [`%${searchQuery}%`]);
      })
      .select('id', 'name', 'email', 'profile_picture_url')
      .limit(20)
      .orderBy('name', 'asc');

    // Format response to match Frontend expectations
    const clients = users.map(user => {
      // Parse name into first and last name if possible
      const nameParts = (user.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return {
        id: user.id,
        name: user.name || 'Customer',
        email: user.email,
        firstName: firstName,
        lastName: lastName,
        companyName: null, // Not available in users table
        phone: null, // Not available in users table
        profilePictureUrl: user.profile_picture_url || null,
        // Format for Frontend ManualInvoiceClient
        userId: user.id,
      };
    });

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    res.status(200).json({
      success: true,
      data: clients,
      count: clients.length,
    });
  } catch (error) {
    console.error('❌ [Search Clients] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching clients',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get all clients for manual invoice
 * @route GET /api/invoices/clients
 * @access Private (Admin, Accountant, Sales)
 */
exports.getClients = asyncHandler(async (req, res) => {
  try {
    const { limit = 1000, offset, page, role } = req.query;
    
    // Calculate offset from page if provided, otherwise use offset directly
    const pageSize = parseInt(limit);
    const calculatedOffset = page !== undefined 
      ? (parseInt(page) - 1) * pageSize 
      : (offset ? parseInt(offset) : 0);
    
    // Build query
    let query = User.query();
    
    // Filter by role if provided (exclude admin roles, only get customers)
    if (role) {
      query = query.where('role', role);
    } else {
      // Default: only get customers (not admins)
      query = query.whereIn('role', ['customer']);
    }
    
    // Get total count for pagination
    const totalCount = await query.clone().resultSize();
    
    // Get users with pagination
    const users = await query
      .select('id', 'name', 'email', 'profile_picture_url', 'role', 'created_at')
      .limit(pageSize)
      .offset(calculatedOffset)
      .orderBy('name', 'asc');

    // Format response to match Frontend expectations
    const clients = users.map(user => {
      // Parse name into first and last name if possible
      const nameParts = (user.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return {
        id: user.id,
        name: user.name || 'Customer',
        email: user.email,
        firstName: firstName,
        lastName: lastName,
        companyName: null, // Not available in users table
        phone: null, // Not available in users table
        profilePictureUrl: user.profile_picture_url || null,
        role: user.role,
        createdAt: user.created_at,
        // Format for Frontend ManualInvoiceClient
        userId: user.id,
      };
    });

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    res.status(200).json({
      success: true,
      data: clients,
      count: clients.length,
      total: totalCount,
      limit: pageSize,
      offset: calculatedOffset,
      page: page !== undefined ? parseInt(page) : Math.floor(calculatedOffset / pageSize) + 1,
    });
  } catch (error) {
    console.error('❌ [Get Clients] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching clients',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Update a manual invoice
 * @route PUT /api/invoices/manual/:id
 * @access Private (Admin, Accountant, Sales)
 */
exports.updateManualInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  try {
    // Extract invoice data from request body
    const {
      invoiceTitle,
      invoiceDescription,
      invoiceNumber,
      issueDate,
      dueDate,
      status,
      items,
      client,
      discountSettings,
      taxSettings,
      paymentSettings,
      notes,
      internalNotes,
      paymentTerms,
      subtotal,
      total,
    } = req.body;

    // PostgreSQL integer max value is 2147483647
    // If ID is larger than this (like timestamp), don't use it for database query
    const MAX_INT = 2147483647;
    const invoiceId = parseInt(id);
    const isValidId = !isNaN(invoiceId) && invoiceId <= MAX_INT;

    let transaction = null;

    // First, try to find by invoice number (most reliable, especially for timestamp IDs)
    if (invoiceNumber) {
      try {
        transaction = await Transaction.query()
          .where('type', 'manual_invoice')
          .whereRaw("(payment_details->>'invoiceNumber' = ? OR metadata->>'invoiceNumber' = ?)", [invoiceNumber, invoiceNumber])
          .first();
      } catch (error) {
        console.warn('⚠️ [Update Manual Invoice] Error finding by invoice number:', error.message);
      }
    }

    // If not found by invoice number and ID is valid, try by ID
    if (!transaction && isValidId) {
      try {
        transaction = await Transaction.query()
          .where('id', invoiceId)
          .where('type', 'manual_invoice')
          .first();
      } catch (error) {
        console.warn('⚠️ [Update Manual Invoice] Error finding by ID:', error.message);
        transaction = null;
      }
    }

    if (transaction) {
      // Calculate updated totals if items are provided
      let calculatedSubtotal = subtotal;
      let calculatedTax = 0;
      let calculatedDiscount = 0;
      let calculatedTotal = total;

      if (items && Array.isArray(items) && items.length > 0) {
        calculatedSubtotal = subtotal || items.reduce((sum, item) => {
          return sum + (parseFloat(item.total || item.amount || 0));
        }, 0);

        // Calculate tax from taxSettings
        if (taxSettings?.taxRate) {
          const taxRateValue = parseFloat(taxSettings.taxRate) || 0;
          calculatedTax = taxSettings?.calculationMethod === 'before_tax' 
            ? (calculatedSubtotal - (discountSettings?.discountValue || 0)) * (taxRateValue / 100)
            : calculatedSubtotal * (taxRateValue / 100);
        }

        // Calculate discount from discountSettings
        if (discountSettings?.discountType === 'percentage') {
          calculatedDiscount = calculatedSubtotal * (parseFloat(discountSettings.discountValue || 0) / 100);
        } else if (discountSettings?.discountType === 'fixed') {
          calculatedDiscount = parseFloat(discountSettings.discountValue || 0);
        }

        calculatedTotal = total || (calculatedSubtotal + calculatedTax - calculatedDiscount);
      }

      // Update transaction metadata
      const currentMetadata = transaction.metadata || transaction.payment_details || {};
      const updatedMetadata = {
        ...currentMetadata,
        invoiceTitle: invoiceTitle || currentMetadata.invoiceTitle,
        invoiceDescription: invoiceDescription || currentMetadata.invoiceDescription,
        invoiceNumber: invoiceNumber || currentMetadata.invoiceNumber,
        issueDate: issueDate || currentMetadata.issueDate,
        dueDate: dueDate || currentMetadata.dueDate,
        status: status || currentMetadata.status || 'Draft',
        items: items || currentMetadata.items,
        client: client || currentMetadata.client,
        discountSettings: discountSettings || currentMetadata.discountSettings,
        taxSettings: taxSettings || currentMetadata.taxSettings,
        paymentSettings: paymentSettings || currentMetadata.paymentSettings,
        notes: notes !== undefined ? notes : currentMetadata.notes,
        internalNotes: internalNotes !== undefined ? internalNotes : currentMetadata.internalNotes,
        paymentTerms: paymentTerms || currentMetadata.paymentTerms,
        subtotal: calculatedSubtotal !== undefined ? calculatedSubtotal : currentMetadata.subtotal,
        tax: calculatedTax !== undefined ? calculatedTax : currentMetadata.tax,
        discount: calculatedDiscount !== undefined ? calculatedDiscount : currentMetadata.discount,
        total: calculatedTotal !== undefined ? calculatedTotal : currentMetadata.total,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.id,
      };

      // Update transaction
      await Transaction.query()
        .where('id', transaction.id)
        .patch({
          amount: -Math.abs(calculatedTotal || transaction.amount || 0),
          description: `Manual Invoice ${updatedMetadata.invoiceNumber || currentMetadata.invoiceNumber || invoiceId}`,
          payment_details: updatedMetadata,
          metadata: updatedMetadata, // Also save to metadata if column exists
        });

      // Get updated transaction with user info
      const updatedTransaction = await Transaction.query()
        .where('id', transaction.id)
        .withGraphFetched('user(selectUserInfo)')
        .modifiers({
          selectUserInfo(builder) {
            builder.select('id', 'name', 'email');
          }
        })
        .first();

      return res.status(200).json({
        success: true,
        message: 'Invoice updated successfully',
        data: {
          id: updatedTransaction.id,
          invoice_title: updatedMetadata.invoiceTitle,
          invoice_description: updatedMetadata.invoiceDescription,
          invoice_number: updatedMetadata.invoiceNumber,
          issue_date: updatedMetadata.issueDate,
          due_date: updatedMetadata.dueDate,
          status: updatedMetadata.status,
          items: updatedMetadata.items,
          client: updatedMetadata.client,
          discount_settings: updatedMetadata.discountSettings,
          tax_settings: updatedMetadata.taxSettings,
          payment_settings: updatedMetadata.paymentSettings,
          notes: updatedMetadata.notes,
          internal_notes: updatedMetadata.internalNotes,
          payment_terms: updatedMetadata.paymentTerms,
          subtotal: updatedMetadata.subtotal,
          tax: updatedMetadata.tax,
          discount: updatedMetadata.discount,
          total: updatedMetadata.total,
          created_at: updatedTransaction.created_at,
          updated_at: updatedMetadata.updatedAt,
          created_by: updatedTransaction.metadata?.createdBy,
        },
      });
    } else {
      // If transaction not found, return the updated data (for frontend compatibility)
      return res.status(200).json({
        success: true,
        message: 'Invoice updated successfully (not stored in database)',
        data: {
          id: invoiceId,
          ...req.body,
          updated_at: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('❌ [Update Manual Invoice] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating manual invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get a specific manual invoice
 * @route GET /api/invoices/manual/:id
 * @access Private (Admin, Accountant, Sales)
 */
exports.getManualInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { invoiceNumber } = req.query; // Also accept invoice number as query parameter
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // PostgreSQL integer max value is 2147483647
  const MAX_INT = 2147483647;
  const invoiceId = parseInt(id);
  const isValidId = !isNaN(invoiceId) && invoiceId <= MAX_INT;

  // Try to find transaction related to this invoice
  try {
    let transaction = null;

    // First, try to find by invoice number (most reliable)
    const searchInvoiceNumber = invoiceNumber || id; // Use id as invoice number if it looks like one
    if (searchInvoiceNumber && searchInvoiceNumber.length > 10) {
      // If it's a long string (like timestamp), treat it as invoice number
      try {
        transaction = await Transaction.query()
          .where('type', 'manual_invoice')
          .whereRaw("(payment_details->>'invoiceNumber' = ? OR metadata->>'invoiceNumber' = ?)", [searchInvoiceNumber, searchInvoiceNumber])
          .withGraphFetched('user(selectUserInfo)')
          .modifiers({
            selectUserInfo(builder) {
              builder.select('id', 'name', 'email');
            }
          })
          .first();
      } catch (error) {
        console.warn('⚠️ [Get Manual Invoice] Error finding by invoice number:', error.message);
      }
    }

    // If not found and ID is valid, try by ID
    if (!transaction && isValidId) {
      try {
        transaction = await Transaction.query()
          .where('type', 'manual_invoice')
          .where('id', invoiceId)
          .withGraphFetched('user(selectUserInfo)')
          .modifiers({
            selectUserInfo(builder) {
              builder.select('id', 'name', 'email');
            }
          })
          .first();
      } catch (error) {
        console.warn('⚠️ [Get Manual Invoice] Error finding by ID:', error.message);
      }
    }

    // If still not found, try searching by invoice number pattern
    if (!transaction && !isValidId) {
      try {
        transaction = await Transaction.query()
          .where('type', 'manual_invoice')
          .whereRaw("(payment_details->>'invoiceNumber' LIKE ? OR metadata->>'invoiceNumber' LIKE ?)", [`%${id}%`, `%${id}%`])
          .withGraphFetched('user(selectUserInfo)')
          .modifiers({
            selectUserInfo(builder) {
              builder.select('id', 'name', 'email');
            }
          })
          .first();
      } catch (error) {
        console.warn('⚠️ [Get Manual Invoice] Error finding by pattern:', error.message);
      }
    }

    if (transaction) {
      const metadata = transaction.metadata || transaction.payment_details || {};
      return res.status(200).json({
        success: true,
        data: {
          id: transaction.id,
          invoice_title: metadata.invoiceTitle || 'Invoice',
          invoice_description: metadata.invoiceDescription,
          invoice_number: metadata.invoiceNumber || `INV-${invoiceId}`,
          issue_date: metadata.issueDate || transaction.created_at,
          due_date: metadata.dueDate,
          status: metadata.status || 'Draft',
          items: metadata.items || [],
          client: metadata.client || (transaction.user ? {
            id: transaction.user.id,
            name: transaction.user.name,
            email: transaction.user.email,
            userId: transaction.user.id,
          } : null),
          discount_settings: metadata.discountSettings || {},
          tax_settings: metadata.taxSettings || {},
          payment_settings: metadata.paymentSettings || {},
          notes: metadata.notes,
          internal_notes: metadata.internalNotes,
          payment_terms: metadata.paymentTerms,
          subtotal: metadata.subtotal,
          tax: metadata.tax,
          discount: metadata.discount,
          total: metadata.total || Math.abs(transaction.amount),
          created_at: transaction.created_at,
          updated_at: metadata.updatedAt || transaction.updated_at,
          created_by: metadata.createdBy || transaction.user_id,
        },
      });
    }
  } catch (error) {
    console.warn('⚠️ [Get Manual Invoice] Error finding transaction:', error.message);
  }

  res.status(200).json({
    success: true,
    message: 'Manual invoices are generated on-demand and not stored in database',
    data: {
      id: invoiceId,
      note: 'Use POST /api/invoices/manual to generate a new invoice',
    },
  });
});

/**
 * Send manual invoice to client
 * @route POST /api/invoices/manual/:id/send
 * @access Private (Admin, Accountant, Sales)
 */
exports.sendManualInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sendEmail = true, sendNotification = true, client, invoiceNumber } = req.body;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  try {
    // PostgreSQL integer max value is 2147483647
    // If ID is larger than this (like timestamp), don't use it for database query
    const MAX_INT = 2147483647;
    const invoiceId = parseInt(id);
    const isValidId = !isNaN(invoiceId) && invoiceId <= MAX_INT;

    let transaction = null;

    // First, try to find by invoice number (most reliable)
    // Get invoice number from multiple sources
    const searchInvoiceNumber = invoiceNumber 
      || req.body.invoiceNumber 
      || (req.body.invoice_number)
      || (id && id.length > 10 ? id : null); // Use id as invoice number if it's a long string (timestamp)
    
    if (searchInvoiceNumber) {
      try {
        transaction = await Transaction.query()
          .where('type', 'manual_invoice')
          .whereRaw("(payment_details->>'invoiceNumber' = ? OR metadata->>'invoiceNumber' = ?)", [String(searchInvoiceNumber), String(searchInvoiceNumber)])
          .withGraphFetched('user(selectUserInfo)')
          .modifiers({
            selectUserInfo(builder) {
              builder.select('id', 'name', 'email');
            }
          })
          .first();
      } catch (error) {
        console.warn('⚠️ [Send Invoice] Error finding by invoice number:', error.message);
      }
    }

    // If not found by invoice number and ID is valid, try by ID
    if (!transaction && isValidId) {
      try {
        transaction = await Transaction.query()
          .where('id', invoiceId)
          .where('type', 'manual_invoice')
          .withGraphFetched('user(selectUserInfo)')
          .modifiers({
            selectUserInfo(builder) {
              builder.select('id', 'name', 'email');
            }
          })
          .first();
      } catch (error) {
        console.warn('⚠️ [Send Invoice] Error finding by ID:', error.message);
      }
    }

    // Get transaction data for invoice details
    const transactionData = transaction?.metadata || transaction?.payment_details || {};

    // Get client email from transaction, request body, or client object
    let customerEmail = null;
    let customerName = null;
    let user = null;

    // First, try to get from transaction user
    if (transaction?.user) {
      user = transaction.user;
      customerEmail = user.email;
      customerName = user.name;
    }
    
    // If not found, try to get from transaction metadata or payment_details
    if (!customerEmail && transactionData.client) {
      const clientData = transactionData.client;
      customerEmail = clientData.email || clientData.emailAddress;
      customerName = clientData.name || clientData.customerName;
      
      // Try to find user by email
      if (customerEmail) {
        try {
          user = await User.query()
            .where('email', customerEmail)
            .select('id', 'name', 'email')
            .first();
        } catch (error) {
          console.warn('⚠️ [Send Invoice] User not found by email:', error.message);
        }
      }
    }
    
    // If still not found, try from request body client object
    if (!customerEmail && client) {
      customerEmail = client.email || client.emailAddress;
      customerName = client.name || client.customerName;
      
      // Try to find user by email
      if (customerEmail) {
        try {
          user = await User.query()
            .where('email', customerEmail)
            .select('id', 'name', 'email')
            .first();
        } catch (error) {
          console.warn('⚠️ [Send Invoice] User not found by email:', error.message);
        }
      }
    }

    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Client email not found. Cannot send invoice. Please ensure the invoice has a client email address.',
      });
    }

    // Prepare email data
    const finalInvoiceNumber = transactionData.invoiceNumber || searchInvoiceNumber || req.body.invoiceNumber || `INV-${id}`;
    const invoiceAmount = transaction ? Math.abs(transaction.amount) : (req.body.total || 0);
    const invoiceDate = transaction?.created_at || new Date().toISOString();

    // Send email if requested
    if (sendEmail) {
      try {
        console.log('📧 [Send Invoice] Email would be sent to:', customerEmail);
        console.log('📧 [Send Invoice] Invoice Number:', finalInvoiceNumber);
        console.log('📧 [Send Invoice] Invoice Amount:', invoiceAmount);
        // TODO: Implement email sending service
        // Example: await emailService.send({
        //   to: customerEmail,
        //   subject: `Invoice ${finalInvoiceNumber} - AltayarVIP`,
        //   template: 'invoice',
        //   data: { invoiceNumber: finalInvoiceNumber, amount: invoiceAmount, ... }
        // });
      } catch (emailError) {
        console.error('❌ [Send Invoice] Email error:', emailError);
      }
    }

    // Send notification if requested
    if (sendNotification && user) {
      try {
        // Create notification for the client
        const currency = req.body.currency || transactionData.currency || 'EGP';
        const notificationTitle = `فاتورة جديدة - ${finalInvoiceNumber}`;
        const notificationMessage = `تم إرسال فاتورة جديدة لك برقم ${finalInvoiceNumber} بمبلغ ${invoiceAmount.toFixed(2)} ${currency}. يرجى مراجعة التفاصيل والدفع في أقرب وقت.`;
        
        // Prepare notification data
        const notificationData = {
          invoiceId: transaction?.id || id,
          invoiceNumber: finalInvoiceNumber,
          amount: invoiceAmount,
          currency: currency,
          invoiceDate: invoiceDate,
          dueDate: transactionData.dueDate || req.body.dueDate,
          status: 'sent',
          clientEmail: customerEmail,
          clientName: customerName,
        };
        
        // Try to use 'invoice' type, fallback to 'general' if not available
        let notification = null;
        try {
          notification = await Notification.query().insert({
            user_id: user.id,
            sender_id: req.user.id,
            title: notificationTitle,
            message: notificationMessage,
            type: 'invoice',
            reference_id: transaction?.id || null,
            data: JSON.stringify(notificationData),
            is_read: false,
          });
          console.log('✅ [Send Invoice] Notification created with type "invoice":', notification.id);
        } catch (typeError) {
          // If 'invoice' type is not available, use 'general'
          if (typeError.constraint === 'notifications_type_check') {
            console.warn('⚠️ [Send Invoice] "invoice" type not available, using "general" instead');
            notificationData.notificationType = 'invoice'; // Store original type in data
            notification = await Notification.query().insert({
              user_id: user.id,
              sender_id: req.user.id,
              title: notificationTitle,
              message: notificationMessage,
              type: 'general',
              reference_id: transaction?.id || null,
              data: JSON.stringify(notificationData),
              is_read: false,
            });
            console.log('✅ [Send Invoice] Notification created with type "general":', notification.id);
          } else {
            throw typeError; // Re-throw if it's a different error
          }
        }
        
        console.log('🔔 [Send Invoice] Notification sent to user:', user.id);
        
        // Emit real-time notification via WebSocket if available
        if (req.io) {
          try {
            req.io.to(`user_${user.id}`).emit('new_notification', {
              id: notification.id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              createdAt: notification.created_at,
            });
            console.log('📡 [Send Invoice] WebSocket notification emitted to user:', user.id);
          } catch (wsError) {
            console.warn('⚠️ [Send Invoice] WebSocket error:', wsError.message);
          }
        }
      } catch (notificationError) {
        console.error('❌ [Send Invoice] Notification error:', notificationError);
        // Continue even if notification fails - invoice is still sent
      }
    } else if (sendNotification && !user && customerEmail) {
      // If user not found but email exists, try to find user by email
      try {
        const userByEmail = await User.query()
          .where('email', customerEmail)
          .select('id', 'name', 'email')
          .first();
        
        if (userByEmail) {
          const currency = req.body.currency || transactionData.currency || 'EGP';
          const notificationTitle = `فاتورة جديدة - ${finalInvoiceNumber}`;
          const notificationMessage = `تم إرسال فاتورة جديدة لك برقم ${finalInvoiceNumber} بمبلغ ${invoiceAmount.toFixed(2)} ${currency}. يرجى مراجعة التفاصيل والدفع في أقرب وقت.`;
          
          const notification = await Notification.query().insert({
            user_id: userByEmail.id,
            sender_id: req.user.id,
            title: notificationTitle,
            message: notificationMessage,
            type: 'invoice',
            reference_id: transaction?.id || null,
            data: JSON.stringify({
              invoiceId: transaction?.id || id,
              invoiceNumber: finalInvoiceNumber,
              amount: invoiceAmount,
              currency: currency,
              invoiceDate: invoiceDate,
              dueDate: transactionData.dueDate || req.body.dueDate,
              status: 'sent',
              clientEmail: customerEmail,
              clientName: customerName,
            }),
            is_read: false,
          });

          console.log('✅ [Send Invoice] Notification created for user found by email:', userByEmail.id);
          
          // Emit real-time notification
          if (req.io) {
            try {
              req.io.to(`user_${userByEmail.id}`).emit('new_notification', {
                id: notification.id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                createdAt: notification.created_at,
              });
            } catch (wsError) {
              console.warn('⚠️ [Send Invoice] WebSocket error:', wsError.message);
            }
          }
        }
      } catch (notificationError) {
        console.error('❌ [Send Invoice] Notification error (email lookup):', notificationError);
      }
    }

    // Update transaction metadata if exists
    if (transaction) {
      try {
        const currentData = transaction.metadata || transaction.payment_details || {};
        await Transaction.query()
          .where('id', transaction.id)
          .patch({
            payment_details: {
              ...currentData,
              sentAt: new Date().toISOString(),
              sentTo: customerEmail,
              status: 'sent',
            },
            metadata: {
              ...currentData,
              sentAt: new Date().toISOString(),
              sentTo: customerEmail,
              status: 'sent',
            },
          });
      } catch (updateError) {
        console.warn('⚠️ [Send Invoice] Could not update transaction:', updateError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Invoice sent successfully',
      data: {
        invoiceId: transaction?.id || id,
        invoiceNumber: finalInvoiceNumber,
        sentTo: customerEmail,
        sentAt: new Date().toISOString(),
        emailSent: sendEmail,
        notificationSent: sendNotification && user != null,
      },
    });
  } catch (error) {
    console.error('❌ [Send Invoice] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

