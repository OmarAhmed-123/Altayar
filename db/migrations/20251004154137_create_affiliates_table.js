exports.up = function(knex) {
  return knex.schema.createTable('affiliates', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE').unique();
    table.string('referral_code').notNullable().unique();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) { return knex.schema.dropTable('affiliates'); };