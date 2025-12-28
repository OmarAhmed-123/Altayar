exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('ads');
  if (hasTable) {
    console.log('✅ [Migration] ads table already exists, skipping creation');
    return;
  }
  
  // Check if users table exists (for foreign key)
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping ads table creation.');
    console.warn('💡 [Migration] This migration will be applied when users table is created.');
    return;
  }
  
  return knex.schema.createTable('ads', table => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content');
    table.string('image');
    table.enum('type', ['popup', 'banner', 'notification']).defaultTo('notification');
    table.string('size'); // e.g., '1080x1920'
    table.integer('created_by').unsigned().notNullable().references('id').inTable('users').onDelete('SET NULL');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ads');
};