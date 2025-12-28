exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('blogs');
  if (hasTable) {
    console.log('✅ [Migration] blogs table already exists, skipping creation');
    return;
  }
  
  // Check if users table exists
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping blogs table creation.');
    console.warn('💡 [Migration] This migration will be applied when users table is created.');
    return;
  }
  
  return knex.schema.createTable('blogs', table => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.integer('author_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('category').defaultTo('General');
    table.string('image');
    table.boolean('is_published').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('blogs');
};