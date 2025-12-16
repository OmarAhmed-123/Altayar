exports.up = function(knex) {
  return knex.schema.alterTable('reviews', table => {
    table.jsonb('images').defaultTo('[]'); // Array of image URLs
    table.jsonb('tags').defaultTo('[]'); // Array of tags/keywords
    table.integer('helpful_count').defaultTo(0);
    table.integer('not_helpful_count').defaultTo(0);
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('verified_at');
    table.boolean('is_featured').defaultTo(false);
    table.jsonb('rating_breakdown').defaultTo('{}'); // e.g., { cleanliness: 4, service: 5 }
    table.string('review_type').defaultTo('package'); // e.g., 'package', 'membership', 'general'
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('reviews', table => {
    table.dropColumn('images');
    table.dropColumn('tags');
    table.dropColumn('helpful_count');
    table.dropColumn('not_helpful_count');
    table.dropColumn('is_verified');
    table.dropColumn('verified_at');
    table.dropColumn('is_featured');
    table.dropColumn('rating_breakdown');
    table.dropColumn('review_type');
  });
};