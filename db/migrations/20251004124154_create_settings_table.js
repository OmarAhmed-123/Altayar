exports.up = function(knex) {
  return knex.schema.createTable('settings', table => {
    table.increments('id').primary();
    table.string('unique_key').defaultTo('general_settings').unique();
    table.string('site_name').defaultTo('Tourist App');
    table.string('currency').defaultTo('USD');
    table.string('contact_email').defaultTo('support@example.com');
    table.boolean('maintenance_mode').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('settings');
};