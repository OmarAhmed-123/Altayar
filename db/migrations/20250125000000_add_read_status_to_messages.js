exports.up = function(knex) {
  return knex.schema.table('messages', function(table) {
    // Add read_by column as JSON array to track which users have read the message
    table.json('read_by').defaultTo('[]');
  });
};

exports.down = function(knex) {
  return knex.schema.table('messages', function(table) {
    table.dropColumn('read_by');
  });
};

