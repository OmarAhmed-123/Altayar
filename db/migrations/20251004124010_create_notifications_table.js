exports.up = function(knex) {
  return knex.schema.createTable('notifications', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('sender_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.enum('type', ['offer', 'booking_status', 'membership_upgrade', 'voucher_gift', 'ad_popup', 'chat_message', 'general']).notNullable();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.boolean('is_read').defaultTo(false);
    table.integer('reference_id').unsigned();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notifications');
};