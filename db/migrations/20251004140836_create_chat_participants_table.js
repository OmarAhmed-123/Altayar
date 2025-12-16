exports.up = function(knex) {
  return knex.schema.createTable('chat_participants', table => {
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('chat_id').unsigned().notNullable().references('id').inTable('chats').onDelete('CASCADE');
    table.primary(['user_id', 'chat_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('chat_participants');
};