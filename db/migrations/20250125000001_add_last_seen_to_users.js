exports.up = async function(knex) {
  // Check if users table exists
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping last_seen column addition.');
    return;
  }
  
  // Check if column already exists
  const hasColumn = await knex.schema.hasColumn('users', 'last_seen');
  if (hasColumn) {
    console.log('✅ [Migration] last_seen column already exists in users table.');
    return;
  }
  
  return knex.schema.table('users', function(table) {
    // Add last_seen timestamp to track when user was last active
    table.timestamp('last_seen').nullable();
  });
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  const hasColumn = await knex.schema.hasColumn('users', 'last_seen');
  if (!hasColumn) {
    return; // Column doesn't exist, nothing to rollback
  }
  
  return knex.schema.table('users', function(table) {
    table.dropColumn('last_seen');
  });
};

