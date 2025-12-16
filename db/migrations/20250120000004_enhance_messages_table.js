/**
 * Migration: Enhance messages table with additional fields
 * Adds is_deleted flag and attachment_size for better chat functionality
 */

exports.up = async function(knex) {
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

exports.down = function(knex) {
  return knex.schema.alterTable('messages', function(table) {
    table.dropColumn('is_deleted');
    table.dropColumn('attachment_size');
  }).catch(() => {
    // Ignore if columns don't exist
  });
};

