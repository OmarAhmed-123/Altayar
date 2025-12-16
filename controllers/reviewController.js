const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const PackageAnalytics = require('../models/PackageAnalytics');

// @desc    Create a new review for a package
// @route   POST /api/reviews/package/:packageId
// @access  Private
exports.createPackageReview = asyncHandler(async (req, res) => {
    const { rating, comment, images, tags, ratingBreakdown, reviewType } = req.body;
    const { packageId } = req.params;

    // Check if user already reviewed this package
    const existingReview = await Review.query()
        .where('user_id', req.user.id)
        .where('package_id', packageId)
        .first();

    if (existingReview) {
        res.status(400);
        throw new Error('You have already reviewed this package.');
    }

    // Optional: Check if the user has actually booked this package before reviewing
    const hasBooked = await Booking.query()
        .where('user_id', req.user.id)
        .andWhere('details', '@>', { packageId: parseInt(packageId) })
        .first();

    if (!hasBooked) {
        res.status(403);
        throw new Error('You can only review packages you have booked.');
    }
    
    const review = await Review.query().insert({
        rating,
        comment,
        user_id: req.user.id,
        package_id: packageId,
        images: images || [],
        tags: tags || [],
        rating_breakdown: ratingBreakdown || {},
        review_type: reviewType || 'package',
        is_verified: false
    });

    // Track review creation in analytics
    await PackageAnalytics.trackInteraction(packageId, req.user.id, 'review', {
        review_id: review.id,
        rating: rating
    });

    res.status(200).json({
        success: true,
        data: review,
        message: 'Review created successfully'
    });
});

// @desc    Get all reviews for a package with filters
// @route   GET /api/reviews/package/:packageId
// @access  Public
exports.getPackageReviews = asyncHandler(async (req, res) => {
    const { packageId } = req.params;
    const { 
        rating, 
        verified, 
        featured, 
        sortBy = 'newest', 
        limit = 20, 
        page = 1 
    } = req.query;

    const filters = {
        packageId,
        rating: rating ? parseInt(rating) : undefined,
        verified: verified === 'true',
        featured: featured === 'true',
        sortBy,
        limit: parseInt(limit)
    };

    const reviews = await Review.getFilteredReviews(filters);
    
    // Get review statistics
    const stats = await Review.query()
        .where('package_id', packageId)
        .select('rating')
        .then(reviews => {
            const total = reviews.length;
            const average = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
            const distribution = reviews.reduce((acc, r) => {
                acc[r.rating] = (acc[r.rating] || 0) + 1;
                return acc;
            }, {});
            
            return { total, average: Math.round(average * 10) / 10, distribution };
        });

    res.json({
        success: true,
        data: {
            reviews,
            stats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: stats.total
            }
        }
    });
});

// @desc    Mark review as helpful/not helpful
// @route   POST /api/reviews/:reviewId/helpfulness
// @access  Private
exports.markReviewHelpfulness = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { isHelpful } = req.body;

    const result = await Review.markHelpfulness(reviewId, req.user.id, isHelpful);

    res.json({
        success: true,
        data: result,
        message: `Review marked as ${isHelpful ? 'helpful' : 'not helpful'}`
    });
});

// @desc    Get user's reviews
// @route   GET /api/reviews/my
// @access  Private
exports.getMyReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.query()
        .where('user_id', req.user.id)
        .withGraphFetched('package(selectBasicInfo)')
        .modifiers({
            selectBasicInfo(builder) {
                builder.select('id', 'name', 'price', 'images');
            }
        })
        .orderBy('created_at', 'desc');

    res.json({
        success: true,
        data: reviews
    });
});

// @desc    Update user's review
// @route   PUT /api/reviews/:reviewId
// @access  Private
exports.updateReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment, images, tags, ratingBreakdown } = req.body;

    const review = await Review.query()
        .findById(reviewId)
        .where('user_id', req.user.id)
        .first();

    if (!review) {
        res.status(404);
        throw new Error('Review not found or you are not authorized to edit it');
    }

    const updatedReview = await review.$query().patchAndFetch({
        rating: rating || review.rating,
        comment: comment || review.comment,
        images: images || review.images,
        tags: tags || review.tags,
        rating_breakdown: ratingBreakdown || review.rating_breakdown
    });

    res.json({
        success: true,
        data: updatedReview,
        message: 'Review updated successfully'
    });
});

// @desc    Delete user's review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
exports.deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    const review = await Review.query()
        .findById(reviewId)
        .where('user_id', req.user.id)
        .first();

    if (!review) {
        res.status(404);
        throw new Error('Review not found or you are not authorized to delete it');
    }

    await Review.query().deleteById(reviewId);

    res.json({
        success: true,
        message: 'Review deleted successfully'
    });
});

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/admin
// @access  Private/Admin
exports.getAllReviewsAdmin = asyncHandler(async (req, res) => {
    try {
        const { 
            status, 
            verified, 
            featured, 
            sortBy = 'newest', 
            limit = 50, 
            page = 1 
        } = req.query;

        let query = Review.query()
            .withGraphFetched('[user(selectBasicInfo), package(selectBasicInfo)]')
            .modifiers({
                selectBasicInfo(builder) {
                    builder.select('id', 'name', 'email');
                }
            });

        // Apply filters
        if (verified === 'true') {
            query = query.where('is_verified', true);
        }
        if (featured === 'true') {
            query = query.where('is_featured', true);
        }

        // Apply sorting
        if (sortBy === 'newest') {
            query = query.orderBy('created_at', 'desc');
        } else if (sortBy === 'oldest') {
            query = query.orderBy('created_at', 'asc');
        } else if (sortBy === 'highest') {
            query = query.orderBy('rating', 'desc');
        } else if (sortBy === 'lowest') {
            query = query.orderBy('rating', 'asc');
        }

        // Apply pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query = query.limit(parseInt(limit)).offset(offset);

        const reviews = await query;

        // Get total count for pagination
        let countQuery = Review.query();
        if (verified === 'true') {
            countQuery = countQuery.where('is_verified', true);
        }
        if (featured === 'true') {
            countQuery = countQuery.where('is_featured', true);
        }
        const total = await countQuery.resultSize();

        res.json({
            success: true,
            data: reviews || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total || 0
            }
        });
    } catch (error) {
        console.error('Error fetching admin reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Verify review (Admin)
// @route   PUT /api/reviews/:reviewId/verify
// @access  Private/Admin
exports.verifyReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    const review = await Review.query().findById(reviewId);
    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    const verifiedReview = await Review.verifyReview(reviewId);

    res.json({
        success: true,
        data: verifiedReview,
        message: 'Review verified successfully'
    });
});

// @desc    Feature review (Admin)
// @route   PUT /api/reviews/:reviewId/feature
// @access  Private/Admin
exports.featureReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { featured = true } = req.body;

    const review = await Review.query().findById(reviewId);
    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    const featuredReview = await Review.featureReview(reviewId, featured);

    res.json({
        success: true,
        data: featuredReview,
        message: `Review ${featured ? 'featured' : 'unfeatured'} successfully`
    });
});

// @desc    Get review statistics (Admin)
// @route   GET /api/reviews/statistics
// @access  Private/Admin
exports.getReviewStatistics = asyncHandler(async (req, res) => {
    const { db } = require('../config/db');
    
    // Overall statistics
    const totalReviews = await Review.query().resultSize();
    const verifiedReviews = await Review.query().where('is_verified', true).resultSize();
    const featuredReviews = await Review.query().where('is_featured', true).resultSize();
    
    // Average rating
    const avgRating = await Review.query()
        .avg('rating as average')
        .first();
    
    // Rating distribution
    const ratingDistribution = await Review.query()
        .groupBy('rating')
        .select('rating', db.raw('count(*)::int as count'))
        .orderBy('rating', 'desc');
    
    // Reviews by type
    const reviewsByType = await Review.query()
        .groupBy('review_type')
        .select('review_type', db.raw('count(*)::int as count'));
    
    // Recent reviews
    const recentReviews = await Review.query()
        .withGraphFetched('[user(selectBasicInfo), package(selectBasicInfo)]')
        .modifiers({
            selectBasicInfo(builder) {
                builder.select('id', 'name');
            }
        })
        .orderBy('created_at', 'desc')
        .limit(10);

    res.json({
        success: true,
        data: {
            totalReviews,
            verifiedReviews,
            featuredReviews,
            averageRating: Math.round(avgRating.average * 10) / 10,
            ratingDistribution,
            reviewsByType,
            recentReviews
        }
    });
});