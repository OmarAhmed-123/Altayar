exports.up = function(knex) {
  return knex.schema.table('users', table => {
    table.boolean('banned').defaultTo(false).notNullable();
    table.timestamp('banned_at').nullable();
    table.text('ban_reason').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', table => {
    table.dropColumn('banned');
    table.dropColumn('banned_at');
    table.dropColumn('ban_reason');
  });
};

