exports.up = function(knex) {
  return knex.schema.createTable('pages', table => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.string('slug').notNullable().unique();
    table.text('content').notNullable();
    table.enum('page_type', ['front', 'policy', 'custom']).defaultTo('custom');
    table.boolean('is_published').defaultTo(true);
    table.integer('created_by').unsigned().notNullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('pages');
};