// models/Affiliate.js
const { Model } = require('objection');

class Affiliate extends Model {
  static get tableName() {
    return 'affiliates';
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'affiliates.user_id',
          to: 'users.id'
        }
      },
      referrals: {
        relation: Model.HasManyRelation,
        modelClass: User,
        join: {
          from: 'affiliates.id',
          to: 'users.referred_by_id'
        }
      }
    };
  }
}

module.exports = Affiliate;