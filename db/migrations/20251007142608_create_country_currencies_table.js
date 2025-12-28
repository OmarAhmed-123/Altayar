exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('country_currencies');
  if (hasTable) {
    console.log('✅ [Migration] country_currencies table already exists, skipping creation');
    return;
  }
  
  const hasCurrenciesTable = await knex.schema.hasTable('currencies');
  if (!hasCurrenciesTable) {
    console.warn('⚠️  [Migration] currencies table does not exist. Skipping country_currencies table creation.');
    return;
  }
  
  return knex.schema.createTable('country_currencies', table => {
    table.increments('id').primary();
    table.string('country_code').unique().notNullable();
    table.string('currency_code').notNullable().references('code').inTable('currencies').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('country_currencies');
};