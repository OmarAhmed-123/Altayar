exports.up = async function(knex) {
  // Check if users table exists
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping referred_by_id column addition.');
    return;
  }
  
  // Check if affiliates table exists
  const hasAffiliatesTable = await knex.schema.hasTable('affiliates');
  
  // Check if column already exists
  const hasColumn = await knex.schema.hasColumn('users', 'referred_by_id');
  if (hasColumn) {
    console.log('✅ [Migration] referred_by_id column already exists in users table.');
    return;
  }
  
  return knex.schema.alterTable('users', table => {
    if (hasAffiliatesTable) {
      table.integer('referred_by_id').unsigned().references('id').inTable('affiliates').onDelete('SET NULL');
    } else {
      table.integer('referred_by_id').unsigned().nullable();
    }
  });
};

exports.down = async function(knex) {
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  const hasColumn = await knex.schema.hasColumn('users', 'referred_by_id');
  if (!hasColumn) {
    return; // Column doesn't exist, nothing to rollback
  }
  
  return knex.schema.alterTable('users', table => {
    table.dropColumn('referred_by_id');
  });
};