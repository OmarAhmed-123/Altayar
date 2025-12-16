const asyncHandler = require('express-async-handler');
const Additional = require('../models/Additional');

// @desc    Get all active additionals
// @route   GET /api/additionals
// @access  Public
exports.getAdditionals = asyncHandler(async (req, res) => {
    const additionals = await Additional.query()
        .where('is_active', true)
        .orderBy('created_at', 'desc');
    res.json(additionals);
});

// @desc    Get single additional
// @route   GET /api/additionals/:id
// @access  Public
exports.getAdditionalById = asyncHandler(async (req, res) => {
    const additional = await Additional.query()
        .findById(req.params.id)
        .where('is_active', true);

    if (!additional) {
        res.status(404);
        throw new Error('Additional service not found');
    }

    res.json(additional);
});

// @desc    Create additional service
// @route   POST /api/additionals
// @access  Private/Admin/DataEntry
exports.createAdditional = asyncHandler(async (req, res) => {
    const { name, description, price, category, icon, is_active } = req.body;
    
    if (!name || !price) {
        res.status(400);
        throw new Error('Name and price are required.');
    }
    
    const additional = await Additional.query().insert({
        name,
        description,
        price: parseFloat(price),
        category: category || 'general',
        icon: icon || 'add-circle',
        is_active: is_active !== undefined ? is_active : true
    });
    
    res.status(200).json(additional);
});

// @desc    Update additional service
// @route   PUT /api/additionals/:id
// @access  Private/Admin/DataEntry
exports.updateAdditional = asyncHandler(async (req, res) => {
    const { name, description, price, category, icon, is_active } = req.body;
    
    const additional = await Additional.query().findById(req.params.id);

    if (!additional) {
        res.status(404);
        throw new Error('Additional service not found');
    }

    const updated = await Additional.query().patchAndFetchById(req.params.id, {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(category && { category }),
        ...(icon && { icon }),
        ...(is_active !== undefined && { is_active }),
    });

    res.json(updated);
});

// @desc    Delete additional service
// @route   DELETE /api/additionals/:id
// @access  Private/Admin
exports.deleteAdditional = asyncHandler(async (req, res) => {
    const additional = await Additional.query().findById(req.params.id);

    if (!additional) {
        res.status(404);
        throw new Error('Additional service not found');
    }

    await Additional.query().deleteById(req.params.id);
    res.json({ message: 'Additional service deleted successfully' });
});

