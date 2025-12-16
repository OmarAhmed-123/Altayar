exports.up = function(knex) {
  return knex.schema.createTable('api_integrations', table => {
    table.increments('id').primary();
    table.string('name').unique().notNullable(); // e.g., 'Google Maps', 'OpenWeather', 'Stripe'
    table.string('api_key').notNullable(); // Encrypted in production
    table.string('base_url');
    table.jsonb('config').defaultTo('{}'); // Additional configuration
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('api_integrations');
};