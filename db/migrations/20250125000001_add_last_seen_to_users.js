exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    // Add last_seen timestamp to track when user was last active
    table.timestamp('last_seen').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('last_seen');
  });
};

