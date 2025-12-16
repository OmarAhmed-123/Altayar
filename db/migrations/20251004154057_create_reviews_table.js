exports.up = function(knex) {
  return knex.schema.createTable('reviews', table => {
    table.increments('id').primary();
    table.integer('rating').notNullable().checkIn([1, 2, 3, 4, 5]);
    table.text('comment');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('package_id').unsigned().notNullable().references('id').inTable('packages').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) { return knex.schema.dropTable('reviews'); };