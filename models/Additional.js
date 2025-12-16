const { Model } = require('objection');

class Additional extends Model {
  static get tableName() {
    return 'additionals';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'price'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string' },
        price: { type: 'number' },
        category: { type: 'string' },
        icon: { type: 'string' },
        is_active: { type: 'boolean', default: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    };
  }
}

module.exports = Additional;

