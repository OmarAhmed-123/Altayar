const { Model } = require('objection');

class Trip extends Model {
  static get tableName() {
    return 'trips';
  }

  static get jsonAttributes() {
    return ['destinations', 'details'];
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: { from: 'trips.user_id', to: 'users.id' }
      }
    };
  }
}

module.exports = Trip;