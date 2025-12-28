exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('comments');
  if (hasTable) {
    console.log('✅ [Migration] comments table already exists, skipping creation');
    return;
  }
  
  // Check if users table exists
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping comments table creation.');
    console.warn('💡 [Migration] This migration will be applied when users table is created.');
    return;
  }
  
  return knex.schema.createTable('comments', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('text').notNullable();
    table.enum('commentable_type', ['Blog', 'Reel', 'MembershipInfo']).notNullable();
    table.integer('commentable_id').unsigned().notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('comments');
};