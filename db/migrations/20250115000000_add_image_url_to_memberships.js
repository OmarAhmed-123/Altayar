exports.up = function(knex) {
  return knex.schema.table('memberships', table => {
    table.string('image_url').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('memberships', table => {
    table.dropColumn('image_url');
  });
};

