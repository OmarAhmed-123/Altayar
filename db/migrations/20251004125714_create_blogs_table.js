exports.up = function(knex) {
  return knex.schema.createTable('blogs', table => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.integer('author_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('category').defaultTo('General');
    table.string('image');
    table.boolean('is_published').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('blogs');
};