exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('translations');
  if (hasTable) {
    console.log('✅ [Migration] translations table already exists, skipping creation');
    return;
  }
  
  const hasLanguagesTable = await knex.schema.hasTable('languages');
  if (!hasLanguagesTable) {
    console.warn('⚠️  [Migration] languages table does not exist. Skipping translations table creation.');
    return;
  }
  
  return knex.schema.createTable('translations', table => {
    table.increments('id').primary();
    table.string('key').notNullable();
    table.integer('language_id').unsigned().notNullable().references('id').inTable('languages').onDelete('CASCADE');
    table.text('value').notNullable();
    table.timestamps(true, true);
    table.unique(['key', 'language_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('translations');
};