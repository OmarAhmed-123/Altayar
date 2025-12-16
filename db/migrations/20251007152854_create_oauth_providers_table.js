exports.up = function(knex) {
  return knex.schema.createTable('oauth_providers', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('provider').notNullable(); // 'google', 'apple', 'facebook', etc.
    table.string('provider_id').notNullable(); // The ID from the OAuth provider
    table.string('email').notNullable();
    table.string('name');
    table.string('avatar_url');
    table.jsonb('provider_data').defaultTo('{}'); // Store additional data from provider
    table.boolean('is_verified').defaultTo(false);
    table.timestamps(true, true);
    
    table.unique(['provider', 'provider_id']);
    table.index(['user_id', 'provider']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('oauth_providers');
};