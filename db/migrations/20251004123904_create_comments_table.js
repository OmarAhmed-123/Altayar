exports.up = function(knex) {
  return knex.schema.createTable('comments', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('text').notNullable();
    table.enum('commentable_type', ['Blog', 'Reel', 'MembershipInfo']).notNullable();
    table.integer('commentable_id').unsigned().notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('comments');
};