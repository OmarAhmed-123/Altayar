exports.up = function(knex) {
  return knex.schema.createTable('partner_services', table => {
    table.increments('id').primary();
    table.integer('partner_id').unsigned().notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description');
    table.string('service_type').notNullable(); // e.g., 'hotel_room', 'flight_ticket', 'tour_package'
    table.decimal('price', 10, 2).notNullable();
    table.jsonb('details').defaultTo('{}'); // Specific details for the service
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('partner_services');
};