exports.up = function(knex) {
  return knex.schema.createTable('currencies', table => {
    table.increments('id').primary();
    table.string('code').unique().notNullable(); // USD, EUR, SAR, EGP
    table.string('name').notNullable(); // US Dollar, Euro, Saudi Riyal
    table.string('symbol').notNullable(); // $, €, ﷼, £
    table.decimal('exchange_rate', 10, 4).defaultTo(1.0000); // Rate against base currency
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_default').defaultTo(false);
    table.integer('decimal_places').defaultTo(2);
    table.string('position').defaultTo('before'); // before or after the amount
    table.timestamps(true, true);
    
    table.index(['is_active', 'is_default']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('currencies');
};