exports.up = function(knex) {
  return knex.schema.createTable('partner_bookings', table => {
    table.increments('id').primary();
    table.integer('partner_id').unsigned().notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL'); // If booked by a registered user
    table.integer('partner_service_id').unsigned().notNullable().references('id').inTable('partner_services').onDelete('CASCADE');
    table.string('booking_reference').unique().notNullable();
    table.decimal('total_price', 10, 2).notNullable();
    table.decimal('partner_commission', 10, 2).defaultTo(0.00);
    table.string('status').defaultTo('pending'); // 'pending', 'confirmed', 'cancelled', 'completed'
    table.jsonb('customer_details').defaultTo('{}'); // Details of the customer if not a registered user
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('partner_bookings');
};