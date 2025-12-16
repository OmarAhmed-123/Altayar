const { Model } = require('objection');

class Chat extends Model {
  static get tableName() {
    return 'chats';
  }

  static get relationMappings() {
    const User = require('./User');
    const Message = require('./Message');
    return {
      participants: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: 'chats.id',
          through: {
            from: 'chat_participants.chat_id',
            to: 'chat_participants.user_id'
          },
          to: 'users.id'
        }
      },
      messages: {
        relation: Model.HasManyRelation,
        modelClass: Message,
        join: {
          from: 'chats.id',
          to: 'messages.chat_id'
        }
      },
      latestMessage: {
        relation: Model.HasOneRelation,
        modelClass: Message,
        join: {
          from: 'chats.latest_message_id',
          to: 'messages.id'
        }
      }
    };
  }
}

module.exports = Chat;