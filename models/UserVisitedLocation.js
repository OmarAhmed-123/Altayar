const { Model } = require('objection');

class UserVisitedLocation extends Model {
  static get tableName() {
    return 'user_visited_locations';
  }

  static get relationMappings() {
    const User = require('./User');
    const Booking = require('./Booking');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'user_visited_locations.user_id',
          to: 'users.id'
        }
      },
      booking: {
        relation: Model.BelongsToOneRelation,
        modelClass: Booking,
        join: {
          from: 'user_visited_locations.booking_id',
          to: 'bookings.id'
        }
      }
    };
  }

  // Add visited location
  static async addVisitedLocation(userId, locationData) {
    const { locationName, latitude, longitude, country, city, visitType, bookingId, visitDate, notes, metadata } = locationData;

    return await this.query().insert({
      user_id: userId,
      location_name: locationName,
      latitude,
      longitude,
      country,
      city,
      visit_type: visitType || 'manual',
      booking_id: bookingId,
      visit_date: visitDate || new Date(),
      notes,
      metadata: metadata || {}
    });
  }

  // Get user's visited locations
  static async getUserVisitedLocations(userId, limit = 50) {
    return await this.query()
      .where('user_id', userId)
      .withGraphFetched('booking(selectBasicInfo)')
      .modifiers({
        selectBasicInfo(builder) {
          builder.select('id', 'booking_type', 'total_price', 'created_at');
        }
      })
      .orderBy('visit_date', 'desc')
      .limit(limit);
  }

  // Get visited locations for map
  static async getMapData(userId) {
    const locations = await this.query()
      .where('user_id', userId)
      .select('id', 'location_name', 'latitude', 'longitude', 'country', 'city', 'visit_date', 'visit_type')
      .orderBy('visit_date', 'desc');

    return locations.map(location => ({
      id: location.id,
      name: location.location_name,
      lat: parseFloat(location.latitude),
      lng: parseFloat(location.longitude),
      country: location.country,
      city: location.city,
      visitDate: location.visit_date,
      visitType: location.visit_type
    }));
  }

  // Get travel statistics
  static async getTravelStatistics(userId) {
    const { db } = require('../config/db');
    
    // Total locations visited
    const totalLocations = await this.query()
      .where('user_id', userId)
      .resultSize();

    // Countries visited
    const countriesVisited = await this.query()
      .where('user_id', userId)
      .countDistinct('country as count')
      .first();

    // Cities visited
    const citiesVisited = await this.query()
      .where('user_id', userId)
      .countDistinct('city as count')
      .first();

    // Visits by type
    const visitsByType = await this.query()
      .where('user_id', userId)
      .groupBy('visit_type')
      .select('visit_type', db.raw('count(*)::int as count'));

    // Recent visits
    const recentVisits = await this.query()
      .where('user_id', userId)
      .orderBy('visit_date', 'desc')
      .limit(5);

    return {
      total_locations: totalLocations,
      countries_visited: parseInt(countriesVisited.count),
      cities_visited: parseInt(citiesVisited.count),
      visits_by_type: visitsByType,
      recent_visits: recentVisits
    };
  }
}

module.exports = UserVisitedLocation;
