const { Model } = require('objection');

class Blog extends Model {
  static get tableName() {
    return 'blogs';
  }

  static get jsonAttributes() {
    return ['tags'];
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      author: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: { from: 'blogs.author_id', to: 'users.id' }
      },
      likers: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: 'blogs.id',
          through: {
            from: 'blog_likes.blog_id',
            to: 'blog_likes.user_id'
          },
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = Blog;