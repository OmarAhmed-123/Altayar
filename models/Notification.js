const { Model } = require('objection');

class Notification extends Model {
  static get tableName() {
    return 'notifications';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'title', 'message', 'type'],
      properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer' },
        sender_id: { type: ['integer', 'null'] },
        title: { type: 'string' },
        message: { type: 'string' },
        type: { type: 'string' },
        reference_id: { type: ['integer', 'null'] },
        data: { type: ['string', 'null'] },
        is_read: { type: 'boolean' },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'notifications.user_id',
          to: 'users.id'
        }
      },
      sender: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'notifications.sender_id',
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = Notification;