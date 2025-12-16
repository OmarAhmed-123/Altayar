exports.up = function(knex) {
  return knex.schema.createTable('trips', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.date('start_date');
    table.date('end_date');
    table.jsonb('destinations');
    table.enum('status', ['draft', 'submitted', 'approved', 'rejected']).defaultTo('draft');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('trips');
};