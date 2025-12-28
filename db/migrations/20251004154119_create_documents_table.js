exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('documents');
  if (hasTable) {
    console.log('✅ [Migration] documents table already exists, skipping creation');
    return;
  }
  
  // Check if users table exists
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping documents table creation.');
    console.warn('💡 [Migration] This migration will be applied when users table is created.');
    return;
  }
  
  return knex.schema.createTable('documents', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('document_type', ['passport', 'ticket', 'visa', 'other']).notNullable();
    table.string('file_url').notNullable();
    table.date('expires_at');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) { return knex.schema.dropTable('documents'); };