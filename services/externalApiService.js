const axios = require('axios');
const ApiIntegration = require('../models/ApiIntegration');
const ApiLog = require('../models/ApiLog');

class ExternalApiService {
  constructor() {
    this.integrations = new Map();
    this.rateLimiters = new Map();
  }

  // Initialize service with cached integrations
  async initialize() {
    try {
      // Check if database is available before querying
      const { db } = require('../config/db');
      try {
        await db.raw('SELECT 1 as test');
      } catch (dbError) {
        // Database not available - skip initialization
        console.warn('⚠️  [External API] Database not available, skipping integration initialization');
        console.warn('⚠️  [External API] External API service will work with default configurations');
        return;
      }

      // Check if ApiIntegration table exists
      const hasTable = await db.schema.hasTable('api_integrations');
      if (!hasTable) {
        console.warn('⚠️  [External API] api_integrations table not found, using default configurations');
        return;
      }

      const integrations = await ApiIntegration.query().where('is_active', true);
      this.integrations.clear();
      
      integrations.forEach(integration => {
        this.integrations.set(integration.service_name, integration);
      });
      
      console.log(`✅ [External API] Initialized ${integrations.length} external API integrations`);
    } catch (error) {
      // Don't fail if database is not available - service can work with defaults
      if (error.code === 'ECONNREFUSED' || error.message.includes('refused')) {
        console.warn('⚠️  [External API] Database not available, using default configurations');
      } else {
        console.error('⚠️  [External API] Failed to initialize external API service:', error.message);
      }
    }
  }

  // Get integration by service name
  getIntegration(serviceName) {
    return this.integrations.get(serviceName);
  }

  // Log API call
  async logApiCall(integrationId, endpoint, method, status, responseTime, error = null) {
    try {
      await ApiLog.query().insert({
        integration_id: integrationId,
        endpoint,
        method,
        status,
        response_time: responseTime,
        error_message: error?.message || null,
        timestamp: new Date()
      });
    } catch (logError) {
      console.error('Failed to log API call:', logError);
    }
  }

  // Make generic API request
  async makeRequest(serviceName, endpoint, method = 'GET', data = null) {
    const integration = this.getIntegration(serviceName);
    if (!integration) {
      throw new Error(`Integration not found for service: ${serviceName}`);
    }

    const startTime = Date.now();
    let status = 'success';
    let error = null;

    try {
      const config = {
        method,
        url: `${integration.base_url}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${integration.api_key}`
        },
        timeout: 30000
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      const response = await axios(config);
      const responseTime = Date.now() - startTime;

      await this.logApiCall(integration.id, endpoint, method, status, responseTime);

      return response.data;
    } catch (err) {
      status = 'error';
      error = err;
      const responseTime = Date.now() - startTime;

      await this.logApiCall(integration.id, endpoint, method, status, responseTime, error);

      throw new Error(`API request failed: ${err.message}`);
    }
  }

  // Google Maps API methods
  async getPlaceDetails(placeId) {
    const integration = this.getIntegration('google_maps');
    if (!integration) {
      throw new Error('Google Maps integration not configured');
    }

    const startTime = Date.now();
    let status = 'success';
    let error = null;

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${integration.api_key}`
      );

      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/place/details', 'GET', status, responseTime);

      return response.data;
    } catch (err) {
      status = 'error';
      error = err;
      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/place/details', 'GET', status, responseTime, error);
      throw new Error(`Failed to get place details: ${err.message}`);
    }
  }

  async getDirections(origin, destination, mode = 'driving') {
    const integration = this.getIntegration('google_maps');
    if (!integration) {
      throw new Error('Google Maps integration not configured');
    }

    const startTime = Date.now();
    let status = 'success';
    let error = null;

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&key=${integration.api_key}`
      );

      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/directions', 'GET', status, responseTime);

      return response.data;
    } catch (err) {
      status = 'error';
      error = err;
      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/directions', 'GET', status, responseTime, error);
      throw new Error(`Failed to get directions: ${err.message}`);
    }
  }

  async geocodeAddress(address) {
    const integration = this.getIntegration('google_maps');
    if (!integration) {
      throw new Error('Google Maps integration not configured');
    }

    const startTime = Date.now();
    let status = 'success';
    let error = null;

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${integration.api_key}`
      );

      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/geocode', 'GET', status, responseTime);

      return response.data;
    } catch (err) {
      status = 'error';
      error = err;
      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/geocode', 'GET', status, responseTime, error);
      throw new Error(`Failed to geocode address: ${err.message}`);
    }
  }

  // Weather API methods
  async getCurrentWeather(lat, lon) {
    const integration = this.getIntegration('openweather');
    if (!integration) {
      throw new Error('OpenWeather integration not configured');
    }

    const startTime = Date.now();
    let status = 'success';
    let error = null;

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${integration.api_key}&units=metric`
      );

      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/weather', 'GET', status, responseTime);

      return response.data;
    } catch (err) {
      status = 'error';
      error = err;
      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/weather', 'GET', status, responseTime, error);
      throw new Error(`Failed to get current weather: ${err.message}`);
    }
  }

  async getWeatherForecast(lat, lon, days = 5) {
    const integration = this.getIntegration('openweather');
    if (!integration) {
      throw new Error('OpenWeather integration not configured');
    }

    const startTime = Date.now();
    let status = 'success';
    let error = null;

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${integration.api_key}&units=metric&cnt=${days * 8}`
      );

      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/forecast', 'GET', status, responseTime);

      return response.data;
    } catch (err) {
      status = 'error';
      error = err;
      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/forecast', 'GET', status, responseTime, error);
      throw new Error(`Failed to get weather forecast: ${err.message}`);
    }
  }

  // Currency API methods
  async getExchangeRate(from, to) {
    const integration = this.getIntegration('exchangerate');
    if (!integration) {
      throw new Error('Exchange rate integration not configured');
    }

    const startTime = Date.now();
    let status = 'success';
    let error = null;

    try {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`
      );

      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/latest', 'GET', status, responseTime);

      return {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate: response.data.rates[to.toUpperCase()],
        date: response.data.date
      };
    } catch (err) {
      status = 'error';
      error = err;
      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/latest', 'GET', status, responseTime, error);
      throw new Error(`Failed to get exchange rate: ${err.message}`);
    }
  }

  // Flight search (mock implementation - replace with real API)
  async searchFlights(origin, destination, departureDate, returnDate = null, passengers = 1) {
    const integration = this.getIntegration('flight_api');
    if (!integration) {
      throw new Error('Flight API integration not configured');
    }

    const startTime = Date.now();
    let status = 'success';
    let error = null;

    try {
      // Mock flight data - replace with actual API call
      const mockFlights = [
        {
          id: 'FL001',
          airline: 'Saudi Airlines',
          flightNumber: 'SV123',
          origin,
          destination,
          departureTime: `${departureDate}T08:00:00Z`,
          arrivalTime: `${departureDate}T12:00:00Z`,
          price: 1500,
          currency: 'SAR',
          availableSeats: 20
        },
        {
          id: 'FL002',
          airline: 'Flynas',
          flightNumber: 'XY456',
          origin,
          destination,
          departureTime: `${departureDate}T14:00:00Z`,
          arrivalTime: `${departureDate}T18:00:00Z`,
          price: 1200,
          currency: 'SAR',
          availableSeats: 15
        }
      ];

      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/flights/search', 'POST', status, responseTime);

      return {
        flights: mockFlights,
        searchParams: {
          origin,
          destination,
          departureDate,
          returnDate,
          passengers
        }
      };
    } catch (err) {
      status = 'error';
      error = err;
      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/flights/search', 'POST', status, responseTime, error);
      throw new Error(`Failed to search flights: ${err.message}`);
    }
  }

  // Hotel search (mock implementation - replace with real API)
  async searchHotels(location, checkIn, checkOut, guests = 1) {
    const integration = this.getIntegration('hotel_api');
    if (!integration) {
      throw new Error('Hotel API integration not configured');
    }

    const startTime = Date.now();
    let status = 'success';
    let error = null;

    try {
      // Mock hotel data - replace with actual API call
      const mockHotels = [
        {
          id: 'HT001',
          name: 'Riyadh Marriott Hotel',
          location,
          rating: 4.5,
          price: 800,
          currency: 'SAR',
          amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant'],
          availableRooms: 5
        },
        {
          id: 'HT002',
          name: 'Holiday Inn Riyadh',
          location,
          rating: 4.2,
          price: 600,
          currency: 'SAR',
          amenities: ['WiFi', 'Pool', 'Spa'],
          availableRooms: 8
        }
      ];

      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/hotels/search', 'POST', status, responseTime);

      return {
        hotels: mockHotels,
        searchParams: {
          location,
          checkIn,
          checkOut,
          guests
        }
      };
    } catch (err) {
      status = 'error';
      error = err;
      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/hotels/search', 'POST', status, responseTime, error);
      throw new Error(`Failed to search hotels: ${err.message}`);
    }
  }

  // SMS service
  async sendSMS(to, message) {
    const integration = this.getIntegration('sms_service');
    if (!integration) {
      throw new Error('SMS service integration not configured');
    }

    const startTime = Date.now();
    let status = 'success';
    let error = null;

    try {
      // Mock SMS sending - replace with actual SMS service
      const response = await axios.post(
        `${integration.base_url}/send`,
        {
          to,
          message,
          api_key: integration.api_key
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/send', 'POST', status, responseTime);

      return {
        messageId: response.data.messageId || 'SMS_' + Date.now(),
        status: 'sent',
        to,
        message
      };
    } catch (err) {
      status = 'error';
      error = err;
      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/send', 'POST', status, responseTime, error);
      throw new Error(`Failed to send SMS: ${err.message}`);
    }
  }

  // Email service
  async sendEmail(to, subject, body, isHtml = false) {
    const integration = this.getIntegration('email_service');
    if (!integration) {
      throw new Error('Email service integration not configured');
    }

    const startTime = Date.now();
    let status = 'success';
    let error = null;

    try {
      // Mock email sending - replace with actual email service
      const response = await axios.post(
        `${integration.base_url}/send`,
        {
          to,
          subject,
          body,
          isHtml,
          api_key: integration.api_key
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/send', 'POST', status, responseTime);

      return {
        messageId: response.data.messageId || 'EMAIL_' + Date.now(),
        status: 'sent',
        to,
        subject
      };
    } catch (err) {
      status = 'error';
      error = err;
      const responseTime = Date.now() - startTime;
      await this.logApiCall(integration.id, '/send', 'POST', status, responseTime, error);
      throw new Error(`Failed to send email: ${err.message}`);
    }
  }

  // Statistics methods
  async getIntegrationStats(serviceName) {
    try {
      const integration = await ApiIntegration.getByServiceName(serviceName);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const stats = await ApiLog.getStatsByIntegration(integration.id);
      return {
        serviceName,
        totalCalls: stats.totalCalls || 0,
        successCalls: stats.successCalls || 0,
        errorCalls: stats.errorCalls || 0,
        averageResponseTime: stats.averageResponseTime || 0,
        lastCall: stats.lastCall || null
      };
    } catch (error) {
      throw new Error(`Failed to get integration stats: ${error.message}`);
    }
  }

  async getAllIntegrationStats() {
    try {
      const integrations = await ApiIntegration.query().where('is_active', true);
      const stats = [];

      for (const integration of integrations) {
        const integrationStats = await ApiLog.getStatsByIntegration(integration.id);
        stats.push({
          serviceName: integration.service_name,
          serviceType: integration.service_type,
          totalCalls: integrationStats.totalCalls || 0,
          successCalls: integrationStats.successCalls || 0,
          errorCalls: integrationStats.errorCalls || 0,
          averageResponseTime: integrationStats.averageResponseTime || 0,
          lastCall: integrationStats.lastCall || null
        });
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to get all integration stats: ${error.message}`);
    }
  }
}

// Create singleton instance
const externalApiService = new ExternalApiService();

// Initialize on startup (with delay to allow database connection)
// This prevents blocking server startup if database is not available
setTimeout(() => {
  externalApiService.initialize().catch((error) => {
    // Only log if it's not a connection error (which is expected in development)
    if (error.code !== 'ECONNREFUSED' && !error.message.includes('refused')) {
      console.error('⚠️  [External API] Initialization error:', error.message);
    }
  });
}, 2000); // Wait 2 seconds for database connection to establish

module.exports = externalApiService;
