const { Model } = require('objection');

class PartnerService extends Model {
  static get tableName() {
    return 'partner_services';
  }

  static get relationMappings() {
    const Partner = require('./Partner');
    const PartnerBooking = require('./PartnerBooking');
    return {
      partner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Partner,
        join: {
          from: 'partner_services.partner_id',
          to: 'partners.id'
        }
      },
      bookings: {
        relation: Model.HasManyRelation,
        modelClass: PartnerBooking,
        join: {
          from: 'partner_services.id',
          to: 'partner_bookings.service_id'
        }
      }
    };
  }

  // Check if service is available
  isAvailable() {
    if (!this.is_active) return false;
    
    const now = new Date();
    
    if (this.valid_from && new Date(this.valid_from) > now) return false;
    if (this.valid_until && new Date(this.valid_until) < now) return false;
    
    if (this.available_quantity !== -1 && this.available_quantity <= 0) return false;
    
    return true;
  }

  // Get available quantity
  async getAvailableQuantity() {
    if (this.available_quantity === -1) return -1; // Unlimited
    
    const confirmedBookings = await this.$relatedQuery('bookings')
      .whereIn('status', ['confirmed', 'completed'])
      .sum('booking_details->quantity as total_booked')
      .first();
    
    const totalBooked = parseInt(confirmedBookings.total_booked) || 0;
    return Math.max(0, this.available_quantity - totalBooked);
  }

  // Update quantity after booking
  async updateQuantity(quantity) {
    if (this.available_quantity === -1) return; // Unlimited
    
    const newQuantity = Math.max(0, this.available_quantity - quantity);
    await this.$query().patch({ available_quantity: newQuantity });
  }

  // Get service statistics
  async getStatistics() {
    const { db } = require('../config/db');
    
    // Total bookings
    const totalBookings = await this.$relatedQuery('bookings').resultSize();
    
    // Total revenue
    const totalRevenue = await this.$relatedQuery('bookings')
      .sum('total_amount as total')
      .first();
    
    // Bookings by status
    const bookingsByStatus = await this.$relatedQuery('bookings')
      .groupBy('status')
      .select('status', db.raw('count(*)::int as count'));
    
    // Recent bookings
    const recentBookings = await this.$relatedQuery('bookings')
      .orderBy('created_at', 'desc')
      .limit(5)
      .withGraphFetched('user(selectBasicInfo)')
      .modifiers({
        selectBasicInfo(builder) {
          builder.select('id', 'name', 'email');
        }
      });

    return {
      total_bookings: totalBookings,
      total_revenue: parseFloat(totalRevenue.total) || 0,
      bookings_by_status: bookingsByStatus,
      recent_bookings: recentBookings
    };
  }
}

module.exports = PartnerService;
