/**
 * Support Ticket Model
 */

const { Model } = require('objection');

class SupportTicket extends Model {
  static get tableName() {
    return 'support_tickets';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'ticket_number', 'subject'],
      properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer' },
        chat_id: { type: ['integer', 'null'] },
        ticket_number: { type: 'string' },
        subject: { type: 'string' },
        description: { type: ['string', 'null'] },
        status: {
          type: 'string',
          enum: ['open', 'in_progress', 'resolved', 'closed']
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent']
        },
        assigned_to: { type: ['integer', 'null'] },
        resolved_at: { type: ['string', 'null'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  static get relationMappings() {
    const User = require('./User');
    const Chat = require('./Chat');

    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'support_tickets.user_id',
          to: 'users.id'
        }
      },
      chat: {
        relation: Model.BelongsToOneRelation,
        modelClass: Chat,
        join: {
          from: 'support_tickets.chat_id',
          to: 'chats.id'
        }
      },
      assignedStaff: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'support_tickets.assigned_to',
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = SupportTicket;

