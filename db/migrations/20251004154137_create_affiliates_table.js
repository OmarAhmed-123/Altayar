exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('affiliates');
  if (hasTable) {
    console.log('✅ [Migration] affiliates table already exists, skipping creation');
    return;
  }
  
  // Check if users table exists
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping affiliates table creation.');
    console.warn('💡 [Migration] This migration will be applied when users table is created.');
    return;
  }
  
  return knex.schema.createTable('affiliates', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE').unique();
    table.string('referral_code').notNullable().unique();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) { return knex.schema.dropTable('affiliates'); };