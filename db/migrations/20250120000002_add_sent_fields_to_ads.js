/**
 * Migration: Add sent_at and sent_count fields to ads table
 * This tracks when ads were sent and how many users received them
 */

exports.up = async function(knex) {
  // Check if ads table exists
  const hasTable = await knex.schema.hasTable('ads');
  if (!hasTable) {
    console.warn('⚠️  [Migration] ads table does not exist. Skipping sent fields addition.');
    return;
  }
  
  // Check if columns already exist
  const hasSentAt = await knex.schema.hasColumn('ads', 'sent_at');
  const hasSentCount = await knex.schema.hasColumn('ads', 'sent_count');
  
  if (hasSentAt && hasSentCount) {
    console.log('✅ [Migration] sent fields already exist in ads table.');
    return;
  }
  
  return knex.schema.alterTable('ads', function(table) {
    if (!hasSentAt) table.timestamp('sent_at').nullable();
    if (!hasSentCount) table.integer('sent_count').defaultTo(0);
  });
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('ads');
  if (!hasTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  const hasSentAt = await knex.schema.hasColumn('ads', 'sent_at');
  const hasSentCount = await knex.schema.hasColumn('ads', 'sent_count');
  
  if (!hasSentAt && !hasSentCount) {
    return; // Columns don't exist, nothing to rollback
  }
  
  return knex.schema.alterTable('ads', function(table) {
    if (hasSentAt) table.dropColumn('sent_at');
    if (hasSentCount) table.dropColumn('sent_count');
  });
};

