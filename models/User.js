// File: models/User.js
const { Model } = require('objection');

class User extends Model {
  static get tableName() {
    return 'users';
  }

  // ملاحظة: منطق تشفير كلمة المرور ومقارنتها يتم الآن التعامل معه
  // في ملفات الـ controllers (مثل authController)، وليس هنا في الـ Model.

  static get relationMappings() {
    // We import models here to prevent circular dependency issues
    const Membership = require('./Membership');
    const Booking = require('./Booking');
    const Chat = require('./Chat');
    const Trip = require('./Trip');
    const Voucher = require('./Voucher');
    const Transaction = require('./Transaction');
    const Review = require('./Review');
    const Document = require('./Document');
    const Affiliate = require('./Affiliate');
    const AffiliateLink = require('./AffiliateLink');
    const AffiliateReferral = require('./AffiliateReferral');
    const Blog = require('./Blog');
    const Comment = require('./Comment');
    const Ad = require('./Ad');
    const Page = require('./Page');
    const Notification = require('./Notification');
    const Language = require('./Language');
    const Currency = require('./Currency');
    const UserVisitedLocation = require('./UserVisitedLocation');
    const OAuthProvider = require('./OAuthProvider');

    return {
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'users.created_by',
          to: 'users.id',
        },
      },
      managedUsers: {
        relation: Model.HasManyRelation,
        modelClass: User,
        join: {
          from: 'users.id',
          to: 'users.created_by',
        },
      },
      // One-to-One / Belongs-To
      membership: {
        relation: Model.BelongsToOneRelation,
        modelClass: Membership,
        join: {
          from: 'users.membership_id',
          to: 'memberships.id'
        }
      },
      language: {
        relation: Model.BelongsToOneRelation,
        modelClass: Language,
        join: {
          from: 'users.language_id',
          to: 'languages.id'
        }
      },
      currency: {
        relation: Model.BelongsToOneRelation,
        modelClass: Currency,
        join: {
          from: 'users.currency_id',
          to: 'currencies.id'
        }
      },
      affiliateProfile: {
        relation: Model.HasOneRelation,
        modelClass: Affiliate,
        join: {
          from: 'users.id',
          to: 'affiliates.user_id'
        }
      },
      affiliateLinks: {
        relation: Model.HasManyRelation,
        modelClass: AffiliateLink,
        join: {
          from: 'users.id',
          to: 'affiliate_links.user_id'
        }
      },

      // One-to-Many
      bookings: {
        relation: Model.HasManyRelation,
        modelClass: Booking,
        join: { from: 'users.id', to: 'bookings.user_id' }
      },
      documents: {
        relation: Model.HasManyRelation,
        modelClass: Document,
        join: { from: 'users.id', to: 'documents.user_id' }
      },
      notifications: {
        relation: Model.HasManyRelation,
        modelClass: Notification,
        join: { from: 'users.id', to: 'notifications.user_id' }
      },
      reviews: {
        relation: Model.HasManyRelation,
        modelClass: Review,
        join: { from: 'users.id', to: 'reviews.user_id' }
      },
      transactions: {
        relation: Model.HasManyRelation,
        modelClass: Transaction,
        join: { from: 'users.id', to: 'transactions.user_id' }
      },
      trips: {
        relation: Model.HasManyRelation,
        modelClass: Trip,
        join: { from: 'users.id', to: 'trips.user_id' }
      },
      vouchers: {
        relation: Model.HasManyRelation,
        modelClass: Voucher,
        join: { from: 'users.id', to: 'vouchers.user_id' }
      },
      authoredBlogs: {
        relation: Model.HasManyRelation,
        modelClass: Blog,
        join: { from: 'users.id', to: 'blogs.author_id' }
      },
      createdAds: {
        relation: Model.HasManyRelation,
        modelClass: Ad,
        join: { from: 'users.id', to: 'ads.created_by' }
      },
      createdPages: {
        relation: Model.HasManyRelation,
        modelClass: Page,
        join: { from: 'users.id', to: 'pages.created_by' }
      },
      visitedLocations: {
        relation: Model.HasManyRelation,
        modelClass: UserVisitedLocation,
        join: { from: 'users.id', to: 'user_visited_locations.user_id' }
      },
      oauthProviders: {
        relation: Model.HasManyRelation,
        modelClass: OAuthProvider,
        join: { from: 'users.id', to: 'oauth_providers.user_id' }
      },
      referralsSent: {
        relation: Model.ManyToManyRelation,
        modelClass: AffiliateReferral,
        join: {
          from: 'users.id',
          through: {
            from: 'affiliate_links.user_id',
            to: 'affiliate_links.id'
          },
          to: 'affiliate_referrals.affiliate_id'
        }
      },
      referralsReceived: {
        relation: Model.HasManyRelation,
        modelClass: AffiliateReferral,
        join: {
          from: 'users.id',
          to: 'affiliate_referrals.referred_user_id'
        }
      },

      // Many-to-Many
      chats: {
        relation: Model.ManyToManyRelation,
        modelClass: Chat,
        join: {
          from: 'users.id',
          through: {
            from: 'chat_participants.user_id',
            to: 'chat_participants.chat_id'
          },
          to: 'chats.id'
        }
      },
      likedBlogs: {
        relation: Model.ManyToManyRelation,
        modelClass: Blog,
        join: {
          from: 'users.id',
          through: {
            from: 'blog_likes.user_id',
            to: 'blog_likes.blog_id'
          },
          to: 'blogs.id'
        }
      }
    };
  }
}

module.exports = User;