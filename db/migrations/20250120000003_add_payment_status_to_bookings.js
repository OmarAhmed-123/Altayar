/**
 * Migration: Add payment_status field to bookings table
 * This tracks payment status for bookings (pending, paid, refunded, etc.)
 */

exports.up = async function(knex) {
  // Check if bookings table exists
  const hasTable = await knex.schema.hasTable('bookings');
  if (!hasTable) {
    console.warn('⚠️  [Migration] bookings table does not exist. Skipping payment_status column addition.');
    return;
  }
  
  // Check if column already exists
  const hasColumn = await knex.schema.hasColumn('bookings', 'payment_status');
  if (hasColumn) {
    console.log('✅ [Migration] payment_status column already exists in bookings table.');
    return;
  }
  
  return knex.schema.alterTable('bookings', function(table) {
    table.enum('payment_status', ['pending', 'paid', 'refunded', 'failed', 'cancelled']).defaultTo('pending');
  });
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('bookings');
  if (!hasTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  const hasColumn = await knex.schema.hasColumn('bookings', 'payment_status');
  if (!hasColumn) {
    return; // Column doesn't exist, nothing to rollback
  }
  
  return knex.schema.alterTable('bookings', function(table) {
    table.dropColumn('payment_status');
  });
};

