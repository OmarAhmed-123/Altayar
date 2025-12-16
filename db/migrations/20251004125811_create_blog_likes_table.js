exports.up = function(knex) {
  return knex.schema.createTable('blog_likes', table => {
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('blog_id').unsigned().notNullable().references('id').inTable('blogs').onDelete('CASCADE');
    table.primary(['user_id', 'blog_id']); // يمنع نفس المستخدم من الإعجاب بنفس المنشور مرتين
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('blog_likes');
};