/**
 * Migration: Add file_name column to download_tracking table
 * This column stores the name of the downloaded file
 */

exports.up = async function(knex) {
  // Check if column already exists
  const hasColumn = await knex.schema.hasColumn('download_tracking', 'file_name');
  
  if (!hasColumn) {
    await knex.schema.alterTable('download_tracking', table => {
      table.string('file_name').nullable(); // Allow null for backward compatibility
    });
    console.log('✅ Added file_name column to download_tracking table');
  } else {
    console.log('ℹ️  file_name column already exists in download_tracking table');
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('download_tracking', table => {
    table.dropColumn('file_name');
  });
};

