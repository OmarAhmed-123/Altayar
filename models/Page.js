const { Model } = require('objection');

class Page extends Model {
  static get tableName() {
    return 'pages';
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: { from: 'pages.created_by', to: 'users.id' }
      }
    };
  }
}

module.exports = Page;