exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('user_preferences');
  if (hasTable) {
    console.log('✅ [Migration] user_preferences table already exists, skipping creation');
    return;
  }
  
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping user_preferences table creation.');
    return;
  }
  
  return knex.schema.createTable('user_preferences', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.jsonb('preferences').defaultTo('{}');
    table.timestamps(true, true);
    table.unique('user_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_preferences');
};