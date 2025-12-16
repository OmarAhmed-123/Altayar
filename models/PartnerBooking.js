const { Model } = require('objection');
const { nanoid } = require('nanoid');

class PartnerBooking extends Model {
  static get tableName() {
    return 'partner_bookings';
  }

  static get relationMappings() {
    const Partner = require('./Partner');
    const PartnerService = require('./PartnerService');
    const User = require('./User');
    return {
      partner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Partner,
        join: {
          from: 'partner_bookings.partner_id',
          to: 'partners.id'
        }
      },
      service: {
        relation: Model.BelongsToOneRelation,
        modelClass: PartnerService,
        join: {
          from: 'partner_bookings.service_id',
          to: 'partner_services.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'partner_bookings.user_id',
          to: 'users.id'
        }
      }
    };
  }

  // Generate booking reference
  static async generateBookingReference() {
    let reference;
    let exists = true;
    
    while (exists) {
      reference = `PB${Date.now().toString().slice(-8)}${nanoid(4).toUpperCase()}`;
      const existing = await this.query().findOne({ booking_reference: reference });
      exists = !!existing;
    }
    
    return reference;
  }

  // Create booking
  static async createBooking(partnerId, serviceId, userId, bookingDetails, totalAmount) {
    const Partner = require('./Partner');
    const PartnerService = require('./PartnerService');
    
    // Get partner and service
    const partner = await Partner.query().findById(partnerId);
    const service = await PartnerService.query().findById(serviceId);
    
    if (!partner || !service) {
      throw new Error('Partner or service not found');
    }
    
    if (!partner.isActive()) {
      throw new Error('Partner is not active');
    }
    
    if (!service.isAvailable()) {
      throw new Error('Service is not available');
    }
    
    // Calculate commission
    const commissionAmount = partner.getCommission(totalAmount);
    
    // Generate booking reference
    const bookingReference = await this.generateBookingReference();
    
    // Create booking
    const booking = await this.query().insert({
      partner_id: partnerId,
      service_id: serviceId,
      user_id: userId,
      booking_reference: bookingReference,
      total_amount: totalAmount,
      commission_amount: commissionAmount,
      booking_details: bookingDetails,
      service_date: bookingDetails.service_date ? new Date(bookingDetails.service_date) : null
    });
    
    // Update service quantity if needed
    if (bookingDetails.quantity) {
      await service.updateQuantity(bookingDetails.quantity);
    }
    
    return booking;
  }

  // Confirm booking
  async confirm() {
    return await this.$query().patch({
      status: 'confirmed',
      confirmed_at: new Date()
    });
  }

  // Complete booking
  async complete() {
    return await this.$query().patch({
      status: 'completed',
      completed_at: new Date()
    });
  }

  // Cancel booking
  async cancel() {
    return await this.$query().patch({
      status: 'cancelled'
    });
  }

  // Get booking summary
  getSummary() {
    return {
      id: this.id,
      booking_reference: this.booking_reference,
      status: this.status,
      total_amount: this.total_amount,
      commission_amount: this.commission_amount,
      service_date: this.service_date,
      created_at: this.created_at
    };
  }
}

module.exports = PartnerBooking;
