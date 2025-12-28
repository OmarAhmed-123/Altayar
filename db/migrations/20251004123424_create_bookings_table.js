exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('bookings');
  if (hasTable) {
    console.log('✅ [Migration] bookings table already exists, skipping creation');
    return;
  }
  
  // Check if users table exists (for foreign key)
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping bookings table creation.');
    console.warn('💡 [Migration] This migration will be applied when users table is created.');
    return;
  }
  
  return knex.schema.createTable('bookings', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('booking_type', ['tour', 'nile_cruise', 'flight_ticket', 'hotel_booking', 'transfer', 'nile_trip', 'general_tour']).notNullable();
    table.jsonb('details').notNullable();
    table.enum('status', ['pending', 'confirmed', 'cancelled', 'completed']).defaultTo('pending');
    table.decimal('total_price', 10, 2).notNullable();
    table.string('invoice_id');
    table.timestamps(true, true);
  });
};
exports.down = function(knex) { return knex.schema.dropTable('bookings'); };