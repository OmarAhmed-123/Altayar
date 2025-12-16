exports.up = function(knex) {
  return knex.schema.createTable('payment_gateways', table => {
    table.increments('id').primary();
    table.string('name').notNullable().unique(); // e.g., 'Stripe', 'PayPal'
    table.string('code').notNullable().unique(); // e.g., 'stripe', 'paypal'
    table.text('public_key');
    table.text('secret_key'); // Note: Store sensitive keys securely, e.g., encrypted or in a vault in production
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payment_gateways');
};