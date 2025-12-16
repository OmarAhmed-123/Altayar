const { Model } = require('objection');

class Message extends Model {
  static get tableName() {
    return 'messages';
  }

  static get relationMappings() {
    const User = require('./User');
    const Chat = require('./Chat');
    return {
      sender: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'messages.sender_id',
          to: 'users.id'
        }
      },
      chat: {
        relation: Model.BelongsToOneRelation,
        modelClass: Chat,
        join: {
          from: 'messages.chat_id',
          to: 'chats.id'
        }
      }
    };
  }
}

module.exports = Message;