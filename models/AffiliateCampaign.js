const { Model } = require('objection');

class AffiliateCampaign extends Model {
  static get tableName() {
    return 'affiliate_campaigns';
  }

  static get relationMappings() {
    const User = require('./User');
    const AffiliateLink = require('./AffiliateLink');
    return {
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'affiliate_campaigns.created_by',
          to: 'users.id'
        }
      },
      affiliateLinks: {
        relation: Model.HasManyRelation,
        modelClass: AffiliateLink,
        join: {
          from: 'affiliate_campaigns.id',
          to: 'affiliate_links.campaign_id'
        }
      }
    };
  }

  // Check if campaign is active
  isActive() {
    if (this.status !== 'active') return false;
    
    const now = new Date();
    if (this.start_date && new Date(this.start_date) > now) return false;
    if (this.end_date && new Date(this.end_date) < now) return false;
    
    return true;
  }

  // Get campaign statistics
  async getStatistics() {
    const affiliateLinks = await this.$relatedQuery('affiliateLinks');
    
    const stats = {
      total_affiliates: affiliateLinks.length,
      active_affiliates: affiliateLinks.filter(link => link.is_active).length,
      total_clicks: affiliateLinks.reduce((sum, link) => sum + link.clicks, 0),
      total_signups: affiliateLinks.reduce((sum, link) => sum + link.signups, 0),
      total_conversions: affiliateLinks.reduce((sum, link) => sum + link.conversions, 0),
      total_earnings: affiliateLinks.reduce((sum, link) => sum + parseFloat(link.total_earnings), 0),
      pending_earnings: affiliateLinks.reduce((sum, link) => sum + parseFloat(link.pending_earnings), 0),
      paid_earnings: affiliateLinks.reduce((sum, link) => sum + parseFloat(link.paid_earnings), 0)
    };

    stats.conversion_rate = stats.total_clicks > 0 ? (stats.total_conversions / stats.total_clicks * 100) : 0;
    stats.signup_rate = stats.total_clicks > 0 ? (stats.total_signups / stats.total_clicks * 100) : 0;

    return stats;
  }

  // Check if user can participate
  async canUserParticipate(user) {
    if (!this.isActive()) return false;
    
    const criteria = this.target_criteria;
    
    // Check membership requirements
    if (criteria.required_membership && user.membership_id !== criteria.required_membership) {
      return false;
    }
    
    // Check minimum points
    if (criteria.min_points && user.points < criteria.min_points) {
      return false;
    }
    
    // Check user role
    if (criteria.allowed_roles && !criteria.allowed_roles.includes(user.role)) {
      return false;
    }
    
    return true;
  }

  // Calculate commission for amount
  calculateCommission(amount) {
    return (amount * this.commission_rate) / 100;
  }
}

module.exports = AffiliateCampaign;
