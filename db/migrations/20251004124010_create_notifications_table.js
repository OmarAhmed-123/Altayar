exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('notifications');
  if (hasTable) {
    console.log('✅ [Migration] notifications table already exists, skipping creation');
    return;
  }
  
  // Check if users table exists (for foreign keys)
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping notifications table creation.');
    console.warn('💡 [Migration] This migration will be applied when users table is created.');
    return;
  }
  
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