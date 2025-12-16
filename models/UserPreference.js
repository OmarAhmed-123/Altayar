const { Model } = require('objection');

class UserPreference extends Model {
  static get tableName() {
    return 'user_preferences';
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'user_preferences.user_id',
          to: 'users.id'
        }
      }
    };
  }

  // Method to update user preferences based on their behavior
  static async updatePreferences(userId, action, data) {
    const preference = await this.query().findOne({ user_id: userId });
    
    if (!preference) {
      return await this.query().insert({
        user_id: userId,
        preferences: {},
        viewed_packages: [],
        viewed_destinations: [],
        booking_history: [],
        interests: []
      });
    }

    const updates = {};
    
    switch (action) {
      case 'view_package':
        const viewedPackages = preference.viewed_packages || [];
        if (!viewedPackages.includes(data.packageId)) {
          viewedPackages.push(data.packageId);
          updates.viewed_packages = viewedPackages;
        }
        break;
        
      case 'book_package':
        const bookingHistory = preference.booking_history || [];
        bookingHistory.push({
          packageId: data.packageId,
          destination: data.destination,
          price: data.price,
          duration: data.duration,
          timestamp: new Date()
        });
        updates.booking_history = bookingHistory;
        break;
        
      case 'set_interests':
        updates.interests = data.interests;
        break;
        
      case 'set_budget':
        updates.budget_range_min = data.min;
        updates.budget_range_max = data.max;
        break;
        
      case 'set_travel_style':
        updates.travel_style = data.style;
        break;
    }

    if (Object.keys(updates).length > 0) {
      return await preference.$query().patchAndFetch(updates);
    }
    
    return preference;
  }

  // Method to get personalized recommendations
  static async getRecommendations(userId, limit = 10) {
    const preference = await this.query().findOne({ user_id: userId });
    const Package = require('./Package');
    
    if (!preference) {
      // Return popular packages for new users
      return await Package.query()
        .where('is_active', true)
        .orderBy('created_at', 'desc')
        .limit(limit);
    }

    const { db } = require('../config/db');
    
    // Build recommendation query based on user preferences
    let query = Package.query()
      .where('is_active', true)
      .whereNotIn('id', preference.viewed_packages || []);
    
    // Filter by budget range
    if (preference.budget_range_min && preference.budget_range_max) {
      query = query.whereBetween('price', [preference.budget_range_min, preference.budget_range_max]);
    }
    
    // Filter by travel style (this would need to be added to packages table)
    if (preference.travel_style && preference.travel_style !== 'mixed') {
      query = query.where('travel_style', preference.travel_style);
    }
    
    // Get packages similar to booking history
    if (preference.booking_history && preference.booking_history.length > 0) {
      const destinations = preference.booking_history.map(booking => booking.destination);
      query = query.whereRaw('destinations && ?', [JSON.stringify(destinations)]);
    }
    
    return await query
      .orderBy('created_at', 'desc')
      .limit(limit);
  }
}

module.exports = UserPreference;
