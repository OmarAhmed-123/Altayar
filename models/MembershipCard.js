const { Model } = require('objection');
const { nanoid } = require('nanoid');

class MembershipCard extends Model {
  static get tableName() {
    return 'membership_cards';
  }

  static get relationMappings() {
    const User = require('./User');
    const Membership = require('./Membership');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'membership_cards.user_id',
          to: 'users.id'
        }
      },
      membership: {
        relation: Model.BelongsToOneRelation,
        modelClass: Membership,
        join: {
          from: 'membership_cards.membership_id',
          to: 'memberships.id'
        }
      }
    };
  }

  // Generate unique card number
  static async generateCardNumber() {
    let cardNumber;
    let exists = true;
    
    while (exists) {
      cardNumber = `MC${Date.now().toString().slice(-8)}${nanoid(4).toUpperCase()}`;
      const existing = await this.query().findOne({ card_number: cardNumber });
      exists = !!existing;
    }
    
    return cardNumber;
  }

  // Generate QR code
  // CRITICAL FIX: Handle case where qr_code column might not exist
  static async generateQRCode() {
    let qrCode;
    let exists = true;
    
    while (exists) {
      qrCode = nanoid(16);
      
      // Try to check if QR code exists, but handle gracefully if column doesn't exist
      try {
        const existing = await this.query().findOne({ qr_code: qrCode });
        exists = !!existing;
      } catch (error) {
        // If column doesn't exist, log warning and generate a code anyway
        if (error.message && error.message.includes('qr_code')) {
          console.warn(`⚠️ [MembershipCard] qr_code column not found. Please run migration: npm run migrate:latest`);
          // Generate a code without checking uniqueness
          exists = false;
        } else {
          // Re-throw if it's a different error
          throw error;
        }
      }
    }
    
    return qrCode;
  }

  // Create membership card for user
  // CRITICAL FIX: Removed status field - table doesn't have status column
  static async createCard(userId, membershipId, cardDesign = {}) {
    const cardNumber = await this.generateCardNumber();
    const qrCode = await this.generateQRCode();
    
    // Get membership to calculate expiry date
    const Membership = require('./Membership');
    const membership = await Membership.query().findById(membershipId);
    const expiryDate = membership ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null; // 1 year default
    
    // CRITICAL FIX: Handle case where qr_code and card_design columns might not exist
    const cardData = {
      user_id: userId,
      membership_id: membershipId,
      card_number: cardNumber,
      issue_date: new Date(),
      expiry_date: expiryDate, // Use expiry_date instead of status
      pdf_url: '' // Will be set after PDF generation
    };
    
    // Only add optional columns if they exist in the table
    // Try to insert with all optional fields first
    try {
      cardData.qr_code = qrCode;
      // card_design is not in the table schema, so we skip it
      // If needed, it can be stored in a JSONB column or separate table
      const card = await this.query().insert(cardData);
      return card;
    } catch (insertError) {
      // If qr_code column doesn't exist, use qr_code_url instead
      if (insertError.message && insertError.message.includes('qr_code')) {
        console.warn(`⚠️ [MembershipCard] qr_code column not found, using qr_code_url instead`);
        delete cardData.qr_code;
        cardData.qr_code_url = `/qr/${qrCode}`; // Store QR code as URL path
        
        try {
          const card = await this.query().insert(cardData);
          return card;
        } catch (secondError) {
          // If card_design or other column error, remove it and try again
          if (secondError.message && (secondError.message.includes('card_design') || secondError.message.includes('does not exist'))) {
            console.warn(`⚠️ [MembershipCard] Some columns not found, using minimal schema`);
            // cardData already doesn't have card_design, so just try again
            const card = await this.query().insert(cardData);
            return card;
          } else {
            throw secondError;
          }
        }
      } else if (insertError.message && insertError.message.includes('card_design')) {
        // If only card_design is the issue, remove it and try again
        console.warn(`⚠️ [MembershipCard] card_design column not found, skipping it`);
        // cardData already doesn't have card_design, so just try again
        const card = await this.query().insert(cardData);
        return card;
      } else {
        // Re-throw if it's a different error
        throw insertError;
      }
    }
  }

  // Get user's membership card
  // CRITICAL FIX: Removed status column check - table doesn't have status column
  // Using expiry_date to determine if card is active
  // IMPORTANT: This method does NOT use 'status' column - it was removed from the table
  static async getUserCard(userId) {
    try {
      // CRITICAL: Do NOT use .where('status', 'active') - status column doesn't exist
      // Get the most recent card for the user (regardless of expiry)
      // We'll check expiry_date in the application logic, not in the query
      const card = await this.query()
        .where('user_id', userId)
        // CRITICAL: NO .where('status', 'active') here - status column doesn't exist
        .withGraphFetched('[user(selectBasicInfo), membership]')
        .modifiers({
          selectBasicInfo(builder) {
            builder.select('id', 'name', 'email', 'profile_picture_url', 'points', 'cashback');
          }
        })
        .orderBy('issue_date', 'desc')
        .first();
      
      // If card exists, check if it's still valid (expiry_date is null or in the future)
      if (card && card.expiry_date) {
        const expiryDate = new Date(card.expiry_date);
        const now = new Date();
        if (expiryDate < now) {
          // Card has expired, return null
          return null;
        }
      }
      
      return card;
    } catch (error) {
      console.error('❌ [MembershipCard.getUserCard] Error:', error.message);
      console.error('❌ [MembershipCard.getUserCard] Stack:', error.stack);
      // Re-throw with more context
      throw new Error(`Failed to get membership card: ${error.message}`);
    }
  }

  // CRITICAL FIX: Removed updateStatus - table doesn't have status column
  // Use expiry_date to manage card validity instead

  // Check if card is valid
  isValid() {
    // Card is valid if expiry_date is null or in the future
    if (this.expiry_date && new Date(this.expiry_date) < new Date()) return false;
    return true;
  }

  // Get card data for PDF generation
  getCardData() {
    // CRITICAL FIX: Handle both qr_code and qr_code_url
    const qrCode = this.qr_code || (this.qr_code_url ? this.qr_code_url.split('/').pop() : null);
    
    // CRITICAL FIX: card_design column doesn't exist in table, so we return empty object
    const cardDesign = this.card_design || {};
    
    return {
      card_number: this.card_number,
      qr_code: qrCode,
      qr_code_url: this.qr_code_url || (qrCode ? `/qr/${qrCode}` : null),
      issue_date: this.issue_date,
      expiry_date: this.expiry_date,
      is_valid: this.isValid(), // Use isValid() instead of status
      design: cardDesign // Return empty object if card_design doesn't exist
    };
  }
}

module.exports = MembershipCard;
