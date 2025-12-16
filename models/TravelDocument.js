const { Model } = require('objection');

class TravelDocument extends Model {
  static get tableName() {
    return 'travel_documents';
  }

  static get relationMappings() {
    const User = require('./User');
    const Itinerary = require('./Itinerary');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'travel_documents.user_id',
          to: 'users.id'
        }
      },
      itinerary: {
        relation: Model.BelongsToOneRelation,
        modelClass: Itinerary,
        join: {
          from: 'travel_documents.itinerary_id',
          to: 'itineraries.id'
        }
      }
    };
  }

  // Get documents by type for user
  static async getByType(userId, documentType) {
    return await this.query()
      .where('user_id', userId)
      .where('document_type', documentType)
      .orderBy('created_at', 'desc');
  }

  // Get expiring documents
  static async getExpiringDocuments(userId, daysAhead = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    return await this.query()
      .where('user_id', userId)
      .where('expiry_date', '<=', expiryDate)
      .where('expiry_date', '>', new Date())
      .orderBy('expiry_date', 'asc');
  }

  // Get expired documents
  static async getExpiredDocuments(userId) {
    return await this.query()
      .where('user_id', userId)
      .where('expiry_date', '<', new Date())
      .orderBy('expiry_date', 'desc');
  }

  // Check if document is expiring soon
  isExpiringSoon(daysAhead = 30) {
    if (!this.expiry_date) return false;
    
    const expiryDate = new Date(this.expiry_date);
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + daysAhead);
    
    return expiryDate <= warningDate && expiryDate > new Date();
  }

  // Check if document is expired
  isExpired() {
    if (!this.expiry_date) return false;
    return new Date(this.expiry_date) < new Date();
  }

  // Get document status
  getStatus() {
    if (this.isExpired()) return 'expired';
    if (this.isExpiringSoon()) return 'expiring_soon';
    return 'valid';
  }
}

module.exports = TravelDocument;
