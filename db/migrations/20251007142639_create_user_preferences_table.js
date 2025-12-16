exports.up = function(knex) {
  return knex.schema.createTable('user_preferences', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.jsonb('preferences').defaultTo('{}'); // Stores JSON object of preferences
    table.timestamps(true, true);
    table.unique('user_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_preferences');
};