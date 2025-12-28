exports.up = async function(knex) {
  // Check if messages table exists
  const hasTable = await knex.schema.hasTable('messages');
  if (!hasTable) {
    console.warn('⚠️  [Migration] messages table does not exist. Skipping read_by column addition.');
    return;
  }
  
  // Check if column already exists
  const hasReadBy = await knex.schema.hasColumn('messages', 'read_by');
  if (hasReadBy) {
    console.log('✅ [Migration] read_by column already exists in messages table.');
    return;
  }
  
  return knex.schema.table('messages', function(table) {
    // Add read_by column as JSON array to track which users have read the message
    table.json('read_by').defaultTo('[]');
  });
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('messages');
  if (!hasTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  const hasReadBy = await knex.schema.hasColumn('messages', 'read_by');
  if (!hasReadBy) {
    return; // Column doesn't exist, nothing to rollback
  }
  
  return knex.schema.table('messages', function(table) {
    table.dropColumn('read_by');
  });
};

