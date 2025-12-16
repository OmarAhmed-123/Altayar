const { Model } = require('objection');

class Ad extends Model {
  static get tableName() {
    return 'ads';
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: { from: 'ads.created_by', to: 'users.id' }
      }
    };
  }
}

module.exports = Ad;