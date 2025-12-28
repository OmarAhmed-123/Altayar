exports.up = async function(knex) {
  // Check if users table exists
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping language/currency fields addition.');
    return;
  }
  
  // Check if columns already exist
  const hasLanguageId = await knex.schema.hasColumn('users', 'language_id');
  const hasCurrencyId = await knex.schema.hasColumn('users', 'currency_id');
  
  if (hasLanguageId && hasCurrencyId) {
    console.log('✅ [Migration] language_id and currency_id columns already exist in users table.');
    return;
  }
  
  return knex.schema.alterTable('users', table => {
    if (!hasLanguageId) {
      table.integer('language_id').unsigned().references('id').inTable('languages').onDelete('SET NULL');
    }
    if (!hasCurrencyId) {
      table.integer('currency_id').unsigned().references('id').inTable('currencies').onDelete('SET NULL');
    }
  });
};

exports.down = async function(knex) {
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  const hasLanguageId = await knex.schema.hasColumn('users', 'language_id');
  const hasCurrencyId = await knex.schema.hasColumn('users', 'currency_id');
  
  if (!hasLanguageId && !hasCurrencyId) {
    return; // Columns don't exist, nothing to rollback
  }
  
  return knex.schema.alterTable('users', table => {
    if (hasLanguageId) table.dropColumn('language_id');
    if (hasCurrencyId) table.dropColumn('currency_id');
  });
};