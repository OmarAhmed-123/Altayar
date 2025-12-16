const { Model } = require('objection');

class Transaction extends Model {
  static get tableName() {
    return 'transactions';
  }

  static get relationMappings() {
    const User = require('./User');
    const Booking = require('./Booking');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'transactions.user_id',
          to: 'users.id'
        }
      },
      booking: {
        relation: Model.BelongsToOneRelation,
        modelClass: Booking,
        join: {
          from: 'transactions.related_booking_id',
          to: 'bookings.id'
        }
      }
    };
  }
}

module.exports = Transaction;