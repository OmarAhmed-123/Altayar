const { Model } = require('objection');

class ApiLog extends Model {
  static get tableName() {
    return 'api_logs';
  }

  static get relationMappings() {
    const ApiIntegration = require('./ApiIntegration');
    return {
      integration: {
        relation: Model.BelongsToOneRelation,
        modelClass: ApiIntegration,
        join: {
          from: 'api_logs.integration_id',
          to: 'api_integrations.id'
        }
      }
    };
  }

  // Get recent logs
  static async getRecentLogs(limit = 100) {
    return await this.query()
      .withGraphFetched('integration(selectBasicInfo)')
      .modifiers({
        selectBasicInfo(builder) {
          builder.select('id', 'service_name', 'service_type');
        }
      })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  // Get error logs
  static async getErrorLogs(limit = 50) {
    return await this.query()
      .where('status', 'error')
      .withGraphFetched('integration(selectBasicInfo)')
      .modifiers({
        selectBasicInfo(builder) {
          builder.select('id', 'service_name', 'service_type');
        }
      })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  // Get logs by integration
  static async getLogsByIntegration(integrationId, limit = 100) {
    return await this.query()
      .where('integration_id', integrationId)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }
}

module.exports = ApiLog;
