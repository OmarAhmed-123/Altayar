/**
 * Migration: Add 'agent' role to users table
 * This adds the agent role which can manage customers, bookings, memberships, and modify balance/points
 */

exports.up = async function(knex) {
  // Check if users table exists
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping agent role addition.');
    return;
  }
  
  // Check if role column exists and if it already has 'agent' value
  const hasRoleColumn = await knex.schema.hasColumn('users', 'role');
  if (!hasRoleColumn) {
    console.warn('⚠️  [Migration] role column does not exist in users table. Skipping.');
    return;
  }
  
  // Check if agent role already exists by checking the enum values
  // This is a simplified check - in PostgreSQL, we'd need to query pg_enum
  // For now, we'll try to alter and catch errors
  try {
    await knex.schema.alterTable('users', function(table) {
      // Drop the existing enum constraint
      table.dropColumn('role');
    });
    
    // Recreate the enum with the new 'agent' role
    await knex.schema.alterTable('users', function(table) {
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
  } catch (error) {
    // If error is about enum already having the value, that's okay
    if (error.message.includes('already exists') || error.message.includes('agent')) {
      console.log('✅ [Migration] agent role already exists in users table.');
    } else {
      throw error;
    }
  }
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

