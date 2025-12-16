const { Model } = require('objection');

class PackageAnalytics extends Model {
  static get tableName() {
    return 'package_analytics';
  }

  static get relationMappings() {
    const Package = require('./Package');
    const User = require('./User');
    return {
      package: {
        relation: Model.BelongsToOneRelation,
        modelClass: Package,
        join: {
          from: 'package_analytics.package_id',
          to: 'packages.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'package_analytics.user_id',
          to: 'users.id'
        }
      }
    };
  }

  // Track user interaction with package
  static async trackInteraction(packageId, userId, action, metadata = {}) {
    return await this.query().insert({
      package_id: packageId,
      user_id: userId,
      action,
      metadata,
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent
    });
  }

  // Get package popularity metrics
  static async getPackageMetrics(packageId, days = 30) {
    const { db } = require('../config/db');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await this.query()
      .where('package_id', packageId)
      .where('created_at', '>=', startDate)
      .groupBy('action')
      .select('action', db.raw('count(*)::int as count'));

    return metrics.reduce((acc, metric) => {
      acc[metric.action] = metric.count;
      return acc;
    }, {});
  }

  // Get trending packages
  static async getTrendingPackages(limit = 10, days = 7) {
    const { db } = require('../config/db');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.query()
      .where('created_at', '>=', startDate)
      .whereIn('action', ['view', 'like', 'book'])
      .groupBy('package_id')
      .select('package_id', db.raw('count(*)::int as interaction_count'))
      .orderBy('interaction_count', 'desc')
      .limit(limit)
      .withGraphFetched('package');
  }
}

module.exports = PackageAnalytics;
