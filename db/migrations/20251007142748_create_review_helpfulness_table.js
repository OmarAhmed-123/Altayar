exports.up = function(knex) {
  return knex.schema.createTable('review_helpfulness', table => {
    table.increments('id').primary();
    table.integer('review_id').unsigned().notNullable().references('id').inTable('reviews').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_helpful').notNullable(); // true for helpful, false for not helpful
    table.timestamps(true, true);
    table.unique(['review_id', 'user_id']); // Each user can rate a review only once
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('review_helpfulness');
};