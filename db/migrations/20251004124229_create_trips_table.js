exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('trips');
  if (hasTable) {
    console.log('✅ [Migration] trips table already exists, skipping creation');
    return;
  }
  
  // Check if users table exists
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping trips table creation.');
    console.warn('💡 [Migration] This migration will be applied when users table is created.');
    return;
  }
  
  return knex.schema.createTable('trips', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.date('start_date');
    table.date('end_date');
    table.jsonb('destinations');
    table.enum('status', ['draft', 'submitted', 'approved', 'rejected']).defaultTo('draft');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('trips');
};