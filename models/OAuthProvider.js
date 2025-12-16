const { Model } = require('objection');

class OAuthProvider extends Model {
  static get tableName() {
    return 'oauth_providers';
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'oauth_providers.user_id',
          to: 'users.id'
        }
      }
    };
  }

  // Find or create OAuth provider
  static async findOrCreate(providerData) {
    const { provider, providerId, email, name, avatarUrl, providerData: additionalData } = providerData;

    // Check if provider already exists
    let oauthProvider = await this.query()
      .findOne({ provider, provider_id: providerId });

    if (oauthProvider) {
      // Update existing provider data
      oauthProvider = await oauthProvider.$query().patchAndFetch({
        email,
        name,
        avatar_url: avatarUrl,
        provider_data: additionalData,
        is_verified: true
      });
    } else {
      // Create new provider
      oauthProvider = await this.query().insert({
        provider,
        provider_id: providerId,
        email,
        name,
        avatar_url: avatarUrl,
        provider_data: additionalData,
        is_verified: true
      });
    }

    return oauthProvider;
  }

  // Get user by OAuth provider
  static async getUserByProvider(provider, providerId) {
    const oauthProvider = await this.query()
      .findOne({ provider, provider_id: providerId })
      .withGraphFetched('user');

    return oauthProvider?.user || null;
  }

  // Get all providers for a user
  static async getUserProviders(userId) {
    return await this.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc');
  }

  // Link OAuth provider to existing user
  static async linkToUser(userId, providerData) {
    const { provider, providerId, email, name, avatarUrl, providerData: additionalData } = providerData;

    // Check if provider is already linked to another user
    const existingProvider = await this.query()
      .findOne({ provider, provider_id: providerId });

    if (existingProvider && existingProvider.user_id !== userId) {
      throw new Error('This OAuth account is already linked to another user');
    }

    if (existingProvider) {
      // Update existing provider
      return await existingProvider.$query().patchAndFetch({
        user_id: userId,
        email,
        name,
        avatar_url: avatarUrl,
        provider_data: additionalData,
        is_verified: true
      });
    } else {
      // Create new provider link
      return await this.query().insert({
        user_id: userId,
        provider,
        provider_id: providerId,
        email,
        name,
        avatar_url: avatarUrl,
        provider_data: additionalData,
        is_verified: true
      });
    }
  }

  // Unlink OAuth provider from user
  static async unlinkFromUser(userId, provider) {
    const result = await this.query()
      .where({ user_id: userId, provider })
      .delete();

    return result > 0;
  }

  // Check if user has OAuth provider
  static async hasProvider(userId, provider) {
    const count = await this.query()
      .where({ user_id: userId, provider })
      .resultSize();

    return count > 0;
  }
}

module.exports = OAuthProvider;
