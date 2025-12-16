exports.up = function(knex) {
  // قمت بوضع الكود هنا
  return knex.schema.createTable('memberships', table => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.decimal('price', 10, 2).notNullable();
    table.integer('points').notNullable();
    table.specificType('benefits', 'text[]');
    table.string('pdf_url');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  // قمت بوضع الكود هنا
  return knex.schema.dropTable('memberships');
};

