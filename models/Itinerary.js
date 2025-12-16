const { Model } = require('objection');
const { nanoid } = require('nanoid');

class Itinerary extends Model {
  static get tableName() {
    return 'itineraries';
  }

  static get relationMappings() {
    const User = require('./User');
    const Booking = require('./Booking');
    const TravelDocument = require('./TravelDocument');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'itineraries.user_id',
          to: 'users.id'
        }
      },
      booking: {
        relation: Model.BelongsToOneRelation,
        modelClass: Booking,
        join: {
          from: 'itineraries.booking_id',
          to: 'bookings.id'
        }
      },
      documents: {
        relation: Model.HasManyRelation,
        modelClass: TravelDocument,
        join: {
          from: 'itineraries.id',
          to: 'travel_documents.itinerary_id'
        }
      }
    };
  }

  // Generate share code for itinerary
  static async generateShareCode() {
    let shareCode;
    let exists = true;
    
    while (exists) {
      shareCode = nanoid(8);
      const existing = await this.query().findOne({ share_code: shareCode });
      exists = !!existing;
    }
    
    return shareCode;
  }

  // Create itinerary from booking
  static async createFromBooking(bookingId, userId, additionalData = {}) {
    const Booking = require('./Booking');
    const booking = await Booking.query()
      .findById(bookingId)
      .where('user_id', userId)
      .first();

    if (!booking) {
      throw new Error('Booking not found');
    }

    const shareCode = await this.generateShareCode();
    
    const itineraryData = {
      user_id: userId,
      booking_id: bookingId,
      title: additionalData.title || `Trip to ${booking.details.destination || 'Unknown'}`,
      description: additionalData.description || `Itinerary for ${booking.booking_type} booking`,
      start_date: additionalData.start_date || new Date(),
      end_date: additionalData.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      destinations: booking.details.destinations || [],
      activities: additionalData.activities || [],
      accommodations: additionalData.accommodations || [],
      transportation: additionalData.transportation || [],
      documents: [],
      emergency_contacts: additionalData.emergency_contacts || [],
      checklist: additionalData.checklist || [],
      share_code: shareCode
    };

    return await this.query().insert(itineraryData);
  }

  // Get shared itinerary by code
  static async getSharedItinerary(shareCode) {
    return await this.query()
      .findOne({ share_code: shareCode, is_shared: true })
      .withGraphFetched('[user(selectBasicInfo), documents]')
      .modifiers({
        selectBasicInfo(builder) {
          builder.select('id', 'name', 'email');
        }
      });
  }

  // Add document to itinerary
  async addDocument(documentData) {
    const TravelDocument = require('./TravelDocument');
    
    const document = await TravelDocument.query().insert({
      user_id: this.user_id,
      itinerary_id: this.id,
      ...documentData
    });

    // Update documents array in itinerary
    const documents = this.documents || [];
    documents.push({
      id: document.id,
      type: document.document_type,
      name: document.document_name,
      path: document.file_path
    });

    await this.$query().patch({ documents });

    return document;
  }

  // Update checklist item
  async updateChecklist(itemId, completed) {
    const checklist = this.checklist || [];
    const itemIndex = checklist.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
      checklist[itemIndex].completed = completed;
      checklist[itemIndex].completed_at = completed ? new Date() : null;
      
      await this.$query().patch({ checklist });
    }
    
    return checklist;
  }

  // Get itinerary summary
  getSummary() {
    return {
      id: this.id,
      title: this.title,
      start_date: this.start_date,
      end_date: this.end_date,
      destinations: this.destinations,
      total_days: Math.ceil((new Date(this.end_date) - new Date(this.start_date)) / (1000 * 60 * 60 * 24)),
      activities_count: this.activities?.length || 0,
      documents_count: this.documents?.length || 0,
      checklist_completed: this.checklist?.filter(item => item.completed).length || 0,
      checklist_total: this.checklist?.length || 0
    };
  }
}

module.exports = Itinerary;
