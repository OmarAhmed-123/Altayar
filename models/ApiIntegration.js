const { Model } = require('objection');

class ApiIntegration extends Model {
  static get tableName() {
    return 'api_integrations';
  }

  static get relationMappings() {
    const ApiLog = require('./ApiLog');
    return {
      logs: {
        relation: Model.HasManyRelation,
        modelClass: ApiLog,
        join: {
          from: 'api_integrations.id',
          to: 'api_logs.integration_id'
        }
      }
    };
  }

  // Get integration by service name
  static async getByServiceName(serviceName) {
    return await this.query().findOne({ service_name: serviceName, is_active: true });
  }

  // Check rate limit
  async checkRateLimit() {
    const now = new Date();
    
    // Reset counter if rate limit period has passed
    if (this.rate_limit_reset_at && now > this.rate_limit_reset_at) {
      await this.$query().patch({
        requests_made: 0,
        rate_limit_reset_at: new Date(now.getTime() + 60 * 60 * 1000) // Reset in 1 hour
      });
      this.requests_made = 0;
    }
    
    return this.requests_made < this.rate_limit;
  }

  // Increment request count
  async incrementRequestCount() {
    const now = new Date();
    
    if (!this.rate_limit_reset_at || now > this.rate_limit_reset_at) {
      await this.$query().patch({
        requests_made: 1,
        rate_limit_reset_at: new Date(now.getTime() + 60 * 60 * 1000),
        last_request_at: now
      });
    } else {
      await this.$query().patch({
        requests_made: this.requests_made + 1,
        last_request_at: now
      });
    }
  }

  // Log API request
  async logRequest(endpoint, method, requestData, responseData, statusCode, responseTime, errorMessage = null) {
    const ApiLog = require('./ApiLog');
    
    await ApiLog.query().insert({
      integration_id: this.id,
      endpoint,
      method,
      request_data: requestData,
      response_data: responseData,
      status_code: statusCode,
      status: errorMessage ? 'error' : 'success',
      response_time_ms: responseTime,
      error_message: errorMessage
    });
  }

  // Get service statistics
  async getStatistics(period = 30) {
    const { db } = require('../config/db');
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - period);

    const stats = await this.$relatedQuery('logs')
      .where('created_at', '>=', daysAgo)
      .groupBy('status')
      .select('status', db.raw('count(*)::int as count'));

    const totalRequests = await this.$relatedQuery('logs')
      .where('created_at', '>=', daysAgo)
      .resultSize();

    const averageResponseTime = await this.$relatedQuery('logs')
      .where('created_at', '>=', daysAgo)
      .where('status', 'success')
      .avg('response_time_ms as average')
      .first();

    return {
      total_requests: totalRequests,
      success_count: stats.find(s => s.status === 'success')?.count || 0,
      error_count: stats.find(s => s.status === 'error')?.count || 0,
      average_response_time: Math.round(parseFloat(averageResponseTime.average) || 0)
    };
  }
}

module.exports = ApiIntegration;
