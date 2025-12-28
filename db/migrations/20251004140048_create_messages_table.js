exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('messages');
  if (hasTable) {
    console.log('✅ [Migration] messages table already exists, skipping creation');
    return;
  }
  
  // Check if users table exists (for foreign key)
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping messages table creation.');
    console.warn('💡 [Migration] This migration will be applied when users table is created.');
    return;
  }
  
  return knex.schema.createTable('messages', table => {
    table.increments('id').primary();
    table.integer('sender_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    // Note: We create chat_id here, but the foreign key to chats will be in the chats migration.
    // This avoids a circular dependency.
    table.integer('chat_id').unsigned().notNullable(); 
    table.text('content').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('messages');
};