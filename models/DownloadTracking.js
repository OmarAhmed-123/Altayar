// File: models/DownloadTracking.js
const { Model } = require('objection');

class DownloadTracking extends Model {
  static get tableName() {
    return 'download_tracking';
  }

  static get relationMappings() {
    const User = require('./User');
    const Membership = require('./Membership');

    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'download_tracking.user_id',
          to: 'users.id'
        }
      },
      membership: {
        relation: Model.BelongsToOneRelation,
        modelClass: Membership,
        join: {
          from: 'download_tracking.membership_id',
          to: 'memberships.id'
        }
      }
    };
  }

  // Get download statistics for a specific membership
  // CRITICAL FIX: Table uses 'file_type' not 'download_type', and 'file_id' not 'membership_id'
  static async getDownloadStats(membershipId) {
    return await this.query()
      .select('file_id', 'file_type') // CRITICAL: Use correct column names
      .count('* as download_count')
      .where('file_id', membershipId)
      .groupBy('file_id', 'file_type');
  }

  // Get user's download history
  static async getUserDownloads(userId) {
    return await this.query()
      .where('user_id', userId)
      .withGraphFetched('membership')
      .orderBy('created_at', 'desc');
  }

  // Get total downloads for a membership
  static async getTotalDownloads(membershipId) {
    const result = await this.query()
      .where('membership_id', membershipId)
      .count('* as total_downloads')
      .first();

    return result.total_downloads;
  }

  // Track a download
  // CRITICAL FIX: Table uses 'file_type' not 'download_type', and 'download_url' not 'file_path'
  // Table schema: user_id, file_type, file_id, file_name, download_url, ip_address, timestamps
  static async trackDownload(userId, downloadType, fileName, filePath, metadata = {}) {
    try {
      // Extract file_id from metadata if available
      const fileId = metadata?.file_id || metadata?.card_id || metadata?.booking_id || metadata?.membership_id || null;
      
      // Build download_url - use filePath if provided, otherwise construct from type and name
      let downloadUrl = filePath;
      if (!downloadUrl || downloadUrl === '') {
        if (fileId) {
          downloadUrl = `/api/files/${downloadType}/${fileId}`;
        } else {
          downloadUrl = `/api/files/${downloadType}/${fileName || downloadType}`;
        }
      }
      
      // Map to correct column names based on actual table schema
      const downloadRecord = await this.query().insert({
        user_id: userId,
        file_type: downloadType, // CRITICAL: Table has 'file_type' not 'download_type'
        file_name: fileName || `${downloadType}.pdf`, // Use downloadType as fallback for file_name
        file_id: fileId, // ID of related entity (card, booking, membership, etc.)
        download_url: downloadUrl, // CRITICAL: Table has 'download_url' not 'file_path'
        ip_address: metadata?.ip_address || null
        // Note: created_at and updated_at are handled by timestamps in table
      });
      return downloadRecord;
    } catch (error) {
      // Log error but don't throw - tracking is optional
      console.error('⚠️ [DOWNLOAD TRACKING] Could not track download:', error.message);
      // Return null instead of throwing to allow request to continue
      return null;
    }
  }

  // Get download statistics for a period
  // CRITICAL FIX: Table uses 'file_type' not 'download_type'
  static async getDownloadStats(periodDays = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    return await this.query()
      .select('file_type') // CRITICAL: Use 'file_type' not 'download_type'
      .count('* as count')
      .where('created_at', '>=', startDate)
      .groupBy('file_type')
      .orderBy('count', 'desc');
  }

  // Get popular downloads
  // CRITICAL FIX: Table uses 'file_type' not 'download_type'
  static async getPopularDownloads(limit = 10, periodDays = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    return await this.query()
      .select('file_name', 'file_type') // CRITICAL: Use 'file_type' not 'download_type'
      .count('* as download_count')
      .where('created_at', '>=', startDate)
      .groupBy('file_name', 'file_type')
      .orderBy('download_count', 'desc')
      .limit(limit);
  }
}

module.exports = DownloadTracking;