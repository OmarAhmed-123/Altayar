/**
 * Migration: Add payment_status field to bookings table
 * This tracks payment status for bookings (pending, paid, refunded, etc.)
 */

exports.up = function(knex) {
  return knex.schema.alterTable('bookings', function(table) {
    table.enum('payment_status', ['pending', 'paid', 'refunded', 'failed', 'cancelled']).defaultTo('pending');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('bookings', function(table) {
    table.dropColumn('payment_status');
  });
};

