exports.up = function(knex) {
  return knex.schema.createTable('country_currencies', table => {
    table.increments('id').primary();
    table.string('country_code').unique().notNullable(); // ISO 3166-1 alpha-2
    table.string('currency_code').notNullable().references('code').inTable('currencies').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('country_currencies');
};