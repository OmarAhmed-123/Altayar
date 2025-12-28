exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('blog_likes');
  if (hasTable) {
    console.log('✅ [Migration] blog_likes table already exists, skipping creation');
    return;
  }
  
  // Check if required tables exist
  const hasUsersTable = await knex.schema.hasTable('users');
  const hasBlogsTable = await knex.schema.hasTable('blogs');
  
  if (!hasUsersTable || !hasBlogsTable) {
    console.warn('⚠️  [Migration] Required tables (users, blogs) do not exist. Skipping blog_likes table creation.');
    console.warn('💡 [Migration] This migration will be applied when required tables are created.');
    return;
  }
  
  return knex.schema.createTable('blog_likes', table => {
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('blog_id').unsigned().notNullable().references('id').inTable('blogs').onDelete('CASCADE');
    table.primary(['user_id', 'blog_id']); // يمنع نفس المستخدم من الإعجاب بنفس المنشور مرتين
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('blog_likes');
};