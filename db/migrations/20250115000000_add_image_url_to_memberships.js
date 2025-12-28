exports.up = async function(knex) {
  // Check if memberships table exists before trying to alter it
  const hasTable = await knex.schema.hasTable('memberships');
  if (!hasTable) {
    console.warn('⚠️  [Migration] memberships table does not exist. Skipping image_url column addition.');
    console.warn('💡 [Migration] This migration will be applied when memberships table is created.');
    return;
  }
  
  // Check if column already exists
  const hasColumn = await knex.schema.hasColumn('memberships', 'image_url');
  if (hasColumn) {
    console.log('✅ [Migration] image_url column already exists in memberships table.');
    return;
  }
  
  return knex.schema.table('memberships', table => {
    table.string('image_url').nullable();
  });
};

exports.down = async function(knex) {
  // Check if memberships table exists
  const hasTable = await knex.schema.hasTable('memberships');
  if (!hasTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  // Check if column exists before trying to drop it
  const hasColumn = await knex.schema.hasColumn('memberships', 'image_url');
  if (!hasColumn) {
    return; // Column doesn't exist, nothing to rollback
  }
  
  return knex.schema.table('memberships', table => {
    table.dropColumn('image_url');
  });
};

