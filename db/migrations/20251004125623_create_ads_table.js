exports.up = function(knex) {
  return knex.schema.createTable('ads', table => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content');
    table.string('image');
    table.enum('type', ['popup', 'banner', 'notification']).defaultTo('notification');
    table.string('size'); // e.g., '1080x1920'
    table.integer('created_by').unsigned().notNullable().references('id').inTable('users').onDelete('SET NULL');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ads');
};