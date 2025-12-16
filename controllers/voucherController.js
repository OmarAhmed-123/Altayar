const asyncHandler = require('express-async-handler');
const Voucher = require('../models/Voucher');
const User = require('../models/User');
const { transaction } = require('objection');

// @desc    Get user's own vouchers
// @route   GET /api/vouchers/my
// @access  Private (Customer)
exports.getMyVouchers = asyncHandler(async (req, res) => {
    const vouchers = await Voucher.query()
        .where({ user_id: req.user.id, is_used: false })
        .where('expires_at', '>', new Date())
        .orderBy('expires_at', 'asc');
    res.json(vouchers);
});

// @desc    Get all vouchers (Admin view)
// @route   GET /api/vouchers/admin
// @access  Private/Admin
exports.getAllVouchersAdmin = asyncHandler(async (req, res) => {
    const vouchers = await Voucher.query()
        .withGraphFetched('user(selectNameAndEmail)')
        .modifiers({
            selectNameAndEmail(builder) { builder.select('name', 'email'); }
        });
    res.json(vouchers);
});

// @desc    Use a voucher
// @route   PUT /api/vouchers/use/:code
// @access  Private (Customer)
exports.useVoucher = asyncHandler(async (req, res) => {
    const voucher = await Voucher.query().findOne({ code: req.params.code, user_id: req.user.id });

    if (!voucher) {
        res.status(404);
        throw new Error('Voucher not found or does not belong to user.');
    }
    if (voucher.is_used) {
        res.status(400);
        throw new Error('Voucher already used.');
    }
    if (new Date(voucher.expires_at) < new Date()) {
        res.status(400);
        throw new Error('Voucher has expired.');
    }

    const updatedVoucher = await voucher.$query().patchAndFetch({ is_used: true });
    // Future logic: Apply value/discount to a booking/transaction here
    res.json({ message: 'Voucher applied successfully!', voucher: updatedVoucher });
});

// @desc    Add manual voucher (by Admin/Sales)
// @route   POST /api/vouchers
// @access  Private/Admin/Sales
exports.createManualVoucher = asyncHandler(async (req, res) => {
    const { userId, type, value, description, expiresAt } = req.body;
    
    if (!userId || !type) {
        res.status(400);
        throw new Error('User ID and voucher type are required.');
    }

    // Securely create voucher and update user points/cashback in a single transaction
    const newVoucher = await transaction(Voucher.knex(), async (trx) => {
        const user = await User.query(trx).findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // If the gift has a monetary value, you might want to log it
        // Or update user's cashback balance, for example
        if (type === 'manual_gift' && value > 0) {
            await user.$query(trx).patch({
                cashback: parseFloat(user.cashback) + value
            });
        }
        
        const voucher = await Voucher.query(trx).insert({
            user_id: userId,
            code: `ADMIN-${Date.now()}-${Math.floor(Math.random() * 900) + 100}`,
            type,
            value: value || 0,
            description,
            issued_by: req.user.id,
            expires_at: expiresAt ? new Date(expiresAt) : undefined,
        });

        return voucher;
    });
    
    res.status(200).json(newVoucher);
});