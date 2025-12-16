exports.up = function(knex) {
  return knex.schema.createTable('package_analytics', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('package_id').unsigned().references('id').inTable('packages').onDelete('CASCADE');
    table.string('action').notNullable(); // e.g., 'view', 'click', 'book', 'wishlist', 'review'
    table.jsonb('metadata').defaultTo('{}'); // Additional data like rating, duration
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('package_analytics');
};