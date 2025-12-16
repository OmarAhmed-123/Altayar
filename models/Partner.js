const { Model } = require('objection');
const { nanoid } = require('nanoid');

class Partner extends Model {
  static get tableName() {
    return 'partners';
  }

  static get relationMappings() {
    const User = require('./User');
    const PartnerService = require('./PartnerService');
    const PartnerBooking = require('./PartnerBooking');
    return {
      approver: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'partners.approved_by',
          to: 'users.id'
        }
      },
      services: {
        relation: Model.HasManyRelation,
        modelClass: PartnerService,
        join: {
          from: 'partners.id',
          to: 'partner_services.partner_id'
        }
      },
      bookings: {
        relation: Model.HasManyRelation,
        modelClass: PartnerBooking,
        join: {
          from: 'partners.id',
          to: 'partner_bookings.partner_id'
        }
      }
    };
  }

  // Generate API key
  static async generateApiKey() {
    let apiKey;
    let exists = true;
    
    while (exists) {
      apiKey = `pk_${nanoid(32)}`;
      const existing = await this.query().findOne({ api_key: apiKey });
      exists = !!existing;
    }
    
    return apiKey;
  }

  // Approve partner
  async approve(approvedBy) {
    const apiKey = await Partner.generateApiKey();
    
    return await this.$query().patch({
      status: 'approved',
      approved_at: new Date(),
      approved_by: approvedBy,
      api_key: apiKey
    });
  }

  // Suspend partner
  async suspend() {
    return await this.$query().patch({
      status: 'suspended'
    });
  }

  // Reject partner
  async reject() {
    return await this.$query().patch({
      status: 'rejected'
    });
  }

  // Get partner statistics
  async getStatistics() {
    const { db } = require('../config/db');
    
    // Total bookings
    const totalBookings = await this.$relatedQuery('bookings').resultSize();
    
    // Total revenue
    const totalRevenue = await this.$relatedQuery('bookings')
      .sum('total_amount as total')
      .first();
    
    // Total commission
    const totalCommission = await this.$relatedQuery('bookings')
      .sum('commission_amount as total')
      .first();
    
    // Bookings by status
    const bookingsByStatus = await this.$relatedQuery('bookings')
      .groupBy('status')
      .select('status', db.raw('count(*)::int as count'));
    
    // Recent bookings
    const recentBookings = await this.$relatedQuery('bookings')
      .orderBy('created_at', 'desc')
      .limit(10)
      .withGraphFetched('[user(selectBasicInfo), service]')
      .modifiers({
        selectBasicInfo(builder) {
          builder.select('id', 'name', 'email');
        }
      });

    return {
      total_bookings: totalBookings,
      total_revenue: parseFloat(totalRevenue.total) || 0,
      total_commission: parseFloat(totalCommission.total) || 0,
      bookings_by_status: bookingsByStatus,
      recent_bookings: recentBookings
    };
  }

  // Check if partner is active
  isActive() {
    return this.status === 'approved';
  }

  // Get commission for amount
  getCommission(amount) {
    return (amount * this.commission_rate) / 100;
  }
}

module.exports = Partner;
