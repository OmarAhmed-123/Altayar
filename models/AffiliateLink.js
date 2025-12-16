const { Model } = require('objection');
const { nanoid } = require('nanoid');

class AffiliateLink extends Model {
  static get tableName() {
    return 'affiliate_links';
  }

  static get relationMappings() {
    const User = require('./User');
    const AffiliateCampaign = require('./AffiliateCampaign');
    const AffiliateReferral = require('./AffiliateReferral');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'affiliate_links.user_id',
          to: 'users.id'
        }
      },
      campaign: {
        relation: Model.BelongsToOneRelation,
        modelClass: AffiliateCampaign,
        join: {
          from: 'affiliate_links.campaign_id',
          to: 'affiliate_campaigns.id'
        }
      },
      referrals: {
        relation: Model.HasManyRelation,
        modelClass: AffiliateReferral,
        join: {
          from: 'affiliate_links.id',
          to: 'affiliate_referrals.affiliate_id'
        }
      }
    };
  }

  // Generate unique affiliate code
  static async generateAffiliateCode() {
    let code;
    let exists = true;
    
    while (exists) {
      code = nanoid(8).toUpperCase();
      const existing = await this.query().findOne({ affiliate_code: code });
      exists = !!existing;
    }
    
    return code;
  }

  // Create affiliate link for user
  static async createAffiliateLink(userId, campaignId, baseUrl) {
    const campaign = await AffiliateCampaign.query().findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (!campaign.isActive()) {
      throw new Error('Campaign is not active');
    }

    // Check if user already has an affiliate link for this campaign
    const existingLink = await this.query()
      .findOne({ user_id: userId, campaign_id: campaignId });
    
    if (existingLink) {
      return existingLink;
    }

    const affiliateCode = await this.generateAffiliateCode();
    const referralUrl = `${baseUrl}?ref=${affiliateCode}`;

    const affiliateLink = await this.query().insert({
      user_id: userId,
      campaign_id: campaignId,
      affiliate_code: affiliateCode,
      referral_url: referralUrl
    });

    return affiliateLink;
  }

  // Track click
  async trackClick() {
    return await this.$query().increment('clicks', 1);
  }

  // Track signup
  async trackSignup() {
    return await this.$query().increment('signups', 1);
  }

  // Track conversion
  async trackConversion() {
    return await this.$query().increment('conversions', 1);
  }

  // Add earnings
  async addEarnings(amount) {
    return await this.$query().increment('total_earnings', amount).increment('pending_earnings', amount);
  }

  // Mark earnings as paid
  async markEarningsAsPaid(amount) {
    return await this.$query()
      .increment('paid_earnings', amount)
      .decrement('pending_earnings', amount);
  }

  // Get affiliate statistics
  async getStatistics() {
    const referrals = await this.$relatedQuery('referrals');
    
    const stats = {
      clicks: this.clicks,
      signups: this.signups,
      conversions: this.conversions,
      total_earnings: parseFloat(this.total_earnings),
      pending_earnings: parseFloat(this.pending_earnings),
      paid_earnings: parseFloat(this.paid_earnings),
      total_referrals: referrals.length,
      pending_referrals: referrals.filter(r => r.status === 'pending').length,
      confirmed_referrals: referrals.filter(r => r.status === 'confirmed').length,
      paid_referrals: referrals.filter(r => r.status === 'paid').length
    };

    stats.conversion_rate = this.clicks > 0 ? (this.conversions / this.clicks * 100) : 0;
    stats.signup_rate = this.clicks > 0 ? (this.signups / this.clicks * 100) : 0;

    return stats;
  }

  // Get recent referrals
  async getRecentReferrals(limit = 10) {
    return await this.$relatedQuery('referrals')
      .withGraphFetched('referredUser(selectBasicInfo)')
      .modifiers({
        selectBasicInfo(builder) {
          builder.select('id', 'name', 'email');
        }
      })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }
}

module.exports = AffiliateLink;
