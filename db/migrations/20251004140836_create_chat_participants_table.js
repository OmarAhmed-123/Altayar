exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('chat_participants');
  if (hasTable) {
    console.log('✅ [Migration] chat_participants table already exists, skipping creation');
    return;
  }
  
  // Check if required tables exist
  const hasUsersTable = await knex.schema.hasTable('users');
  const hasChatsTable = await knex.schema.hasTable('chats');
  
  if (!hasUsersTable || !hasChatsTable) {
    console.warn('⚠️  [Migration] Required tables (users, chats) do not exist. Skipping chat_participants table creation.');
    console.warn('💡 [Migration] This migration will be applied when required tables are created.');
    return;
  }
  
  return knex.schema.createTable('chat_participants', table => {
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('chat_id').unsigned().notNullable().references('id').inTable('chats').onDelete('CASCADE');
    table.primary(['user_id', 'chat_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('chat_participants');
};