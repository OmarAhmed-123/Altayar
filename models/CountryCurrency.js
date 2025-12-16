const { Model } = require('objection');

class CountryCurrency extends Model {
  static get tableName() {
    return 'country_currencies';
  }

  // Get currency by country code
  static async getCurrencyByCountry(countryCode) {
    return await this.query()
      .findOne({ country_code: countryCode });
  }

  // Get all country currencies
  static async getAllCountryCurrencies() {
    return await this.query()
      .orderBy('country_code', 'asc');
  }

  // Auto-detect currency based on location
  static async detectCurrencyFromLocation(latitude, longitude) {
    // This would typically use a geocoding service to get country from coordinates
    // For now, we'll return a default currency
    const defaultCurrency = await this.query()
      .findOne({ country_code: 'US' });
    
    return defaultCurrency;
  }

  // Get popular currencies (most used countries)
  static async getPopularCurrencies() {
    const { db } = require('../config/db');
    
    // Get currencies from countries with most users
    const popularCurrencies = await db.raw(`
      SELECT 
        cc.currency_code,
        COUNT(u.id) as user_count
      FROM country_currencies cc
      LEFT JOIN users u ON u.detected_country = cc.country_code
      GROUP BY cc.currency_code
      ORDER BY user_count DESC
      LIMIT 10
    `);

    return popularCurrencies.rows;
  }
}

module.exports = CountryCurrency;
