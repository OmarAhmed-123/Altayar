const { Model } = require('objection');

class Voucher extends Model {
  static get tableName() {
    return 'vouchers';
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: { from: 'vouchers.user_id', to: 'users.id' }
      },
      issuer: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: { from: 'vouchers.issued_by', to: 'users.id' }
      }
    };
  }
}

module.exports = Voucher;