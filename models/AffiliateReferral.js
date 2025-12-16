const { Model } = require('objection');

class AffiliateReferral extends Model {
  static get tableName() {
    return 'affiliate_referrals';
  }

  static get relationMappings() {
    const AffiliateLink = require('./AffiliateLink');
    const User = require('./User');
    return {
      affiliateLink: {
        relation: Model.BelongsToOneRelation,
        modelClass: AffiliateLink,
        join: {
          from: 'affiliate_referrals.affiliate_id',
          to: 'affiliate_links.id'
        }
      },
      referredUser: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'affiliate_referrals.referred_user_id',
          to: 'users.id'
        }
      }
    };
  }

  // Create referral
  static async createReferral(affiliateId, referredUserId, referralType, commissionAmount, referralData = {}) {
    const referral = await this.query().insert({
      affiliate_id: affiliateId,
      referred_user_id: referredUserId,
      referral_type: referralType,
      commission_amount: commissionAmount,
      referral_data: referralData,
      status: 'pending'
    });

    // Add earnings to affiliate link
    const affiliateLink = await AffiliateLink.query().findById(affiliateId);
    await affiliateLink.addEarnings(commissionAmount);

    return referral;
  }

  // Confirm referral
  async confirm() {
    return await this.$query().patch({
      status: 'confirmed',
      confirmed_at: new Date()
    });
  }

  // Mark as paid
  async markAsPaid() {
    return await this.$query().patch({
      status: 'paid',
      paid_at: new Date()
    });
  }

  // Get referral summary
  getSummary() {
    return {
      id: this.id,
      referral_type: this.referral_type,
      commission_amount: this.commission_amount,
      status: this.status,
      created_at: this.created_at,
      confirmed_at: this.confirmed_at,
      paid_at: this.paid_at
    };
  }
}

module.exports = AffiliateReferral;
