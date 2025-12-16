const { Model } = require('objection');

class Currency extends Model {
  static get tableName() {
    return 'currencies';
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      users: {
        relation: Model.HasManyRelation,
        modelClass: User,
        join: {
          from: 'currencies.id',
          to: 'users.currency_id'
        }
      }
    };
  }

  // Get active currencies
  static async getActiveCurrencies() {
    return await this.query()
      .where('is_active', true)
      .orderBy('is_default', 'desc')
      .orderBy('code', 'asc');
  }

  // Get default currency
  static async getDefaultCurrency() {
    return await this.query()
      .where('is_default', true)
      .where('is_active', true)
      .first();
  }

  // Set as default currency
  async setAsDefault() {
    // Remove default from other currencies
    await Currency.query().patch({ is_default: false });
    
    // Set this as default
    return await this.$query().patch({ is_default: true });
  }

  // Get currency by code
  static async getByCode(code) {
    return await this.query().findOne({ code, is_active: true });
  }

  // Convert amount from one currency to another
  static async convertAmount(amount, fromCurrencyCode, toCurrencyCode) {
    if (fromCurrencyCode === toCurrencyCode) {
      return amount;
    }

    const fromCurrency = await this.getByCode(fromCurrencyCode);
    const toCurrency = await this.getByCode(toCurrencyCode);

    if (!fromCurrency || !toCurrency) {
      throw new Error('Currency not found');
    }

    // Convert to base currency first, then to target currency
    const baseAmount = amount / fromCurrency.exchange_rate;
    const convertedAmount = baseAmount * toCurrency.exchange_rate;

    return Math.round(convertedAmount * Math.pow(10, toCurrency.decimal_places)) / Math.pow(10, toCurrency.decimal_places);
  }

  // Format amount with currency
  formatAmount(amount) {
    const formattedAmount = amount.toFixed(this.decimal_places);
    
    if (this.position === 'before') {
      return `${this.symbol}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${this.symbol}`;
    }
  }

  // Update exchange rates (would typically be called by a scheduled job)
  static async updateExchangeRates(rates) {
    const updates = Object.entries(rates).map(([code, rate]) => ({
      code,
      exchange_rate: rate
    }));

    for (const update of updates) {
      await this.query().where('code', update.code).patch({
        exchange_rate: update.exchange_rate
      });
    }
  }
}

module.exports = Currency;
