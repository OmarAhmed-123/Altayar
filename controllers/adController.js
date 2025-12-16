const asyncHandler = require('express-async-handler');
const Ad = require('../models/Ad');

const getServerOrigin = (req) => {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = forwardedProto ? forwardedProto.split(',')[0] : (req.protocol || 'http');
    const forwardedHost = req.headers['x-forwarded-host'];
    const host = forwardedHost ? forwardedHost.split(',')[0] : (req.get('host') || 'localhost:5000');
    return {
        protocol,
        host,
        origin: `${protocol}://${host}`
    };
};

const stripPort = (host = '') => host.split(':')[0];

const isLoopbackHost = (host = '') => {
    const normalized = host.toLowerCase();
    return ['localhost', '0.0.0.0', '127.0.0.1', '::1', '[::1]'].includes(normalized);
};

const isPrivateHost = (host = '') => {
    return /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host);
};

const rewriteMediaUrl = (req, value) => {
    if (!value) return value;
    const trimmed = value.toString().trim();
    if (!trimmed) return trimmed;

    const { protocol, host, origin } = getServerOrigin(req);
    const currentHost = stripPort(host).toLowerCase();

    try {
        const parsed = new URL(trimmed);
        const storedHost = stripPort(parsed.hostname).toLowerCase();
        if (storedHost !== currentHost && (isLoopbackHost(storedHost) || isPrivateHost(storedHost))) {
            return `${origin}${parsed.pathname}${parsed.search || ''}`;
        }
        return trimmed;
    } catch (err) {
        // fall through for relative URLs
    }

    if (trimmed.startsWith('//')) {
        return `${protocol}:${trimmed}`;
    }

    if (trimmed.startsWith('/')) {
        return `${origin}${trimmed}`;
    }

    if (trimmed.startsWith('uploads/')) {
        return `${origin}/${trimmed}`;
    }

    return `${origin}/uploads/ads/${trimmed.replace(/^\/+/, '')}`;
};

const buildDynamicAdImage = (title = '', content = '') => {
    const basePrompt = [title, content].filter(Boolean).join(' ').trim() ||
        'Altayar luxury travel experience promotion, elegant typography, cinematic lighting';
    const encoded = encodeURIComponent(`${basePrompt} -- stylish arabic calligraphy, vibrant colors, travel agency poster, ultra hd`);
    const seedSource = `${title || 'altayar'}-${content || 'travel'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `https://image.pollinations.ai/prompt/${encoded}?width=1080&height=1920&nologo=true&seed=${seedSource}`;
};

const formatAdResponse = (req, adRecord) => {
    if (!adRecord) return adRecord;
    const plain = typeof adRecord.toJSON === 'function' ? adRecord.toJSON() : adRecord;
    const hasImage = plain.image && plain.image.trim().length > 0;
    const image = hasImage ? plain.image : buildDynamicAdImage(plain.title, plain.content);
    return {
        ...plain,
        image: rewriteMediaUrl(req, image)
    };
};

const parseBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
        if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    }
    return fallback;
};

const parseDateValue = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date;
};

// @desc    Get all active ads
// @route   GET /api/ads
// @access  Public
exports.getActiveAds = asyncHandler(async (req, res) => {
    // Get all columns first, then select only existing ones
    const ads = await Ad.query()
        .where('is_active', true);
    
    res.json(ads.map((ad) => {
        const formatted = formatAdResponse(req, ad);
        // Ensure link_url is available - check both camelCase and snake_case
        if (!formatted.link_url && formatted.linkUrl) {
            formatted.link_url = formatted.linkUrl;
        } else if (!formatted.linkUrl && formatted.link_url) {
            formatted.linkUrl = formatted.link_url;
        }
        return formatted;
    }));
});

// @desc    Create a new ad
// @route   POST /api/ads
// @access  Private/Admin/Sales
exports.createAd = asyncHandler(async (req, res) => {
    const { title, content, image, type, size } = req.body;
    const linkUrl = req.body.link_url || req.body.linkUrl;
    const startDate = req.body.start_date || req.body.startDate;
    const endDate = req.body.end_date || req.body.endDate;
    const isActive = parseBoolean(req.body.isActive ?? req.body.is_active, true);

    if (!title) {
        res.status(400);
        throw new Error('Title is required for the ad.');
    }

    // CRITICAL FIX: Better file handling - check if file exists and is an image
    let fileImage = null;
    if (req.file) {
        // Validate that uploaded file is actually an image
        const fileExt = req.file.originalname.toLowerCase().split('.').pop();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        
        if (imageExtensions.includes(fileExt) || req.file.mimetype?.startsWith('image/')) {
            fileImage = `/uploads/ads/${req.file.filename}`;
        } else {
            res.status(400);
            throw new Error('يسمح برفع الصور فقط في الإعلانات.');
        }
    }
    
    const sanitizedImage = fileImage ||
        (image && image.toString().trim().length
            ? image.toString().trim()
            : buildDynamicAdImage(title, content));

    const ad = await Ad.query().insert({
        title,
        content,
        image: sanitizedImage,
        type,
        size,
        link_url: linkUrl,
        start_date: parseDateValue(startDate),
        end_date: parseDateValue(endDate),
        is_active: isActive,
        created_by: req.user.id
    });
    res.status(201).json(formatAdResponse(req, ad));
});

// @desc    Update an ad
// @route   PUT /api/ads/:id
// @access  Private/Admin
exports.updateAd = asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(payload, 'isActive')) {
        payload.is_active = payload.isActive;
        delete payload.isActive;
    }

    if (req.file) {
        payload.image = `/uploads/ads/${req.file.filename}`;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'image')) {
        const incoming = payload.image ? payload.image.toString().trim() : '';
        payload.image = incoming.length ? incoming : buildDynamicAdImage(payload.title, payload.content || payload.description || '');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'linkUrl') && !payload.link_url) {
        payload.link_url = payload.linkUrl;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'startDate') && !payload.start_date) {
        payload.start_date = parseDateValue(payload.startDate);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'endDate') && !payload.end_date) {
        payload.end_date = parseDateValue(payload.endDate);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'isActive')) {
        payload.is_active = parseBoolean(payload.isActive, true);
    }

    const ad = await Ad.query().patchAndFetchById(req.params.id, payload);
    if (ad) {
        res.json(formatAdResponse(req, ad));
    } else {
        res.status(404);
        throw new Error('Ad not found');
    }
});

// @desc    Delete an ad
// @route   DELETE /api/ads/:id
// @access  Private/Admin
exports.deleteAd = asyncHandler(async (req, res) => {
    const numDeleted = await Ad.query().deleteById(req.params.id);
    if (numDeleted) {
        res.json({ message: 'Ad removed' });
    } else {
        res.status(404);
        throw new Error('Ad not found');
    }
});

// @desc    Send ad (notification/popup) to users
// @route   POST /api/ads/send/:id
// @access  Private/Admin/Sales
exports.sendAdToUsers = asyncHandler(async (req, res) => {
    const { userIds, sendToAll } = req.body;
    const Notification = require('../models/Notification');
    const User = require('../models/User');
    
    const ad = await Ad.query().findById(req.params.id);
    if (!ad) {
        res.status(404);
        throw new Error('Ad not found.');
    }
    const resolvedAdImage = rewriteMediaUrl(req, ad.image);

    let targetUsers = [];
    
    if (sendToAll) {
        // Send to all active customers
        targetUsers = await User.query()
            .where('role', 'customer')
            .select('id');
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        // Send to specific users
        targetUsers = await User.query()
            .whereIn('id', userIds)
            .select('id');
    } else {
        res.status(400);
        throw new Error('Please provide userIds array or set sendToAll to true.');
    }

    // Create notifications for all target users
    const notifications = [];
    for (const user of targetUsers) {
        try {
            const notification = await Notification.query().insert({
                user_id: user.id,
                sender_id: req.user.id,
                title: ad.title || 'New Advertisement',
                message: ad.content || ad.title || 'Check out our new offer!',
                type: 'advertisement',
                reference_id: ad.id,
                metadata: JSON.stringify({
                    ad_id: ad.id,
                    ad_type: ad.type,
                    ad_size: ad.size,
                    ad_image: resolvedAdImage
                })
            });
            notifications.push(notification);
        } catch (error) {
            console.error(`Error creating notification for user ${user.id}:`, error);
        }
    }

    // Update ad to track that it was sent
    await Ad.query()
        .findById(req.params.id)
        .patch({ 
            sent_at: new Date(),
            sent_count: (ad.sent_count || 0) + notifications.length
        });

    res.json({ 
        success: true,
        message: `Ad '${ad.title}' sent successfully to ${notifications.length} user(s).`,
        sent_count: notifications.length,
        ad: formatAdResponse(req, ad)
    });
});