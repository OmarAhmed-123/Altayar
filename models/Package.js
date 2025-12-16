const { Model } = require('objection');

class Package extends Model {
  static get tableName() {
    return 'packages';
  }

  static get relationMappings() {
    const Review = require('./Review');
    return {
      reviews: {
        relation: Model.HasManyRelation,
        modelClass: Review,
        join: {
          from: 'packages.id',
          to: 'reviews.package_id'
        }
      }
    };
  }
}

module.exports = Package;