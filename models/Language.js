const { Model } = require('objection');

class Language extends Model {
  static get tableName() {
    return 'languages';
  }

  static get relationMappings() {
    const User = require('./User');
    const Translation = require('./Translation');
    return {
      users: {
        relation: Model.HasManyRelation,
        modelClass: User,
        join: {
          from: 'languages.id',
          to: 'users.language_id'
        }
      },
      translations: {
        relation: Model.HasManyRelation,
        modelClass: Translation,
        join: {
          from: 'languages.code',
          to: 'translations.language_code'
        }
      }
    };
  }

  // Get active languages
  static async getActiveLanguages() {
    return await this.query()
      .where('is_active', true)
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc');
  }

  // Get default language
  static async getDefaultLanguage() {
    return await this.query()
      .where('is_default', true)
      .where('is_active', true)
      .first();
  }

  // Set as default language
  async setAsDefault() {
    // Remove default from other languages
    await Language.query().patch({ is_default: false });
    
    // Set this as default
    return await this.$query().patch({ is_default: true });
  }

  // Get language by code
  static async getByCode(code) {
    return await this.query().findOne({ code, is_active: true });
  }
}

module.exports = Language;
