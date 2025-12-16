exports.up = function(knex) {
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