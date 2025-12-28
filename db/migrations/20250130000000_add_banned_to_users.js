exports.up = async function(knex) {
  // Check if users table exists
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping banned fields addition.');
    return;
  }
  
  // Check if columns already exist
  const hasBanned = await knex.schema.hasColumn('users', 'banned');
  const hasBannedAt = await knex.schema.hasColumn('users', 'banned_at');
  const hasBanReason = await knex.schema.hasColumn('users', 'ban_reason');
  
  if (hasBanned && hasBannedAt && hasBanReason) {
    console.log('✅ [Migration] banned fields already exist in users table.');
    return;
  }
  
  return knex.schema.table('users', table => {
    if (!hasBanned) table.boolean('banned').defaultTo(false).notNullable();
    if (!hasBannedAt) table.timestamp('banned_at').nullable();
    if (!hasBanReason) table.text('ban_reason').nullable();
  });
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  const hasBanned = await knex.schema.hasColumn('users', 'banned');
  const hasBannedAt = await knex.schema.hasColumn('users', 'banned_at');
  const hasBanReason = await knex.schema.hasColumn('users', 'ban_reason');
  
  if (!hasBanned && !hasBannedAt && !hasBanReason) {
    return; // Columns don't exist, nothing to rollback
  }
  
  return knex.schema.table('users', table => {
    if (hasBanned) table.dropColumn('banned');
    if (hasBannedAt) table.dropColumn('banned_at');
    if (hasBanReason) table.dropColumn('ban_reason');
  });
};

