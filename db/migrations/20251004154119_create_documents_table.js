exports.up = function(knex) {
  return knex.schema.createTable('documents', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('document_type', ['passport', 'ticket', 'visa', 'other']).notNullable();
    table.string('file_url').notNullable();
    table.date('expires_at');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) { return knex.schema.dropTable('documents'); };