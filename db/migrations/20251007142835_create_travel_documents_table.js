exports.up = function(knex) {
  return knex.schema.createTable('travel_documents', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('document_type').notNullable(); // e.g., 'passport', 'visa', 'ticket', 'hotel_voucher'
    table.string('file_url').notNullable();
    table.string('file_name');
    table.text('notes');
    table.boolean('is_encrypted').defaultTo(false); // Future enhancement
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('travel_documents');
};