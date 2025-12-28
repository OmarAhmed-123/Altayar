/**
 * Migration: Enhance messages table with additional fields
 * Adds is_deleted flag and attachment_size for better chat functionality
 */

exports.up = async function(knex) {
  // Check if messages table exists
  const hasTable = await knex.schema.hasTable('messages');
  if (!hasTable) {
    console.warn('⚠️  [Migration] messages table does not exist. Skipping enhancement.');
    return;
  }
  
  // Check if columns exist before adding
  const hasIsDeleted = await knex.schema.hasColumn('messages', 'is_deleted');
  const hasAttachmentSize = await knex.schema.hasColumn('messages', 'attachment_size');
  
  if (!hasIsDeleted) {
    await knex.schema.alterTable('messages', function(table) {
      table.boolean('is_deleted').defaultTo(false).comment('Soft delete flag');
    });
  }
  
  if (!hasAttachmentSize) {
    await knex.schema.alterTable('messages', function(table) {
      table.integer('attachment_size').nullable().comment('File size in bytes');
    });
  }
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('messages');
  if (!hasTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  const hasIsDeleted = await knex.schema.hasColumn('messages', 'is_deleted');
  const hasAttachmentSize = await knex.schema.hasColumn('messages', 'attachment_size');
  
  if (!hasIsDeleted && !hasAttachmentSize) {
    return; // Columns don't exist, nothing to rollback
  }
  
  return knex.schema.alterTable('messages', function(table) {
    if (hasIsDeleted) table.dropColumn('is_deleted');
    if (hasAttachmentSize) table.dropColumn('attachment_size');
  });
};

