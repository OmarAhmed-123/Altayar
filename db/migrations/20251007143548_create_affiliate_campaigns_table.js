exports.up = function(knex) {
  return knex.schema.createTable('affiliate_campaigns', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.string('commission_type').notNullable(); // e.g., 'percentage', 'fixed_amount', 'points'
    table.decimal('commission_value', 10, 2).notNullable();
    table.timestamp('start_date');
    table.timestamp('end_date');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('affiliate_campaigns');
};