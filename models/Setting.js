const { Model } = require('objection');

class Setting extends Model {
  static get tableName() {
    return 'settings';
  }
}

module.exports = Setting;