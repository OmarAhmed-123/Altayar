const { Model } = require('objection');

class MarketingCampaign extends Model {
  static get tableName() {
    return 'marketing_campaigns';
  }

  static get relationMappings() {
    const User = require('./User');
    const CampaignRecipient = require('./CampaignRecipient');
    return {
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'marketing_campaigns.created_by',
          to: 'users.id'
        }
      },
      recipients: {
        relation: Model.HasManyRelation,
        modelClass: CampaignRecipient,
        join: {
          from: 'marketing_campaigns.id',
          to: 'campaign_recipients.campaign_id'
        }
      }
    };
  }

  // Get campaign statistics
  async getStatistics() {
    const recipients = await this.$relatedQuery('recipients');
    
    const stats = {
      total_recipients: recipients.length,
      sent: recipients.filter(r => r.status === 'sent').length,
      delivered: recipients.filter(r => r.status === 'delivered').length,
      opened: recipients.filter(r => r.status === 'opened').length,
      clicked: recipients.filter(r => r.status === 'clicked').length,
      failed: recipients.filter(r => r.status === 'failed').length
    };

    stats.delivery_rate = stats.total_recipients > 0 ? (stats.delivered / stats.total_recipients * 100) : 0;
    stats.open_rate = stats.delivered > 0 ? (stats.opened / stats.delivered * 100) : 0;
    stats.click_rate = stats.opened > 0 ? (stats.clicked / stats.opened * 100) : 0;

    return stats;
  }

  // Get target users based on criteria
  static async getTargetUsers(criteria) {
    let query = User.query().where('role', 'customer');

    if (criteria.membership_id) {
      query = query.where('membership_id', criteria.membership_id);
    }

    if (criteria.min_points) {
      query = query.where('points', '>=', criteria.min_points);
    }

    if (criteria.max_points) {
      query = query.where('points', '<=', criteria.max_points);
    }

    if (criteria.registration_date_from) {
      query = query.where('created_at', '>=', new Date(criteria.registration_date_from));
    }

    if (criteria.registration_date_to) {
      query = query.where('created_at', '<=', new Date(criteria.registration_date_to));
    }

    if (criteria.last_activity_days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - criteria.last_activity_days);
      query = query.where('updated_at', '>=', cutoffDate);
    }

    if (criteria.has_bookings) {
      const Booking = require('./Booking');
      const usersWithBookings = await Booking.query()
        .select('user_id')
        .groupBy('user_id');
      
      const userIds = usersWithBookings.map(b => b.user_id);
      query = query.whereIn('id', userIds);
    }

    return await query;
  }

  // Schedule campaign
  async schedule(scheduledAt) {
    return await this.$query().patch({
      status: 'scheduled',
      scheduled_at: scheduledAt
    });
  }

  // Start campaign
  async start() {
    return await this.$query().patch({
      status: 'active',
      started_at: new Date()
    });
  }

  // Complete campaign
  async complete() {
    return await this.$query().patch({
      status: 'completed',
      completed_at: new Date()
    });
  }

  // Pause campaign
  async pause() {
    return await this.$query().patch({
      status: 'paused'
    });
  }
}

module.exports = MarketingCampaign;
