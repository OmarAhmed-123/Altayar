exports.up = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.integer('language_id').unsigned().references('id').inTable('languages').onDelete('SET NULL');
    table.integer('currency_id').unsigned().references('id').inTable('currencies').onDelete('SET NULL');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.dropColumn('language_id');
    table.dropColumn('currency_id');
  });
};