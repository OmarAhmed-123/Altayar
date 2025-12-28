exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('transactions');
  if (hasTable) {
    console.log('✅ [Migration] transactions table already exists, skipping creation');
    return;
  }
  
  // Check if required tables exist
  const hasUsersTable = await knex.schema.hasTable('users');
  const hasBookingsTable = await knex.schema.hasTable('bookings');
  
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping transactions table creation.');
    console.warn('💡 [Migration] This migration will be applied when users table is created.');
    return;
  }
  
  return knex.schema.createTable('transactions', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('type', ['membership_purchase', 'booking_payment', 'cashback_earned', 'points_spent', 'manual_deposit', 'invoice_payment']).notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.integer('points_change').defaultTo(0);
    table.decimal('cashback_change', 10, 2).defaultTo(0);
    
    // Create related_booking_id column
    if (hasBookingsTable) {
      table.integer('related_booking_id').unsigned().references('id').inTable('bookings').onDelete('SET NULL');
    } else {
      table.integer('related_booking_id').unsigned().nullable();
    }
    
    table.string('description');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('transactions');
};