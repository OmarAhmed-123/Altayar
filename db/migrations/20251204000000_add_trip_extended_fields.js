exports.up = function (knex) {
  return knex.schema.alterTable('trips', table => {
    table.text('description');
    table.jsonb('details').defaultTo('{}');
    table.boolean('is_public').defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('trips', table => {
    table.dropColumn('description');
    table.dropColumn('details');
    table.dropColumn('is_public');
  });
};

