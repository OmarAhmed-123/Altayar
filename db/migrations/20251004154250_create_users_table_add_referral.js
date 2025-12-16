exports.up = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.integer('referred_by_id').unsigned().references('id').inTable('affiliates').onDelete('SET NULL');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.dropColumn('referred_by_id');
  });
};