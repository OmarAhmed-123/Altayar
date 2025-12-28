/**
 * Migration: Add attachment fields to messages table
 * This migration adds support for file attachments in chat messages
 */

exports.up = async function(knex) {
  // Check if messages table exists before trying to alter it
  const hasTable = await knex.schema.hasTable('messages');
  if (!hasTable) {
    console.warn('⚠️  [Migration] messages table does not exist. Skipping attachment fields addition.');
    console.warn('💡 [Migration] This migration will be applied when messages table is created.');
    return;
  }
  
  // Check if columns already exist
  const hasAttachmentUrl = await knex.schema.hasColumn('messages', 'attachment_url');
  const hasAttachmentName = await knex.schema.hasColumn('messages', 'attachment_name');
  const hasAttachmentType = await knex.schema.hasColumn('messages', 'attachment_type');
  
  if (hasAttachmentUrl && hasAttachmentName && hasAttachmentType) {
    console.log('✅ [Migration] Attachment columns already exist in messages table.');
    return;
  }
  
  return knex.schema.table('messages', function(table) {
    // Add attachment fields if they don't exist
    if (!hasAttachmentUrl) {
      table.string('attachment_url').nullable().comment('URL to the attached file');
    }
    if (!hasAttachmentName) {
      table.string('attachment_name').nullable().comment('Original filename of the attachment');
    }
    if (!hasAttachmentType) {
      table.string('attachment_type').nullable().comment('MIME type of the attachment');
    }
  });
};

exports.down = async function(knex) {
  // Check if messages table exists
  const hasTable = await knex.schema.hasTable('messages');
  if (!hasTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  // Check if columns exist before trying to drop them
  const hasAttachmentUrl = await knex.schema.hasColumn('messages', 'attachment_url');
  const hasAttachmentName = await knex.schema.hasColumn('messages', 'attachment_name');
  const hasAttachmentType = await knex.schema.hasColumn('messages', 'attachment_type');
  
  if (!hasAttachmentUrl && !hasAttachmentName && !hasAttachmentType) {
    return; // Columns don't exist, nothing to rollback
  }
  
  return knex.schema.table('messages', function(table) {
    if (hasAttachmentUrl) table.dropColumn('attachment_url');
    if (hasAttachmentName) table.dropColumn('attachment_name');
    if (hasAttachmentType) table.dropColumn('attachment_type');
  });
};

