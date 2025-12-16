/**
 * Migration: Add 'agent' role to users table
 * This adds the agent role which can manage customers, bookings, memberships, and modify balance/points
 */

exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Drop the existing enum constraint
    table.dropColumn('role');
  }).then(() => {
    // Recreate the enum with the new 'agent' role
    return knex.schema.alterTable('users', function(table) {
      table.enum('role', [
        'super_admin', 
        'admin', 
        'hr', 
        'sales', 
        'reservations', 
        'data_entry', 
        'accountant', 
        'agent',  // New role: Agent can manage customers, bookings, memberships, modify balance/points
        'customer'
      ]).defaultTo('customer').notNullable();
    });
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('role');
  }).then(() => {
    return knex.schema.alterTable('users', function(table) {
      table.enum('role', [
        'super_admin', 
        'admin', 
        'hr', 
        'sales', 
        'reservations', 
        'data_entry', 
        'accountant', 
        'customer'
      ]).defaultTo('customer').notNullable();
    });
  });
};

