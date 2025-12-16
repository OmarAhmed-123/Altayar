const { Model } = require('objection');

class Review extends Model {
  static get tableName() {
    return 'reviews';
  }

  static get relationMappings() {
    const User = require('./User');
    const Package = require('./Package');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'reviews.user_id',
          to: 'users.id'
        }
      },
      package: {
        relation: Model.BelongsToOneRelation,
        modelClass: Package,
        join: {
          from: 'reviews.package_id',
          to: 'packages.id'
        }
      },
      helpfulness: {
        relation: Model.HasManyRelation,
        modelClass: require('./ReviewHelpfulness'),
        join: {
          from: 'reviews.id',
          to: 'review_helpfulness.review_id'
        }
      }
    };
  }

  // Method to mark review as helpful/not helpful
  static async markHelpfulness(reviewId, userId, isHelpful) {
    const ReviewHelpfulness = require('./ReviewHelpfulness');
    
    // Check if user already rated this review
    const existing = await ReviewHelpfulness.query()
      .findOne({ review_id: reviewId, user_id: userId });
    
    if (existing) {
      // Update existing rating
      await existing.$query().patch({ is_helpful: isHelpful });
    } else {
      // Create new rating
      await ReviewHelpfulness.query().insert({
        review_id: reviewId,
        user_id: userId,
        is_helpful: isHelpful
      });
    }
    
    // Update helpfulness counts
    const helpfulCount = await ReviewHelpfulness.query()
      .where({ review_id: reviewId, is_helpful: true })
      .resultSize();
    
    const notHelpfulCount = await ReviewHelpfulness.query()
      .where({ review_id: reviewId, is_helpful: false })
      .resultSize();
    
    await this.query().findById(reviewId).patch({
      helpful_count: helpfulCount,
      not_helpful_count: notHelpfulCount
    });
    
    return { helpful_count: helpfulCount, not_helpful_count: notHelpfulCount };
  }

  // Method to get reviews with filters
  static async getFilteredReviews(filters = {}) {
    let query = this.query()
      .withGraphFetched('[user(selectBasicInfo), package(selectBasicInfo)]')
      .modifiers({
        selectBasicInfo(builder) {
          builder.select('id', 'name', 'email', 'profile_picture_url');
        }
      });
    
    if (filters.packageId) {
      query = query.where('package_id', filters.packageId);
    }
    
    if (filters.rating) {
      query = query.where('rating', filters.rating);
    }
    
    if (filters.verified) {
      query = query.where('is_verified', true);
    }
    
    if (filters.featured) {
      query = query.where('is_featured', true);
    }
    
    if (filters.reviewType) {
      query = query.where('review_type', filters.reviewType);
    }
    
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'newest':
          query = query.orderBy('created_at', 'desc');
          break;
        case 'oldest':
          query = query.orderBy('created_at', 'asc');
          break;
        case 'highest_rating':
          query = query.orderBy('rating', 'desc');
          break;
        case 'most_helpful':
          query = query.orderBy('helpful_count', 'desc');
          break;
        default:
          query = query.orderBy('created_at', 'desc');
      }
    } else {
      query = query.orderBy('created_at', 'desc');
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    return await query;
  }

  // Method to verify review (admin only)
  static async verifyReview(reviewId) {
    return await this.query().findById(reviewId).patch({
      is_verified: true,
      verified_at: new Date()
    });
  }

  // Method to feature review (admin only)
  static async featureReview(reviewId, featured = true) {
    return await this.query().findById(reviewId).patch({
      is_featured: featured
    });
  }
}

module.exports = Review;