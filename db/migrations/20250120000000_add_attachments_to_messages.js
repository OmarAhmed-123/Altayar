/**
 * Migration: Add attachment fields to messages table
 * This migration adds support for file attachments in chat messages
 */

exports.up = function(knex) {
  return knex.schema.table('messages', function(table) {
    // Add attachment fields if they don't exist
    table.string('attachment_url').nullable().comment('URL to the attached file');
    table.string('attachment_name').nullable().comment('Original filename of the attachment');
    table.string('attachment_type').nullable().comment('MIME type of the attachment');
  });
};

exports.down = function(knex) {
  return knex.schema.table('messages', function(table) {
    table.dropColumn('attachment_url');
    table.dropColumn('attachment_name');
    table.dropColumn('attachment_type');
  });
};

