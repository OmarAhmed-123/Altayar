exports.up = function(knex) {
  return knex.schema.createTable('messages', table => {
    table.increments('id').primary();
    table.integer('sender_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    // Note: We create chat_id here, but the foreign key to chats will be in the chats migration.
    // This avoids a circular dependency.
    table.integer('chat_id').unsigned().notNullable(); 
    table.text('content').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('messages');
};