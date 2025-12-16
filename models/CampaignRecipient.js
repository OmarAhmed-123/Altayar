const { Model } = require('objection');

class CampaignRecipient extends Model {
  static get tableName() {
    return 'campaign_recipients';
  }

  static get relationMappings() {
    const MarketingCampaign = require('./MarketingCampaign');
    const User = require('./User');
    return {
      campaign: {
        relation: Model.BelongsToOneRelation,
        modelClass: MarketingCampaign,
        join: {
          from: 'campaign_recipients.campaign_id',
          to: 'marketing_campaigns.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'campaign_recipients.user_id',
          to: 'users.id'
        }
      }
    };
  }

  // Mark as sent
  async markAsSent() {
    return await this.$query().patch({
      status: 'sent',
      sent_at: new Date()
    });
  }

  // Mark as delivered
  async markAsDelivered() {
    return await this.$query().patch({
      status: 'delivered',
      delivered_at: new Date()
    });
  }

  // Mark as opened
  async markAsOpened() {
    return await this.$query().patch({
      status: 'opened',
      opened_at: new Date()
    });
  }

  // Mark as clicked
  async markAsClicked() {
    return await this.$query().patch({
      status: 'clicked',
      clicked_at: new Date()
    });
  }

  // Mark as failed
  async markAsFailed(errorMessage) {
    return await this.$query().patch({
      status: 'failed',
      error_message: errorMessage
    });
  }
}

module.exports = CampaignRecipient;
