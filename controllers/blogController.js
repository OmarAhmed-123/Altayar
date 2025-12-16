const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const { db } = require('../config/db');
const os = require('os');

const LOOPBACK_HOSTS = new Set([
    'localhost',
    '127.0.0.1',
    '::1',
    '::ffff:127.0.0.1'
]);

const isIpv4 = (host = '') => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);

const isPrivateIpv4 = (host = '') => {
    if (!isIpv4(host)) return false;
    const [a, b] = host.split('.').map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
    return false;
};

const isLoopbackHost = (host = '') => LOOPBACK_HOSTS.has(host.toLowerCase());

const isPrivateHostname = (host = '') => isLoopbackHost(host) || isPrivateIpv4(host);

const stripPort = (host = '') => host.split(':')[0];

const ensureLeadingSlash = (value = '') => (value.startsWith('/') ? value : `/${value}`);

const stripTrailingSlashIfFile = (value = '') => {
    if (!value || !value.endsWith('/')) {
        return value;
    }

    const hashIndex = value.indexOf('#');
    const queryIndex = value.indexOf('?');
    let suffix = '';
    let pathPart = value;

    if (hashIndex !== -1 && (queryIndex === -1 || hashIndex < queryIndex)) {
        suffix = value.substring(hashIndex);
        pathPart = value.substring(0, hashIndex);
    } else if (queryIndex !== -1) {
        suffix = value.substring(queryIndex);
        pathPart = value.substring(0, queryIndex);
    }

    if (!pathPart.endsWith('/')) {
        return value;
    }

    const trimmedPath = pathPart.replace(/\/+$/, '');
    if (!trimmedPath) {
        return value;
    }

    const lastSegment = trimmedPath.split('/').pop();
    if (lastSegment && lastSegment.includes('.')) {
        return `${trimmedPath}${suffix}`;
    }

    return value;
};

const makeRelativeMediaPath = (value = '') => {
    if (!value) return null;
    const normalized = stripTrailingSlashIfFile(value.replace(/\\/g, '/').trim());
    if (!normalized) return null;
    if (normalized.startsWith('/uploads/')) {
        return normalized;
    }
    if (normalized.startsWith('uploads/')) {
        return `/${normalized}`;
    }
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
        try {
            const parsed = new URL(normalized);
            if (parsed.pathname) {
                const pathWithPrefix = parsed.pathname.startsWith('/uploads/')
                    ? parsed.pathname
                    : `/uploads/reels${ensureLeadingSlash(parsed.pathname)}`;
                return stripTrailingSlashIfFile(pathWithPrefix);
            }
        } catch (err) {
            // fall through to default handling
        }
    }
    return stripTrailingSlashIfFile(`/uploads/reels/${normalized.replace(/^\/+/, '')}`);
};

const parseStoredMediaList = (mediaData) => {
    if (!mediaData && mediaData !== '') return [];
    if (Array.isArray(mediaData)) return mediaData;
    if (typeof mediaData === 'string') {
        const trimmed = mediaData.trim();
        if (!trimmed) return [];
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (err) {
                return [trimmed];
            }
        }
        return [trimmed];
    }
    return [];
};

const resolveFallbackHost = () => {
    const port = process.env.PORT || 5000;
    const explicitHost = (process.env.PUBLIC_SERVER_HOST || process.env.SERVER_IP || '').trim();
    if (explicitHost) {
        return explicitHost.includes(':') ? explicitHost : `${explicitHost}:${port}`;
    }

    const interfaces = os.networkInterfaces();
    let publicAddress = null;
    let privateAddress = null;

    Object.values(interfaces).forEach((netIfaces) => {
        netIfaces?.forEach((iface) => {
            if (iface.family === 'IPv4' && !iface.internal) {
                if (!isPrivateIpv4(iface.address)) {
                    if (!publicAddress) {
                        publicAddress = iface.address;
                    }
                } else if (!privateAddress) {
                    privateAddress = iface.address;
                }
            }
        });
    });

    const selectedAddress = publicAddress || privateAddress || '127.0.0.1';
    return `${selectedAddress}:${port}`;
};

const getExplicitServerInfo = () => {
    const explicitUrl = (process.env.PUBLIC_SERVER_URL || process.env.SERVER_PUBLIC_URL || process.env.PUBLIC_APP_URL || '').trim();
    if (!explicitUrl) return null;
    try {
        let normalized = explicitUrl;
        if (normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }
        if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
            normalized = `http://${normalized}`;
        }
        const parsed = new URL(normalized);
        return {
            protocol: parsed.protocol.replace(':', '') || 'http',
            host: parsed.host,
            fullUrl: `${parsed.protocol}//${parsed.host}`
        };
    } catch (error) {
        console.warn('[SERVER INFO] Invalid PUBLIC_SERVER_URL:', error.message);
        return null;
    }
};

const getServerInfo = (req) => {
    const explicit = getExplicitServerInfo();
    if (explicit) {
        return explicit;
    }

    const forwardedProto = (req.get('X-Forwarded-Proto') || req.protocol || 'http').replace(':', '');
    const forwardedHost = req.get('X-Forwarded-Host');
    const forwardedPort = req.get('X-Forwarded-Port');
    let host = forwardedHost || req.get('host');

    if (forwardedPort && host && !host.includes(':')) {
        host = `${host}:${forwardedPort}`;
    }

    if (!host || isLoopbackHost(stripPort(host))) {
        host = resolveFallbackHost();
    }

    return {
        protocol: forwardedProto,
        host,
        fullUrl: `${forwardedProto}://${host}`
    };
};

const coalesceLower = column => `LOWER(COALESCE(${column}, ''))`;

const normalizeString = value => (value ?? '').toString().trim();
const normalizeLowerCase = value => normalizeString(value).toLowerCase();

const buildLikeValue = value => `%${normalizeLowerCase(value)}%`;

const parseTagsField = (value) => {
    if (Array.isArray(value)) {
        return value
            .map(tag => normalizeString(tag))
            .filter(Boolean);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return [];
        }
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return parsed
                        .map(tag => normalizeString(tag))
                        .filter(Boolean);
                }
            } catch (err) {
                // Fall through to comma split
            }
        }
        return trimmed
            .split(',')
            .map(tag => normalizeString(tag))
            .filter(Boolean);
    }
    if (value && typeof value === 'object') {
        return Object.values(value)
            .map(tag => normalizeString(tag))
            .filter(Boolean);
    }
    return [];
};

const normalizeTagsForStorage = (value) => {
    const parsed = parseTagsField(value);
    return parsed.length ? parsed : null;
};

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    if (req.ip) {
        return req.ip;
    }
    return req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
};

const buildVisitorFingerprint = (req) => {
    if (req.user?.id) {
        return `user:${req.user.id}`;
    }
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown-agent';
    return crypto.createHash('sha256').update(`${ip}|${userAgent}`).digest('hex');
};

const recordBlogView = async (req, blogId) => {
    try {
        const fingerprint = buildVisitorFingerprint(req);
        if (!fingerprint) {
            return false;
        }

        const existingView = await db('blog_views')
            .where({
                blog_id: blogId,
                visitor_fingerprint: fingerprint,
            })
            .first();

        if (existingView) {
            await db('blog_views')
                .where({ id: existingView.id })
                .update({ last_viewed_at: new Date() });
            return false;
        }

        await db('blog_views').insert({
            blog_id: blogId,
            user_id: req.user?.id || null,
            visitor_fingerprint: fingerprint,
            last_viewed_at: new Date(),
        });

        await db('blogs')
            .where({ id: blogId })
            .increment('views_count', 1);

        return true;
    } catch (error) {
        console.warn('[BlogViews] Unable to record view:', error.message);
        return false;
    }
};

const applySearchFilter = (query, term) => {
    const likeValue = buildLikeValue(term);
    query.where(builder => {
        builder.whereRaw(`${coalesceLower('title')} LIKE ?`, [likeValue])
            .orWhereRaw(`${coalesceLower('content')} LIKE ?`, [likeValue])
            .orWhereRaw(`${coalesceLower('category')} LIKE ?`, [likeValue])
            .orWhereRaw(`${coalesceLower('destination')} LIKE ?`, [likeValue]);
    });
};

const shouldRewriteStoredHost = (storedHostname, currentHostname) => {
    if (!storedHostname) return true;
    const normalizedStored = storedHostname.toLowerCase();
    const normalizedCurrent = (currentHostname || '').toLowerCase();

    if (normalizedStored === normalizedCurrent) {
        return false;
    }

    if (isLoopbackHost(normalizedStored)) {
        return true;
    }

    if (isPrivateHostname(normalizedStored) && !isPrivateHostname(normalizedCurrent)) {
        return true;
    }

    return false;
};

const absoluteUrlFromEntry = (req, entry, serverInfoOverride = null) => {
    if (!entry && entry !== '') return null;
    const serverInfo = serverInfoOverride || getServerInfo(req);
    const stringValue = stripTrailingSlashIfFile(entry.toString().trim());
    if (!stringValue) return null;

    if (stringValue.startsWith('http://') || stringValue.startsWith('https://')) {
        try {
            const parsed = new URL(stringValue);
            const storedHost = parsed.hostname;
            const currentHost = stripPort(serverInfo.host);

            if (shouldRewriteStoredHost(storedHost, currentHost)) {
                const rebuilt = `${serverInfo.protocol}://${serverInfo.host}${parsed.pathname}${parsed.search || ''}`;
                return stripTrailingSlashIfFile(rebuilt);
            }
            return stripTrailingSlashIfFile(stringValue);
        } catch (err) {
            // fall through to treat as relative
        }
    }

    if (stringValue.startsWith('//')) {
        return stripTrailingSlashIfFile(`${serverInfo.protocol}:${stringValue}`);
    }

    if (stringValue.startsWith('/uploads/')) {
        return stripTrailingSlashIfFile(`${serverInfo.fullUrl}${stringValue}`);
    }

    if (stringValue.startsWith('uploads/')) {
        return stripTrailingSlashIfFile(`${serverInfo.fullUrl}/${stringValue}`);
    }

    return stripTrailingSlashIfFile(`${serverInfo.fullUrl}/uploads/reels/${stringValue.replace(/^\/+/, '')}`);
};

const buildAbsoluteMediaPayload = (req, mediaData, serverInfoOverride = null) => {
    const parsedEntries = parseStoredMediaList(mediaData);
    const serverInfo = serverInfoOverride || getServerInfo(req);
    const mediaUrls = parsedEntries
        .map((entry) => absoluteUrlFromEntry(req, entry, serverInfo))
        .filter(Boolean);

    return {
        mediaUrls,
        mediaUrl: mediaUrls[0] || null
    };
};

const getBlogMediaInfo = (req, blog, serverInfoOverride = null) => {
    const rawMedia =
        blog?.media_url ??
        blog?.mediaUrl ??
        blog?.media_urls ??
        blog?.mediaUrls ??
        blog?.image ??
        null;

    return buildAbsoluteMediaPayload(req, rawMedia, serverInfoOverride);
};

// @desc    Get all published blogs/reels
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = asyncHandler(async (req, res) => {
    const serverInfo = getServerInfo(req);
    const startTime = Date.now();
    
    try {
        // Professional query parameter validation and normalization
        const {
            isReel,
            limit: limitParam,
            offset: offsetParam,
            category,
            destination,
            search,
            mediaType,
            page: pageParam
        } = req.query;
        
        // Default pagination values (professional approach)
        const DEFAULT_LIMIT = 20;
        const MAX_LIMIT = 100;
        const DEFAULT_PAGE = 1;
        
        // Validate and normalize limit
        let limit = DEFAULT_LIMIT;
        if (limitParam) {
            const limitNum = parseInt(limitParam, 10);
            if (!isNaN(limitNum) && limitNum > 0) {
                limit = Math.min(limitNum, MAX_LIMIT); // Cap at MAX_LIMIT for security
            }
        }
        
        // Validate and normalize offset/page
        let offset = 0;
        if (offsetParam) {
            const offsetNum = parseInt(offsetParam, 10);
            if (!isNaN(offsetNum) && offsetNum >= 0) {
                offset = offsetNum;
            }
        } else if (pageParam) {
            const pageNum = parseInt(pageParam, 10);
            if (!isNaN(pageNum) && pageNum > 0) {
                offset = (pageNum - 1) * limit;
            }
        }
        
        // Build query with error handling
        // CRITICAL: Only show published blogs/reels to all users (admin and regular users)
        let query = Blog.query()
            .where('is_published', true) // CRITICAL: Only published content is visible to all users
            .orderBy('created_at', 'desc'); // Order by newest first

        // Filter by isReel if provided (professional validation)
        if (isReel !== undefined && isReel !== null && isReel !== '') {
            const isReelBool = isReel === 'true' || isReel === true || isReel === '1';
            query = query.where('is_reel', isReelBool);
        }

        // Filter by category (with validation)
        const normalizedCategory = category ? normalizeLowerCase(category) : null;
        if (normalizedCategory && normalizedCategory.length > 0) {
            query = query.whereRaw(`${coalesceLower('category')} = ?`, [normalizedCategory]);
        }

        // Filter by destination (with validation)
        const normalizedDestination = destination ? destination.toString().trim() : null;
        if (normalizedDestination && normalizedDestination.length > 0) {
            query = query.whereRaw(`${coalesceLower('destination')} LIKE ?`, [buildLikeValue(normalizedDestination)]);
        }

        // Filter by mediaType (with validation)
        const normalizedMediaType = mediaType ? normalizeLowerCase(mediaType) : null;
        if (normalizedMediaType && normalizedMediaType.length > 0) {
            query = query.whereRaw(`${coalesceLower('media_type')} = ?`, [normalizedMediaType]);
        }

        // Apply search filter (with validation)
        if (search && search.trim().length > 0) {
            applySearchFilter(query, search.trim());
        }

        // Apply pagination (always applied for consistency and performance)
        query = query.limit(limit).offset(offset);

        // Get total count for pagination metadata (professional approach)
        let totalCount = 0;
        try {
            // Clone query for count (remove limit/offset)
            const countQuery = Blog.query()
                .where('is_published', true);
            
            // Apply same filters to count query
            if (isReel !== undefined && isReel !== null && isReel !== '') {
                const isReelBool = isReel === 'true' || isReel === true || isReel === '1';
                countQuery.where('is_reel', isReelBool);
            }
            if (normalizedCategory) {
                countQuery.whereRaw(`${coalesceLower('category')} = ?`, [normalizedCategory]);
            }
            if (normalizedDestination) {
                countQuery.whereRaw(`${coalesceLower('destination')} LIKE ?`, [buildLikeValue(normalizedDestination)]);
            }
            if (normalizedMediaType) {
                countQuery.whereRaw(`${coalesceLower('media_type')} = ?`, [normalizedMediaType]);
            }
            if (search && search.trim().length > 0) {
                applySearchFilter(countQuery, search.trim());
            }
            
            totalCount = await countQuery.resultSize();
        } catch (countError) {
            console.warn('⚠️ [BLOGS] Error getting total count:', countError.message);
            // Continue without total count
        }
        
        // Get blogs with error handling
        let blogs = [];
        try {
            blogs = await query;
            
            // CRITICAL FIX: Manually fetch authors to avoid first_name/last_name column errors
            // Fetch all unique author IDs
            const authorIds = [...new Set(blogs.map(blog => blog.author_id).filter(id => id))];
            
            // Fetch authors in batch (performance optimization)
            let authorsMap = {};
            if (authorIds.length > 0) {
                try {
                    const authors = await db('users')
                        .whereIn('id', authorIds)
                        .select('id', 'name', 'email', 'profile_picture_url'); // CRITICAL: Only select existing columns
                    
                    // Create map for quick lookup
                    authors.forEach(author => {
                        authorsMap[author.id] = author;
                    });
                } catch (err) {
                    console.warn('⚠️ [BLOGS] Error fetching authors:', err.message);
                    // Continue without authors
                }
            }
            
            // Attach authors to blogs
            blogs.forEach(blog => {
                if (blog.author_id && authorsMap[blog.author_id]) {
                    blog.author = authorsMap[blog.author_id];
                } else {
                    blog.author = null;
                }
            });
        } catch (dbError) {
            console.error('❌ [BLOGS] Database error in getBlogs:', {
                error: dbError.message,
                stack: dbError.stack?.substring(0, 200),
                query: dbError.query
            });
            // Return empty array for backward compatibility with Frontend
            return res.status(200).json([]);
        }
        
        // If no blogs found, return empty array (backward compatibility)
        if (!blogs || blogs.length === 0) {
            return res.status(200).json([]);
        }
    
        // Performance optimization: Batch fetch engagement counts
        const blogIds = blogs.map(blog => blog.id).filter(id => id);
        
        // Batch fetch all engagement counts at once (much faster than individual queries)
        let engagementCountsMap = {};
        let userEngagementMap = {};
        
        if (blogIds.length > 0) {
            try {
                // Batch fetch likes counts
                const likesCounts = await db('blog_likes')
                    .whereIn('blog_id', blogIds)
                    .groupBy('blog_id')
                    .select('blog_id')
                    .count('* as count');
                
                likesCounts.forEach(item => {
                    engagementCountsMap[item.blog_id] = {
                        ...engagementCountsMap[item.blog_id],
                        likes: parseInt(item.count) || 0
                    };
                });
                
                // Batch fetch saves counts
                const savesCounts = await db('blog_saves')
                    .whereIn('blog_id', blogIds)
                    .groupBy('blog_id')
                    .select('blog_id')
                    .count('* as count');
                
                savesCounts.forEach(item => {
                    engagementCountsMap[item.blog_id] = {
                        ...engagementCountsMap[item.blog_id],
                        saves: parseInt(item.count) || 0
                    };
                });
                
                // Batch fetch shares counts
                const sharesCounts = await db('blog_shares')
                    .whereIn('blog_id', blogIds)
                    .groupBy('blog_id')
                    .select('blog_id')
                    .count('* as count');
                
                sharesCounts.forEach(item => {
                    engagementCountsMap[item.blog_id] = {
                        ...engagementCountsMap[item.blog_id],
                        shares: parseInt(item.count) || 0
                    };
                });
                
                // Batch fetch comments counts (using raw query for better compatibility)
                try {
                    const commentsCounts = await db('comments')
                        .whereIn('commentable_id', blogIds)
                        .where('commentable_type', 'Blog')
                        .groupBy('commentable_id')
                        .select('commentable_id as blog_id')
                        .count('* as count');
                    
                    commentsCounts.forEach(item => {
                        engagementCountsMap[item.blog_id] = {
                            ...engagementCountsMap[item.blog_id],
                            comments: parseInt(item.count) || 0
                        };
                    });
                } catch (commentsError) {
                    console.warn('⚠️ [BLOGS] Error batch fetching comments counts:', commentsError.message);
                    // Continue with zero counts
                }
                
                // Batch fetch user-specific engagement (if authenticated)
                if (req.user && req.user.id) {
                    const userLikes = await db('blog_likes')
                        .whereIn('blog_id', blogIds)
                        .where('user_id', req.user.id)
                        .select('blog_id');
                    
                    userLikes.forEach(item => {
                        userEngagementMap[item.blog_id] = {
                            ...userEngagementMap[item.blog_id],
                            isLiked: true
                        };
                    });
                    
                    const userSaves = await db('blog_saves')
                        .whereIn('blog_id', blogIds)
                        .where('user_id', req.user.id)
                        .select('blog_id');
                    
                    userSaves.forEach(item => {
                        userEngagementMap[item.blog_id] = {
                            ...userEngagementMap[item.blog_id],
                            isSaved: true
                        };
                    });
                }
            } catch (engagementError) {
                console.warn('⚠️ [BLOGS] Error batch fetching engagement counts:', engagementError.message);
                // Continue with zero counts
            }
        }
        
        // Process blogs with engagement data
        const blogsWithLikes = await Promise.all(blogs.map(async (blog) => {
            try {
                // Validate blog object
                if (!blog || !blog.id) {
                    console.warn('⚠️ [BLOGS] Invalid blog object:', blog?.id);
                    return null;
                }
                
                // Get engagement counts from batch-fetched data
                const engagement = engagementCountsMap[blog.id] || {};
                const userEngagement = userEngagementMap[blog.id] || {};
                
                const likesCount = engagement.likes || 0;
                const savedCount = engagement.saves || 0;
                const sharesCount = engagement.shares || 0;
                const commentsCount = engagement.comments || 0;
                const isLiked = userEngagement.isLiked || false;
                const isSaved = userEngagement.isSaved || false;

                // Format author name properly
                // CRITICAL FIX: Use only 'name' field - 'first_name' and 'last_name' don't exist in users table
                const authorName = blog.author?.name || 'Unknown';

                const mediaInfo = getBlogMediaInfo(req, blog, serverInfo);
                const tags = parseTagsField(blog.tags);
                
                // CRITICAL: Ensure mediaUrl is always a valid string (not null/undefined)
                // Frontend may crash if mediaUrl is null
                const finalMediaUrl = mediaInfo.mediaUrl || mediaInfo.mediaUrls?.[0] || '';
                const finalMediaUrls = Array.isArray(mediaInfo.mediaUrls) && mediaInfo.mediaUrls.length > 0 
                    ? mediaInfo.mediaUrls 
                    : (finalMediaUrl ? [finalMediaUrl] : []);
                
                // Professional response format with all necessary fields
                // CRITICAL: All fields must have valid values (no null/undefined that could break Frontend)
                return {
                    id: blog.id,
                    title: blog.title || '',
                    content: blog.content || '',
                    mediaUrl: finalMediaUrl, // Primary URL (backward compatibility) - always string
                    mediaUrls: finalMediaUrls, // CRITICAL: Array of all media URLs (for multiple images)
                    media_urls: finalMediaUrls, // Alternative field name
                    media_url: finalMediaUrl, // Additional backward compatibility
                    mediaType: blog.media_type || blog.mediaType || 'image',
                    isReel: blog.is_reel || blog.isReel || false,
                    is_reel: blog.is_reel || blog.isReel || false, // Additional field for compatibility
                    category: blog.category || 'general',
                    destination: blog.destination || null,
                    tags: tags || [],
                    author: blog.author ? {
                        id: blog.author.id,
                        name: authorName,
                        email: blog.author.email || null,
                        profilePictureUrl: blog.author.profile_picture_url || null
                    } : null,
                    likesCount: likesCount || 0,
                    savedCount: savedCount || 0,
                    sharesCount: sharesCount || 0,
                    commentsCount: commentsCount || 0,
                    viewsCount: parseInt(blog.views_count) || 0,
                    isLiked: isLiked || false,
                    isSaved: isSaved || false,
                    is_published: blog.is_published !== undefined ? blog.is_published : true,
                    created_at: blog.created_at,
                    updated_at: blog.updated_at,
                };
            } catch (err) {
                console.error('Error processing blog:', blog?.id, err.message);
                // Return basic blog data even if engagement counts fail
                // Ensure mediaUrl is fully qualified using same logic as createBlog
                const fallbackMedia = buildAbsoluteMediaPayload(
                    req,
                    blog?.media_url || blog?.mediaUrl || blog?.image || null,
                    serverInfo
                );
                const tags = parseTagsField(blog?.tags);

                return {
                    id: blog?.id || null,
                    title: blog?.title || '',
                    content: blog?.content || '',
                    mediaUrl: fallbackMedia.mediaUrl,
                    mediaUrls: fallbackMedia.mediaUrls,
                    media_urls: fallbackMedia.mediaUrls,
                    mediaType: blog?.media_type || blog?.mediaType || 'image',
                    isReel: blog?.is_reel || blog?.isReel || false,
                    category: blog?.category || 'general',
                    destination: blog?.destination || null,
                    tags,
                    author: blog?.author ? {
                        id: blog.author.id,
                        name: blog.author.name || 'Unknown',
                    } : null,
                    likesCount: 0,
                    savedCount: 0,
                    sharesCount: 0,
                    commentsCount: 0,
                    viewsCount: parseInt(blog?.views_count) || 0,
                    isLiked: false,
                    isSaved: false,
                    created_at: blog?.created_at,
                    updated_at: blog?.updated_at,
                };
            }
        }));

        // Filter out null values (from invalid blogs)
        const validBlogs = blogsWithLikes.filter(blog => blog !== null);
        
        // CRITICAL: Log sample blog data to debug Frontend issues
        if (validBlogs.length > 0 && process.env.NODE_ENV === 'development') {
            console.log('📋 [BLOGS] Sample blog data (first item):', {
                id: validBlogs[0].id,
                title: validBlogs[0].title,
                hasMediaUrl: !!validBlogs[0].mediaUrl,
                mediaUrl: validBlogs[0].mediaUrl,
                hasMediaUrls: Array.isArray(validBlogs[0].mediaUrls),
                mediaUrlsCount: validBlogs[0].mediaUrls?.length || 0,
                hasAuthor: !!validBlogs[0].author,
                authorName: validBlogs[0].author?.name,
                likesCount: validBlogs[0].likesCount,
                isReel: validBlogs[0].isReel
            });
        }
        
        // Calculate pagination metadata
        const hasMore = offset + limit < totalCount;
        const currentPage = Math.floor(offset / limit) + 1;
        const totalPages = Math.ceil(totalCount / limit);
        
        const duration = Date.now() - startTime;
        console.log(`✅ [BLOGS] GET /api/blogs completed in ${duration}ms`, {
            count: validBlogs.length,
            total: totalCount,
            limit,
            offset,
            hasMore,
            filters: {
                isReel: isReel !== undefined ? isReel : null,
                category: normalizedCategory,
                destination: normalizedDestination,
                mediaType: normalizedMediaType,
                search: search ? '***' : null
            }
        });

        // CRITICAL FIX: Default to array format for backward compatibility with existing Frontend
        // Frontend expects array directly, not wrapped in object
        // If format=object is specified, return professional format with pagination metadata
        const responseFormat = req.query.format;
        
        if (responseFormat === 'object') {
            // Professional response format with pagination metadata
            res.status(200).json({
                success: true,
                data: validBlogs,
                pagination: {
                    total: totalCount,
                    limit,
                    offset,
                    currentPage,
                    totalPages,
                    hasMore
                }
            });
        } else {
            // Default: Simple array format (backward compatibility with existing Frontend)
            // This is what the Frontend currently expects
            res.status(200).json(validBlogs);
        }
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('❌ [BLOGS] Error in getBlogs:', {
            error: error.message,
            stack: error.stack?.substring(0, 300),
            duration: `${duration}ms`,
            query: req.query
        });
        
        // Professional error response that won't crash frontend
        // Return empty array for backward compatibility with existing Frontend
        const responseFormat = req.query.format;
        
        if (responseFormat === 'object') {
            res.status(200).json({
                success: false,
                message: 'حدث خطأ أثناء جلب المدونات. يرجى المحاولة مرة أخرى.',
                data: [],
                pagination: {
                    total: 0,
                    limit: parseInt(req.query.limit) || 20,
                    offset: parseInt(req.query.offset) || 0,
                    hasMore: false
                },
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        } else {
            // Default: Return empty array (backward compatibility)
            res.status(200).json([]);
        }
    }
});

// @desc    Get single blog/reel with comments
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlogById = asyncHandler(async (req, res) => {
    const serverInfo = getServerInfo(req);
    // CRITICAL FIX: Don't use withGraphFetched to avoid first_name/last_name errors
    const blog = await Blog.query()
        .findById(req.params.id)
        .where('is_published', true);
    
    // Manually fetch author to avoid column errors
    if (blog && blog.author_id) {
        try {
            const author = await db('users')
                .where('id', blog.author_id)
                .select('id', 'name', 'email')
                .first();
            blog.author = author || null;
        } catch (err) {
            console.warn('Error fetching author:', err.message);
            blog.author = null;
        }
    }

    if (!blog) {
        res.status(404);
        throw new Error('Blog/Reel not found or not published.');
    }

    const viewIncremented = await recordBlogView(req, blog.id);
    if (viewIncremented) {
        blog.views_count = (blog.views_count || 0) + 1;
    }
    
    // Get engagement counts - use count() instead of resultSize()
    let likesCount = 0;
    try {
        const likers = await blog.$relatedQuery('likers');
        likesCount = likers ? likers.length : 0;
    } catch (err) {
        console.warn('Error getting likes count:', err.message);
        likesCount = 0;
    }
    let savedCount = { count: 0 };
    let sharesCount = { count: 0 };
    try {
        savedCount = await db('blog_saves').where('blog_id', blog.id).count('* as count').first() || { count: 0 };
    } catch (err) {
        console.warn('blog_saves table not found or error:', err.message);
    }
    try {
        sharesCount = await db('blog_shares').where('blog_id', blog.id).count('* as count').first() || { count: 0 };
    } catch (err) {
        console.warn('blog_shares table not found or error:', err.message);
    }
    const comments = await Comment.query()
        .where({ commentable_type: 'Blog', commentable_id: req.params.id })
        .withGraphFetched('user(selectName)')
        .modifiers({
            selectName(builder) {
                builder.select('name', 'id');
            }
        });

    let isLiked = false;
    let isSaved = false;
    if (req.user) {
        const hasLiked = await blog.$relatedQuery('likers').where('users.id', req.user.id).first();
        isLiked = !!hasLiked;
        let hasSaved = null;
        try {
            hasSaved = await db('blog_saves').where({ blog_id: blog.id, user_id: req.user.id }).first();
        } catch (err) {
            console.warn('Error checking saved status:', err.message);
        }
        isSaved = !!hasSaved;
    }

    const mediaInfo = getBlogMediaInfo(req, blog, serverInfo);
    const tags = parseTagsField(blog.tags);
    
    res.json({
        blog: {
            ...blog,
            mediaUrl: mediaInfo.mediaUrl, // Primary URL (backward compatibility)
            mediaUrls: mediaInfo.mediaUrls, // CRITICAL: Array of all media URLs (for multiple images)
            media_urls: mediaInfo.mediaUrls, // Alternative field name
            likesCount: parseInt(likesCount) || 0,
            savedCount: parseInt(savedCount?.count) || 0,
            sharesCount: parseInt(sharesCount?.count) || 0,
            commentsCount: comments.length,
             viewsCount: parseInt(blog.views_count) || 0,
             tags,
             destination: blog.destination || null,
            isLiked,
            isSaved,
        },
        comments
    });
});

// @desc    Like/Unlike a blog or reel
// @route   POST /api/blogs/like/:id
// @access  Private
exports.likeBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.query().findById(req.params.id);
    const userId = req.user.id;

    if (!blog) {
        res.status(404);
        throw new Error('Blog/Reel not found.');
    }

    const hasLiked = await blog.$relatedQuery('likers').where('users.id', userId).first();

    if (hasLiked) {
        // Unlike
        await blog.$relatedQuery('likers').unrelate().where('users.id', userId);
        // Get updated likes count
        const likers = await blog.$relatedQuery('likers');
        const likesCount = likers ? likers.length : 0;
        res.json({ message: 'Unliked successfully.', likesCount: parseInt(likesCount) || 0, isLiked: false });
    } else {
        // Like
        await blog.$relatedQuery('likers').relate(userId);
        // Get updated likes count
        const likers = await blog.$relatedQuery('likers');
        const likesCount = likers ? likers.length : 0;
        res.json({ message: 'Liked successfully.', likesCount: parseInt(likesCount) || 0, isLiked: true });
    }
});

// @desc    Save/Unsave a blog or reel
// @route   POST /api/blogs/save/:id
// @access  Private
exports.saveBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.query().findById(req.params.id);
    const userId = req.user.id;

    if (!blog) {
        res.status(404);
        throw new Error('Blog/Reel not found.');
    }

    let hasSaved = null;
    try {
        hasSaved = await db('blog_saves').where({ blog_id: req.params.id, user_id: userId }).first();
    } catch (err) {
        console.warn('blog_saves table not found or error:', err.message);
        res.status(503);
        throw new Error('Blog saves feature is temporarily unavailable. Please run database migrations.');
    }

    if (hasSaved) {
        // Unsave
        try {
            await db('blog_saves').where({ blog_id: req.params.id, user_id: userId }).delete();
            let savedCount = { count: 0 };
            try {
                savedCount = await db('blog_saves').where('blog_id', req.params.id).count('* as count').first() || { count: 0 };
            } catch (err) {
                console.warn('Error getting saved count:', err.message);
            }
            res.json({ message: 'Unsaved successfully.', savedCount: parseInt(savedCount?.count) || 0, isSaved: false });
        } catch (err) {
            console.error('Error unsaving blog:', err.message);
            res.status(503);
            throw new Error('Failed to unsave blog. Please try again later.');
        }
    } else {
        // Save
        try {
            await db('blog_saves').insert({ blog_id: req.params.id, user_id: userId, created_at: new Date() });
            let savedCount = { count: 0 };
            try {
                savedCount = await db('blog_saves').where('blog_id', req.params.id).count('* as count').first() || { count: 0 };
            } catch (err) {
                console.warn('Error getting saved count:', err.message);
            }
            res.json({ message: 'Saved successfully.', savedCount: parseInt(savedCount?.count) || 0, isSaved: true });
        } catch (err) {
            console.error('Error saving blog:', err.message);
            res.status(503);
            throw new Error('Failed to save blog. Please try again later.');
        }
    }
});

// @desc    Share a blog or reel
// @route   POST /api/blogs/share/:id
// @access  Private
exports.shareBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.query().findById(req.params.id);
    const userId = req.user.id;
    const serverInfo = getServerInfo(req);

    if (!blog) {
        res.status(404);
        throw new Error('Blog/Reel not found.');
    }

    // Track share
    await db('blog_shares').insert({
        blog_id: req.params.id,
        user_id: userId,
        share_type: req.body.shareType || 'app',
        created_at: new Date()
    });

    const sharesCount = await db('blog_shares').where('blog_id', req.params.id).count('* as count').first();
    
    // CRITICAL: Use same host logic as createBlog for consistency
    // CRITICAL: Generate share URL with video/reel information
    const shareUrl = `${serverInfo.fullUrl}/reels/${req.params.id}`;
    
    // CRITICAL: Include media URL in response for sharing
    const mediaInfo = getBlogMediaInfo(req, blog, serverInfo);
    const mediaType = blog.media_type || 'image';
    const isReel = blog.is_reel || false;
    
    res.json({
        success: true,
        message: 'Shared successfully.',
        sharesCount: parseInt(sharesCount?.count) || 0,
        shareUrl: shareUrl,
        // CRITICAL: Include video/reel information for sharing
        mediaUrl: mediaInfo.mediaUrl,
        mediaUrls: mediaInfo.mediaUrls,
        mediaType: mediaType,
        isReel: isReel,
        title: blog.title,
        content: blog.content
    });
});

// @desc    Get share link for a blog or reel
// @route   GET /api/blogs/:id/share-link
// @access  Public
exports.getShareLink = asyncHandler(async (req, res) => {
    // CRITICAL: Extract id from params or from URL path as fallback
    const blogId = req.params.id || req.path.split('/')[1] || req.originalUrl.split('/')[4];
    
    if (!blogId) {
        res.status(400);
        throw new Error('Blog/Reel ID is required.');
    }
    
    console.log('🔵 [SHARE-LINK] Processing share link request:', {
        blogId: blogId,
        params: req.params,
        path: req.path,
        originalUrl: req.originalUrl
    });
    
    const blog = await Blog.query().findById(blogId);
    const serverInfo = getServerInfo(req);

    if (!blog) {
        res.status(404);
        throw new Error('Blog/Reel not found.');
    }

    // Generate share URL
    const shareUrl = `${serverInfo.fullUrl}/reels/${blogId}`;
    
    // Get media information for sharing
    const mediaInfo = getBlogMediaInfo(req, blog, serverInfo);
    const mediaType = blog.media_type || 'image';
    const isReel = blog.is_reel || false;
    
    // Get shares count
    let sharesCount = { count: 0 };
    try {
        sharesCount = await db('blog_shares').where('blog_id', blog.id).count('* as count').first() || { count: 0 };
    } catch (err) {
        console.warn('blog_shares table not found or error:', err.message);
    }
    
    res.json({
        success: true,
        shareUrl: shareUrl,
        sharesCount: parseInt(sharesCount?.count) || 0,
        // Include media information for sharing
        mediaUrl: mediaInfo.mediaUrl,
        mediaUrls: mediaInfo.mediaUrls,
        mediaType: mediaType,
        isReel: isReel,
        title: blog.title,
        content: blog.content
    });
});

// @desc    Favorite/Unfavorite a blog or reel (alias for like)
// @route   POST /api/blogs/:id/favorite
// @access  Private
exports.favoriteBlog = asyncHandler(async (req, res) => {
    // CRITICAL: Extract id from params or from URL path as fallback
    const blogId = req.params.id || req.path.split('/')[1] || req.originalUrl.split('/')[4];
    
    if (!blogId) {
        res.status(400);
        throw new Error('Blog/Reel ID is required.');
    }
    
    console.log('🔵 [FAVORITE] Processing favorite request:', {
        blogId: blogId,
        params: req.params,
        path: req.path,
        originalUrl: req.originalUrl,
        userId: req.user?.id
    });
    
    // This is an alias for likeBlog - reuse the same logic
    const blog = await Blog.query().findById(blogId);
    const userId = req.user.id;

    if (!blog) {
        res.status(404);
        throw new Error('Blog/Reel not found.');
    }

    const hasLiked = await blog.$relatedQuery('likers').where('users.id', userId).first();

    if (hasLiked) {
        // Unfavorite (unlike)
        await blog.$relatedQuery('likers').unrelate().where('users.id', userId);
        // Get updated likes count
        const likers = await blog.$relatedQuery('likers');
        const likesCount = likers ? likers.length : 0;
        
        console.log('✅ [FAVORITE] Unfavorited successfully:', {
            blogId: blogId,
            userId: userId,
            likesCount: likesCount
        });
        
        res.json({ 
            success: true,
            message: 'Unfavorited successfully.', 
            likesCount: parseInt(likesCount) || 0, 
            isLiked: false,
            isFavorited: false
        });
    } else {
        // Favorite (like)
        await blog.$relatedQuery('likers').relate(userId);
        // Get updated likes count
        const likers = await blog.$relatedQuery('likers');
        const likesCount = likers ? likers.length : 0;
        
        console.log('✅ [FAVORITE] Favorited successfully:', {
            blogId: blogId,
            userId: userId,
            likesCount: likesCount
        });
        
        res.json({ 
            success: true,
            message: 'Favorited successfully.', 
            likesCount: parseInt(likesCount) || 0, 
            isLiked: true,
            isFavorited: true
        });
    }
});

// @desc    Get saved reels/blogs
// @route   GET /api/blogs/saved
// @access  Private
exports.getSavedBlogs = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const serverInfo = getServerInfo(req);
    
    let savedBlogIds = [];
    try {
        savedBlogIds = await db('blog_saves')
            .where('user_id', userId)
            .pluck('blog_id');
    } catch (err) {
        console.warn('blog_saves table not found or error:', err.message);
        return res.json([]);
    }

    // CRITICAL FIX: Don't use withGraphFetched to avoid first_name/last_name errors
    const blogs = await Blog.query()
        .whereIn('id', savedBlogIds)
        .where('is_published', true);
    
    // Manually fetch authors
    const authorIds = [...new Set(blogs.map(blog => blog.author_id).filter(id => id))];
    let authorsMap = {};
    if (authorIds.length > 0) {
        try {
            const authors = await db('users')
                .whereIn('id', authorIds)
                .select('id', 'name', 'email');
            authors.forEach(author => {
                authorsMap[author.id] = author;
            });
        } catch (err) {
            console.warn('Error fetching authors:', err.message);
        }
    }
    
    // Attach authors to blogs
    blogs.forEach(blog => {
        if (blog.author_id && authorsMap[blog.author_id]) {
            blog.author = authorsMap[blog.author_id];
        } else {
            blog.author = null;
        }
    });

    const blogsWithLikes = await Promise.all(blogs.map(async (blog) => {
        // Get likes count - use count() instead of resultSize()
        let likesCount = 0;
        try {
            const likers = await blog.$relatedQuery('likers');
            likesCount = likers ? likers.length : 0;
        } catch (err) {
            console.warn('Error getting likes count:', err.message);
            likesCount = 0;
        }
        let savedCount = { count: 0 };
        let sharesCount = { count: 0 };
        try {
            savedCount = await db('blog_saves').where('blog_id', blog.id).count('* as count').first() || { count: 0 };
        } catch (err) {
            console.warn('blog_saves table not found or error:', err.message);
        }
        try {
            sharesCount = await db('blog_shares').where('blog_id', blog.id).count('* as count').first() || { count: 0 };
        } catch (err) {
            console.warn('blog_shares table not found or error:', err.message);
        }
        // Get comments count - use count() instead of resultSize()
        let commentsCount = 0;
        try {
            const comments = await Comment.query()
                .where({ commentable_type: 'Blog', commentable_id: blog.id });
            commentsCount = comments ? comments.length : 0;
        } catch (err) {
            console.warn('Error getting comments count:', err.message);
            commentsCount = 0;
        }

        const mediaInfo = getBlogMediaInfo(req, blog, serverInfo);
        const tags = parseTagsField(blog.tags);

        return {
            ...blog,
            mediaUrl: mediaInfo.mediaUrl, // CRITICAL: Ensure absolute URL
            mediaUrls: mediaInfo.mediaUrls,
            media_urls: mediaInfo.mediaUrls,
            likesCount: parseInt(likesCount) || 0,
            savedCount: parseInt(savedCount?.count) || 0,
            sharesCount: parseInt(sharesCount?.count) || 0,
            commentsCount: parseInt(commentsCount) || 0,
            viewsCount: parseInt(blog.views_count) || 0,
            tags,
            destination: blog.destination || null,
            isLiked: false, // Will be checked separately if needed
            isSaved: true,
        };
    }));

    res.json(blogsWithLikes);
});

// @desc    Create a new blog/reel
// @route   POST /api/blogs
// @access  Private/Admin/DataEntry
exports.createBlog = asyncHandler(async (req, res) => {
    try {
        // CRITICAL: Log request details for debugging
        console.log('📝 [CREATE BLOG] Request received:', {
            hasFile: !!req.file,
            hasFiles: !!(req.files && req.files.length > 0),
            fileCount: req.files ? req.files.length : (req.file ? 1 : 0),
            bodyKeys: Object.keys(req.body || {}),
            contentType: req.headers['content-type'],
            contentLength: req.headers['content-length'],
            user: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
            timestamp: new Date().toISOString()
        });
        
        // CRITICAL FIX: Parse body data (can be JSON or form-data)
        // For multipart/form-data, req.body contains form fields
        // For JSON, req.body contains JSON object
        let title, content, category, mediaType, isReel, destinationInput, tagsInput;
        
        if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
            // Form-data: fields are in req.body
            title = req.body.title;
            content = req.body.content;
            category = req.body.category;
            mediaType = req.body.mediaType;
            isReel = req.body.isReel || req.body.is_reel;
            destinationInput = req.body.destination;
            tagsInput = req.body.tags || req.body.tagsList || req.body.tagList;
        } else {
            // JSON: parse from req.body
            title = req.body.title;
            content = req.body.content;
            category = req.body.category;
            mediaType = req.body.mediaType;
            isReel = req.body.isReel || req.body.is_reel;
            destinationInput = req.body.destination;
            tagsInput = req.body.tags;
        }
        
        // Handle string values (form-data sends everything as strings)
        if (isReel === 'true' || isReel === true) {
            isReel = true;
        } else if (isReel === 'false' || isReel === false) {
            isReel = false;
        }
        
        console.log('📝 [CREATE BLOG] Parsed data:', {
            title: title ? title.substring(0, 50) : null,
            content: content ? content.substring(0, 50) : null,
            category,
            mediaType,
            isReel,
            hasFile: !!req.file
        });
        
        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required.',
            });
        }

        const destinationValue = destinationInput ? destinationInput.toString().trim() : null;
        const normalizedTags = normalizeTagsForStorage(tagsInput);

        const serverInfo = getServerInfo(req);
        
        // CRITICAL: Support both single file (req.file) and multiple files (req.files)
        const storedMediaEntries = [];
        const previewMediaUrls = [];
        let finalMediaType = mediaType || (isReel === true || isReel === 'true' ? 'video' : 'image');
        
        // CRITICAL: For reels, only accept videos
        if (isReel === true || isReel === 'true') {
            // Validate that uploaded files are videos
            const uploadedFiles = req.files || (req.file ? [req.file] : []);
            const nonVideoFiles = uploadedFiles.filter(file => 
                !file.mimetype || !file.mimetype.startsWith('video/')
            );
            
            if (nonVideoFiles.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'الريلز تقبل فيديوهات فقط. يرجى رفع فيديو.',
                });
            }
            
            // Force mediaType to video for reels
            finalMediaType = 'video';
        }
        
        // Check for multiple files first
        if (req.files && req.files.length > 0) {
            try {
                // Process all uploaded files
                req.files.forEach((file) => {
                    const relativePath = makeRelativeMediaPath(file.filename);
                    if (relativePath) {
                        storedMediaEntries.push(relativePath);
                        const absoluteUrl = absoluteUrlFromEntry(req, relativePath, serverInfo);
                        if (absoluteUrl) {
                            previewMediaUrls.push(absoluteUrl);
                        }
                    }
                    
                    // Detect media type from file mimetype
                    if (file.mimetype && file.mimetype.startsWith('video/')) {
                        finalMediaType = 'video';
                    } else if (file.mimetype && file.mimetype.startsWith('image/')) {
                        finalMediaType = 'image';
                    }
                });
                
                console.log('📤 Multiple files uploaded successfully:', {
                    fileCount: req.files.length,
                    storedEntries: storedMediaEntries,
                    previewUrls: previewMediaUrls,
                    finalMediaType: finalMediaType,
                    host: serverInfo.host,
                    protocol: serverInfo.protocol,
                    fullUrl: serverInfo.fullUrl,
                });
            } catch (fileError) {
                console.error('Error processing uploaded files:', fileError);
                return res.status(400).json({
                    success: false,
                    message: 'Error processing uploaded files.',
                    error: process.env.NODE_ENV === 'development' ? fileError.message : undefined,
                });
            }
        } else if (req.file) {
            // Single file was uploaded via multer (backward compatibility)
            try {
                // CRITICAL: For reels, validate that file is a video
                if ((isReel === true || isReel === 'true') && 
                    (!req.file.mimetype || !req.file.mimetype.startsWith('video/'))) {
                    return res.status(400).json({
                        success: false,
                        message: 'الريلز تقبل فيديوهات فقط. يرجى رفع فيديو.',
                    });
                }
                
                const relativePath = makeRelativeMediaPath(req.file.filename);
                if (relativePath) {
                    storedMediaEntries.push(relativePath);
                    const absoluteUrl = absoluteUrlFromEntry(req, relativePath, serverInfo);
                    if (absoluteUrl) {
                        previewMediaUrls.push(absoluteUrl);
                    }
                }
                
                // Detect media type from file mimetype
                if (req.file.mimetype && req.file.mimetype.startsWith('video/')) {
                    finalMediaType = 'video';
                } else if (req.file.mimetype && req.file.mimetype.startsWith('image/')) {
                    finalMediaType = 'image';
                }
                
                // CRITICAL: For reels, force video type
                if (isReel === true || isReel === 'true') {
                    finalMediaType = 'video';
                }
                
                console.log('📤 File uploaded successfully:', {
                    filename: req.file.filename,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                    storedEntry: storedMediaEntries[0],
                    previewUrl: previewMediaUrls[0] || null,
                    finalMediaType: finalMediaType,
                    host: serverInfo.host,
                    protocol: serverInfo.protocol,
                    fullUrl: serverInfo.fullUrl,
                    // CRITICAL: Verify file exists
                    filePath: req.file.path,
                    fileExists: require('fs').existsSync(req.file.path)
                });
            } catch (fileError) {
                console.error('Error processing uploaded file:', fileError);
                return res.status(400).json({
                    success: false,
                    message: 'Error processing uploaded file.',
                    error: process.env.NODE_ENV === 'development' ? fileError.message : undefined,
                });
            }
        } else if (req.body.mediaUrl) {
            // Media URL provided directly (for external URLs)
            const providedUrl = stripTrailingSlashIfFile(req.body.mediaUrl.trim());
            if (providedUrl) {
                storedMediaEntries.push(providedUrl);
                const absoluteUrl = absoluteUrlFromEntry(req, providedUrl, serverInfo);
                if (absoluteUrl) {
                    previewMediaUrls.push(absoluteUrl);
                }
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Media file or URL is required.',
            });
        }
        
        if (storedMediaEntries.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Media file or URL is required.',
            });
        }
        
        // Validate user
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }
        
        // Insert blog into database
        let blog;
        try {
            // CRITICAL: Store media URLs - if multiple, store as JSON string, otherwise as single URL
            // For backward compatibility, also store first URL in image field
        const primaryStoredEntry = storedMediaEntries[0];
        const mediaUrlToStore = storedMediaEntries.length > 1
            ? JSON.stringify(storedMediaEntries)
            : primaryStoredEntry;
        const previewPrimaryUrl = previewMediaUrls[0] || null;
            
            const blogData = {
                title: title.trim(),
                content: content.trim(),
                author_id: req.user.id,
                category: category || 'general',
                image: primaryStoredEntry, // First media entry for backward compatibility
                media_url: mediaUrlToStore, // Stores relative path(s) or external URL
                media_type: finalMediaType,
                is_reel: isReel === true || isReel === 'true' || isReel === 1 || false,
                is_published: true, // CRITICAL: Always publish so ALL users (admin, regular, etc.) can see it
                destination: destinationValue,
                tags: normalizedTags,
                views_count: 0,
                // CRITICAL: Video storage details:
                // - media_url: relative path(s) for locally stored media or full URL for external sources
                // - media_type: 'video' for reels
                // - is_reel: true for reels
                // - image: First stored entry for backward compatibility
            };
            
            // CRITICAL: Log video storage details for debugging
            console.log('💾 [VIDEO STORAGE]', {
                blogId: blogData.title?.substring(0, 30),
                mediaUrl: typeof mediaUrlToStore === 'string' ? mediaUrlToStore.substring(0, 100) : 'Array',
                mediaType: finalMediaType,
                isReel: blogData.is_reel,
                isPublished: blogData.is_published,
                videoAccessible: true, // CRITICAL: Video is stored and accessible to all users
                // CRITICAL: Log full URL for video debugging
                fullVideoUrl: previewPrimaryUrl || 'N/A',
                isAbsoluteUrl: !!(previewPrimaryUrl && (previewPrimaryUrl.startsWith('http://') || previewPrimaryUrl.startsWith('https://')))
            });
            
            console.log('💾 [INSERTING BLOG]', {
                title: blogData.title.substring(0, 50),
                author_id: blogData.author_id,
                mediaUrl: blogData.media_url,
                isReel: blogData.is_reel,
                isPublished: blogData.is_published
            });
            
            blog = await Blog.query().insert(blogData);
            
            console.log('✅ [BLOG CREATED]', {
                id: blog.id,
                title: blog.title,
                mediaUrl: blog.media_url,
                isReel: blog.is_reel,
                isPublished: blog.is_published,
                authorId: blog.author_id,
                timestamp: new Date().toISOString()
            });
        } catch (dbError) {
            console.error('❌ [DATABASE ERROR] Creating blog/reel:', {
                error: dbError.message,
                code: dbError.code,
                stack: dbError.stack?.substring(0, 500),
                blogData: {
                    title: title?.substring(0, 50),
                    author_id: req.user?.id,
                    mediaUrl: typeof mediaUrlToStore === 'string' ? mediaUrlToStore.substring(0, 100) : 'Array'
                },
                timestamp: new Date().toISOString()
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to save blog/reel to database.',
                error: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
            });
        }
        
        // Get author info for response (optional, don't fail if it doesn't work)
        let blogWithAuthor = blog;
        try {
            // CRITICAL: Fetch author manually to avoid first_name/last_name errors
            const author = await db('users')
                .where('id', blog.author_id)
                .select('id', 'name', 'email')
                .first();
            
            blogWithAuthor = {
                ...blog,
                author: author || { id: blog.author_id, name: 'Unknown', email: null }
            };
            
            console.log('✅ [AUTHOR FETCHED]', {
                blogId: blog.id,
                authorId: author?.id,
                authorName: author?.name
            });
        } catch (authorError) {
            console.warn('⚠️ [AUTHOR FETCH WARNING]', {
                error: authorError.message,
                blogId: blog.id,
                authorId: blog.author_id
            });
            // Continue with basic blog data
            blogWithAuthor = {
                ...blog,
                author: { id: blog.author_id, name: 'Unknown', email: null }
            };
        }
        
        const mediaInfoResponse = getBlogMediaInfo(req, blogWithAuthor, serverInfo);
        const finalMediaUrls = mediaInfoResponse.mediaUrls;
        const finalMediaUrl = mediaInfoResponse.mediaUrl;
        
        const responseData = {
            ...blogWithAuthor,
            mediaUrl: finalMediaUrl, // CRITICAL: Primary URL (backward compatibility)
            media_url: finalMediaUrl, // Primary URL
            mediaUrls: finalMediaUrls, // CRITICAL: Array of all media URLs (for multiple images)
            media_urls: finalMediaUrls, // Alternative field name
            // Ensure is_published is true so all users can see it
            is_published: true,
            isPublished: true,
            destination: blogWithAuthor.destination || destinationValue || null,
            tags: normalizedTags || [],
            viewsCount: 0
        };
        
        console.log('✅ [RESPONSE READY]', {
            blogId: responseData.id,
            mediaUrl: responseData.mediaUrl,
            isPublished: responseData.is_published,
            isReel: responseData.is_reel
        });
        
        // CRITICAL: Ensure response is sent properly and connection is kept alive
        // Set headers before sending response
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Keep-Alive', 'timeout=5');
        
        // Send response
        const response = {
            success: true,
            message: 'Reel created successfully',
            data: responseData
        };
        
        // Use res.json() which automatically handles JSON serialization and connection
        res.status(200).json(response);
        
        // Log successful response
        console.log('✅ [RESPONSE SENT]', {
            blogId: responseData.id,
            statusCode: 200,
            responseSize: JSON.stringify(response).length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating blog/reel:', error);
        // Return error response
        res.status(500).json({
            success: false,
            message: `Failed to create blog/reel: ${error.message}`,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});

// @desc    Update a blog/reel
// @route   PUT /api/blogs/:id
// @access  Private/Admin/DataEntry
exports.updateBlog = asyncHandler(async (req, res) => {
    try {
        const blogId = req.params.id;
        
        // Find the blog
        const blog = await Blog.query().findById(blogId);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'المدونة غير موجودة.',
            });
        }
        
        // Check if user has permission (must be author or admin)
        const isAuthor = blog.author_id === req.user.id;
        const isAdmin = ['super_admin', 'admin', 'data_entry'].includes(req.user.role?.toLowerCase());
        
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية لتعديل هذه المدونة.',
            });
        }
        
        // Parse body data (can be JSON or form-data)
        let title, content, category, mediaType, isReel, destinationInput, tagsInput, isPublished;
        
        if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
            title = req.body.title;
            content = req.body.content;
            category = req.body.category;
            mediaType = req.body.mediaType;
            isReel = req.body.isReel || req.body.is_reel;
            destinationInput = req.body.destination;
            tagsInput = req.body.tags || req.body.tagsList || req.body.tagList;
            isPublished = req.body.isPublished || req.body.is_published;
        } else {
            title = req.body.title;
            content = req.body.content;
            category = req.body.category;
            mediaType = req.body.mediaType;
            isReel = req.body.isReel || req.body.is_reel;
            destinationInput = req.body.destination;
            tagsInput = req.body.tags;
            isPublished = req.body.isPublished || req.body.is_published;
        }
        
        // Handle string values
        if (isReel === 'true' || isReel === true) {
            isReel = true;
        } else if (isReel === 'false' || isReel === false) {
            isReel = false;
        }
        
        if (isPublished === 'true' || isPublished === true) {
            isPublished = true;
        } else if (isPublished === 'false' || isPublished === false) {
            isPublished = false;
        }
        
        // Build update data
        const updateData = {};
        
        if (title !== undefined && title !== null) {
            updateData.title = title.trim();
        }
        if (content !== undefined && content !== null) {
            updateData.content = content.trim();
        }
        if (category !== undefined && category !== null) {
            updateData.category = category.trim();
        }
        if (mediaType !== undefined && mediaType !== null) {
            updateData.media_type = mediaType.trim();
        }
        if (isReel !== undefined && isReel !== null) {
            updateData.is_reel = isReel === true || isReel === 'true' || isReel === 1;
        }
        if (isPublished !== undefined && isPublished !== null) {
            updateData.is_published = isPublished === true || isPublished === 'true' || isPublished === 1;
        }
        if (destinationInput !== undefined && destinationInput !== null) {
            updateData.destination = destinationInput.toString().trim() || null;
        }
        if (tagsInput !== undefined && tagsInput !== null) {
            updateData.tags = normalizeTagsForStorage(tagsInput);
        }
        
        const serverInfo = getServerInfo(req);
        
        // Handle file upload if provided
        if (req.files && req.files.length > 0) {
            const storedMediaEntries = [];
            req.files.forEach((file) => {
                const relativePath = makeRelativeMediaPath(file.filename);
                if (relativePath) {
                    storedMediaEntries.push(relativePath);
                }
                
                // Detect media type from file mimetype
                if (file.mimetype && file.mimetype.startsWith('video/')) {
                    updateData.media_type = 'video';
                } else if (file.mimetype && file.mimetype.startsWith('image/')) {
                    updateData.media_type = 'image';
                }
            });
            
            if (storedMediaEntries.length > 0) {
                const primaryStoredEntry = storedMediaEntries[0];
                updateData.image = primaryStoredEntry;
                updateData.media_url = storedMediaEntries.length > 1
                    ? JSON.stringify(storedMediaEntries)
                    : primaryStoredEntry;
            }
        } else if (req.file) {
            const relativePath = makeRelativeMediaPath(req.file.filename);
            if (relativePath) {
                updateData.image = relativePath;
                updateData.media_url = relativePath;
                
                // Detect media type from file mimetype
                if (req.file.mimetype && req.file.mimetype.startsWith('video/')) {
                    updateData.media_type = 'video';
                } else if (req.file.mimetype && req.file.mimetype.startsWith('image/')) {
                    updateData.media_type = 'image';
                }
            }
        } else if (req.body.mediaUrl) {
            const providedUrl = stripTrailingSlashIfFile(req.body.mediaUrl.trim());
            if (providedUrl) {
                updateData.image = providedUrl;
                updateData.media_url = providedUrl;
            }
        }
        
        // Update the blog
        await Blog.query()
            .findById(blogId)
            .patch(updateData);
        
        // Fetch updated blog with author
        const blogWithAuthor = await Blog.query().findById(blogId);
        
        // Manually fetch author
        let author = null;
        if (blogWithAuthor && blogWithAuthor.author_id) {
            try {
                author = await db('users')
                    .where('id', blogWithAuthor.author_id)
                    .select('id', 'name', 'email')
                    .first();
            } catch (err) {
                console.warn('Error fetching author:', err.message);
            }
        }
        
        const mediaInfo = getBlogMediaInfo(req, blogWithAuthor, serverInfo);
        const tags = parseTagsField(blogWithAuthor.tags);
        
        const responseData = {
            ...blogWithAuthor,
            mediaUrl: mediaInfo.mediaUrl,
            media_url: mediaInfo.mediaUrl,
            mediaUrls: mediaInfo.mediaUrls,
            media_urls: mediaInfo.mediaUrls,
            tags: tags || [],
            destination: blogWithAuthor.destination || null,
            author: author ? {
                id: author.id,
                name: author.name,
                email: author.email
            } : null,
        };
        
        console.log('✅ [BLOG UPDATED]', {
            id: blogId,
            title: responseData.title,
            isPublished: responseData.is_published
        });
        
        res.status(200).json({
            success: true,
            message: 'تم تحديث المدونة بنجاح.',
            data: responseData
        });
    } catch (error) {
        console.error('❌ [BLOG UPDATE ERROR]', error);
        res.status(500).json({
            success: false,
            message: `فشل تحديث المدونة: ${error.message}`,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});

// @desc    Delete a blog/reel
// @route   DELETE /api/blogs/:id
// @access  Private/Admin/DataEntry
exports.deleteBlog = asyncHandler(async (req, res) => {
    try {
        const blogId = req.params.id;
        
        // Find the blog
        const blog = await Blog.query().findById(blogId);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'المدونة غير موجودة.',
            });
        }
        
        // Check if user has permission (must be author or admin)
        const isAuthor = blog.author_id === req.user.id;
        const isAdmin = ['super_admin', 'admin', 'data_entry'].includes(req.user.role?.toLowerCase());
        
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية لحذف هذه المدونة.',
            });
        }
        
        // Delete related data first (likes, saves, shares, comments, views)
        try {
            await db('blog_likes').where('blog_id', blogId).delete();
        } catch (err) {
            console.warn('Error deleting blog likes:', err.message);
        }
        
        try {
            await db('blog_saves').where('blog_id', blogId).delete();
        } catch (err) {
            console.warn('Error deleting blog saves:', err.message);
        }
        
        try {
            await db('blog_shares').where('blog_id', blogId).delete();
        } catch (err) {
            console.warn('Error deleting blog shares:', err.message);
        }
        
        try {
            await db('blog_views').where('blog_id', blogId).delete();
        } catch (err) {
            console.warn('Error deleting blog views:', err.message);
        }
        
        try {
            await db('comments')
                .where('commentable_type', 'Blog')
                .where('commentable_id', blogId)
                .delete();
        } catch (err) {
            console.warn('Error deleting blog comments:', err.message);
        }
        
        // Delete the blog
        await Blog.query().findById(blogId).delete();
        
        console.log('✅ [BLOG DELETED]', {
            id: blogId,
            title: blog.title
        });
        
        res.status(200).json({
            success: true,
            message: 'تم حذف المدونة بنجاح.',
        });
    } catch (error) {
        console.error('❌ [BLOG DELETE ERROR]', error);
        res.status(500).json({
            success: false,
            message: `فشل حذف المدونة: ${error.message}`,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});
