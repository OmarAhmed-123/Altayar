exports.up = function(knex) {
  return knex.schema.createTable('itineraries', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description');
    table.date('start_date');
    table.date('end_date');
    table.jsonb('destinations').defaultTo('[]'); // Array of objects { city, country, activities: [] }
    table.jsonb('travel_details').defaultTo('{}'); // Flight/hotel details
    table.string('share_code').unique(); // For sharing itineraries
    table.boolean('is_public').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('itineraries');
};