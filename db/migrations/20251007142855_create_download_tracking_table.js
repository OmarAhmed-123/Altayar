exports.up = async function(knex) {
  // Check if users table exists
  const hasUsersTable = await knex.schema.hasTable('users');
  const hasDownloadTrackingTable = await knex.schema.hasTable('download_tracking');
  
  if (hasDownloadTrackingTable) {
    console.log('✅ [Migration] download_tracking table already exists.');
    return;
  }
  
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping download_tracking table creation.');
    console.warn('💡 [Migration] This migration will be applied when users table is created.');
    return;
  }
  
  return knex.schema.createTable('download_tracking', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('file_type').notNullable(); // e.g., 'membership_card', 'voucher', 'invoice', 'itinerary_pdf'
    table.integer('file_id').unsigned(); // ID of the related entity (membership, voucher, booking, itinerary)
    table.string('download_url').notNullable();
    table.string('ip_address');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('download_tracking');
};