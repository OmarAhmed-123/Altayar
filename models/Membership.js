const { Model } = require('objection');

class Membership extends Model {
  static get tableName() {
    return 'memberships';
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      users: {
        relation: Model.HasManyRelation,
        modelClass: User,
        join: {
          from: 'memberships.id',
          to: 'users.membership_id'
        }
      }
    };
  }
}

module.exports = Membership;