exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('travel_documents');
  if (hasTable) {
    console.log('✅ [Migration] travel_documents table already exists, skipping creation');
    return;
  }
  
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping travel_documents table creation.');
    return;
  }
  
  return knex.schema.createTable('travel_documents', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('document_type').notNullable();
    table.string('file_url').notNullable();
    table.string('file_name');
    table.text('notes');
    table.boolean('is_encrypted').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('travel_documents');
};