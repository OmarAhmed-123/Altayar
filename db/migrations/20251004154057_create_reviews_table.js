exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('reviews');
  if (hasTable) {
    console.log('✅ [Migration] reviews table already exists, skipping creation');
    return;
  }
  
  // Check if required tables exist
  const hasUsersTable = await knex.schema.hasTable('users');
  const hasPackagesTable = await knex.schema.hasTable('packages');
  
  if (!hasUsersTable || !hasPackagesTable) {
    console.warn('⚠️  [Migration] Required tables (users, packages) do not exist. Skipping reviews table creation.');
    console.warn('💡 [Migration] This migration will be applied when required tables are created.');
    return;
  }
  
  return knex.schema.createTable('reviews', table => {
    table.increments('id').primary();
    table.integer('rating').notNullable().checkIn([1, 2, 3, 4, 5]);
    table.text('comment');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('package_id').unsigned().notNullable().references('id').inTable('packages').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) { return knex.schema.dropTable('reviews'); };