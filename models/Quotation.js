/**
 * Quotation Model
 */

const { Model } = require('objection');

class Quotation extends Model {
  static get tableName() {
    return 'quotations';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['customer_id', 'sales_id', 'total_amount'],
      properties: {
        id: { type: 'integer' },
        customer_id: { type: 'integer' },
        sales_id: { type: 'integer' },
        package_id: { type: ['integer', 'null'] },
        items: { type: ['string', 'null'] },
        notes: { type: ['string', 'null'] },
        total_amount: { type: 'number' },
        discount: { type: 'number' },
        status: { 
          type: 'string',
          enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']
        },
        valid_until: { type: ['string', 'null'] },
        sent_at: { type: ['string', 'null'] },
        viewed_at: { type: ['string', 'null'] },
        responded_at: { type: ['string', 'null'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  static get relationMappings() {
    const User = require('./User');
    const Package = require('./Package');

    return {
      customer: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'quotations.customer_id',
          to: 'users.id'
        }
      },
      sales: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'quotations.sales_id',
          to: 'users.id'
        }
      },
      package: {
        relation: Model.BelongsToOneRelation,
        modelClass: Package,
        join: {
          from: 'quotations.package_id',
          to: 'packages.id'
        }
      }
    };
  }
}

module.exports = Quotation;

