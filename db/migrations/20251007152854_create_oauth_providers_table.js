exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('oauth_providers');
  if (hasTable) {
    console.log('✅ [Migration] oauth_providers table already exists, skipping creation');
    return;
  }
  
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping oauth_providers table creation.');
    return;
  }
  
  return knex.schema.createTable('oauth_providers', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('provider').notNullable();
    table.string('provider_id').notNullable();
    table.string('email').notNullable();
    table.string('name');
    table.string('avatar_url');
    table.jsonb('provider_data').defaultTo('{}');
    table.boolean('is_verified').defaultTo(false);
    table.timestamps(true, true);
    
    table.unique(['provider', 'provider_id']);
    table.index(['user_id', 'provider']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('oauth_providers');
};