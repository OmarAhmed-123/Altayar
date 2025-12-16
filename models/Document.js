// models/Document.js
const { Model } = require('objection');

class Document extends Model {
  static get tableName() {
    return 'documents';
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'documents.user_id',
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = Document;