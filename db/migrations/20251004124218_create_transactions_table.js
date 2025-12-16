exports.up = function(knex) {
  return knex.schema.createTable('transactions', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('type', ['membership_purchase', 'booking_payment', 'cashback_earned', 'points_spent', 'manual_deposit', 'invoice_payment']).notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.integer('points_change').defaultTo(0);
    table.decimal('cashback_change', 10, 2).defaultTo(0);
    table.integer('related_booking_id').unsigned().references('id').inTable('bookings').onDelete('SET NULL');
    table.string('description');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('transactions');
};