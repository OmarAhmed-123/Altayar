exports.up = function(knex) {
  return knex.schema.createTable('packages', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description').notNullable();
    table.integer('days').notNullable();
    table.integer('nights').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.specificType('services', 'text[]');
    table.specificType('images', 'text[]');
    table.boolean('is_exclusive').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('packages');
};