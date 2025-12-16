exports.up = function(knex) {
  return knex.schema.alterTable('transactions', table => {
    table.string('payment_method').defaultTo('card');
    table.json('payment_details').nullable();
    table.enum('status', ['pending', 'completed', 'failed', 'cancelled']).defaultTo('pending');
    table.string('currency', 3).defaultTo('EGP');
    table.string('reference_id').nullable();
    table.timestamp('completed_at').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('transactions', table => {
    table.dropColumn('payment_method');
    table.dropColumn('payment_details');
    table.dropColumn('status');
    table.dropColumn('currency');
    table.dropColumn('reference_id');
    table.dropColumn('completed_at');
  });
};

