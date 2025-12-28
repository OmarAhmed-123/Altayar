exports.up = async function(knex) {
  // Check if transactions table exists
  const hasTable = await knex.schema.hasTable('transactions');
  if (!hasTable) {
    console.warn('⚠️  [Migration] transactions table does not exist. Skipping metadata column addition.');
    return;
  }
  
  // Check if column already exists
  const hasColumn = await knex.schema.hasColumn('transactions', 'metadata');
  if (hasColumn) {
    console.log('✅ [Migration] metadata column already exists in transactions table.');
    return;
  }
  
  return knex.schema.alterTable('transactions', table => {
    table.jsonb('metadata').nullable();
  });
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('transactions');
  if (!hasTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  const hasColumn = await knex.schema.hasColumn('transactions', 'metadata');
  if (!hasColumn) {
    return; // Column doesn't exist, nothing to rollback
  }
  
  return knex.schema.alterTable('transactions', table => {
    table.dropColumn('metadata');
  });
};

