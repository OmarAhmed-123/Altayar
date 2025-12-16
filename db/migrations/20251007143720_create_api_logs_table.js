exports.up = function(knex) {
  return knex.schema.createTable('api_logs', table => {
    table.increments('id').primary();
    table.string('integration_name').notNullable();
    table.string('endpoint').notNullable();
    table.string('method').notNullable();
    table.jsonb('request_payload');
    table.jsonb('response_data');
    table.integer('status_code');
    table.boolean('is_success').notNullable();
    table.text('error_message');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('api_logs');
};