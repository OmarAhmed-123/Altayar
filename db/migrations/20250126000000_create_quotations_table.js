/**
 * Create quotations table
 * Stores sales quotations/proposals sent to customers
 */

exports.up = function(knex) {
  return knex.schema.createTable('quotations', function(table) {
    table.increments('id').primary();
    table.integer('customer_id').unsigned().notNullable();
    table.integer('sales_id').unsigned().notNullable();
    table.integer('package_id').unsigned().nullable();
    table.text('items').nullable(); // JSON array of items
    table.text('notes').nullable();
    table.decimal('total_amount', 10, 2).notNullable().defaultTo(0);
    table.decimal('discount', 5, 2).defaultTo(0); // Percentage
    table.enum('status', ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']).defaultTo('draft');
    table.timestamp('valid_until').nullable();
    table.timestamp('sent_at').nullable();
    table.timestamp('viewed_at').nullable();
    table.timestamp('responded_at').nullable();
    table.timestamps(true, true);

    // Foreign keys
    table.foreign('customer_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('sales_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('package_id').references('id').inTable('packages').onDelete('SET NULL');

    // Indexes
    table.index('customer_id');
    table.index('sales_id');
    table.index('status');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('quotations');
};

