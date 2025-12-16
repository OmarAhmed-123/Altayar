exports.up = function(knex) {
  return knex.schema.createTable('user_visited_locations', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('location_name').notNullable();
    table.decimal('latitude', 9, 6);
    table.decimal('longitude', 9, 6);
    table.string('country');
    table.string('city');
    table.string('source').defaultTo('manual'); // e.g., 'booking', 'manual', 'itinerary'
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_visited_locations');
};