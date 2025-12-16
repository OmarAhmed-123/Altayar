const { Model } = require('objection');

class ReviewHelpfulness extends Model {
  static get tableName() {
    return 'review_helpfulness';
  }

  static get relationMappings() {
    const Review = require('./Review');
    const User = require('./User');
    return {
      review: {
        relation: Model.BelongsToOneRelation,
        modelClass: Review,
        join: {
          from: 'review_helpfulness.review_id',
          to: 'reviews.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'review_helpfulness.user_id',
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = ReviewHelpfulness;
