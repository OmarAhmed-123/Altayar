const { Model } = require('objection');

class Translation extends Model {
  static get tableName() {
    return 'translations';
  }

  static get relationMappings() {
    const Language = require('./Language');
    return {
      language: {
        relation: Model.BelongsToOneRelation,
        modelClass: Language,
        join: {
          from: 'translations.language_code',
          to: 'languages.code'
        }
      }
    };
  }

  // Get translation by key and language
  static async getTranslation(key, languageCode) {
    const translation = await this.query()
      .findOne({ key, language_code: languageCode });
    
    return translation ? translation.value : key; // Return key if translation not found
  }

  // Get all translations for a language
  static async getTranslationsForLanguage(languageCode, category = null) {
    let query = this.query().where('language_code', languageCode);
    
    if (category) {
      query = query.where('category', category);
    }
    
    const translations = await query;
    
    // Convert to key-value object
    return translations.reduce((acc, translation) => {
      acc[translation.key] = translation.value;
      return acc;
    }, {});
  }

  // Set translation
  static async setTranslation(key, languageCode, value, category = 'general') {
    const existing = await this.query()
      .findOne({ key, language_code: languageCode });
    
    if (existing) {
      return await existing.$query().patch({ value, category });
    } else {
      return await this.query().insert({
        key,
        language_code: languageCode,
        value,
        category
      });
    }
  }

  // Bulk set translations
  static async setTranslations(languageCode, translations, category = 'general') {
    const operations = Object.entries(translations).map(([key, value]) => ({
      key,
      language_code: languageCode,
      value,
      category
    }));

    for (const operation of operations) {
      await this.setTranslation(operation.key, operation.language_code, operation.value, operation.category);
    }
  }

  // Get missing translations for a language
  static async getMissingTranslations(languageCode, referenceLanguageCode = 'en') {
    const referenceTranslations = await this.getTranslationsForLanguage(referenceLanguageCode);
    const targetTranslations = await this.getTranslationsForLanguage(languageCode);
    
    const missing = [];
    for (const key of Object.keys(referenceTranslations)) {
      if (!targetTranslations[key]) {
        missing.push({
          key,
          reference_value: referenceTranslations[key]
        });
      }
    }
    
    return missing;
  }

  // Get translation statistics
  static async getTranslationStats() {
    const { db } = require('../config/db');
    
    const stats = await this.query()
      .groupBy('language_code')
      .select('language_code', db.raw('count(*)::int as count'));
    
    return stats;
  }
}

module.exports = Translation;
