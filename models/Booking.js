const { Model } = require('objection');

class Booking extends Model {
  static get tableName() {
    return 'bookings';
  }

  static get relationMappings() {
    const User = require('./User');
    const Transaction = require('./Transaction');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'bookings.user_id',
          to: 'users.id'
        }
      },
      transaction: {
        relation: Model.HasOneRelation,
        modelClass: Transaction,
        join: {
          from: 'bookings.id',
          to: 'transactions.related_booking_id'
        }
      }
    };
  }
}

module.exports = Booking;