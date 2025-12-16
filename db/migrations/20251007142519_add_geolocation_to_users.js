exports.up = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.decimal('last_known_latitude', 9, 6);
    table.decimal('last_known_longitude', 9, 6);
    table.string('detected_country');
    table.string('detected_currency_code');
    table.string('detected_language_code');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.dropColumn('last_known_latitude');
    table.dropColumn('last_known_longitude');
    table.dropColumn('detected_country');
    table.dropColumn('detected_currency_code');
    table.dropColumn('detected_language_code');
  });
};