exports.up = function(knex) {
  return knex.schema.createTable('chats', table => {
    table.increments('id').primary();
    table.string('chat_name');
    table.boolean('is_group_chat').defaultTo(false);
    table.specificType('participants', 'integer[]').notNullable();
    table.integer('latest_message_id').unsigned();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('chats');
};