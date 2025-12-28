/**
 * Create support_tickets table
 * Stores support tickets created automatically from chat conversations
 * 
 * CRITICAL FIX: Made idempotent - checks if table exists before creating
 * This prevents errors when table was created by ensureCriticalStructures or other means
 */

exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('support_tickets');
  if (hasTable) {
    console.log('✅ [Migration] support_tickets table already exists, skipping creation');
    return;
  }
  
  // Check if required tables exist
  const hasUsersTable = await knex.schema.hasTable('users');
  const hasChatsTable = await knex.schema.hasTable('chats');
  
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping support_tickets table creation.');
    console.warn('💡 [Migration] This migration will be applied when users table is created.');
    return;
  }
  
  return knex.schema.createTable('support_tickets', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    if (hasChatsTable) {
      table.integer('chat_id').unsigned().nullable().references('id').inTable('chats').onDelete('SET NULL');
    } else {
      table.integer('chat_id').unsigned().nullable(); // Create column without foreign key if chats table doesn't exist
    }
    table.string('ticket_number').unique().notNullable(); // e.g., TKT-20250127-001
    table.string('subject').notNullable();
    table.text('description').nullable();
    table.enum('status', ['open', 'in_progress', 'resolved', 'closed']).defaultTo('open');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.integer('assigned_to').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('resolved_at').nullable();
    table.timestamps(true, true);

    // Indexes
    table.index('user_id');
    if (hasChatsTable) {
      table.index('chat_id');
    }
    table.index('status');
    table.index('ticket_number');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('support_tickets');
};

