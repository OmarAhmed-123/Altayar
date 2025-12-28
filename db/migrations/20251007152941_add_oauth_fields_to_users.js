exports.up = async function(knex) {
  // Check if users table exists
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping OAuth fields addition.');
    return;
  }
  
  // Check if columns already exist (check first column as indicator)
  const hasIsOauthUser = await knex.schema.hasColumn('users', 'is_oauth_user');
  if (hasIsOauthUser) {
    console.log('✅ [Migration] OAuth fields already exist in users table.');
    return;
  }
  
  return knex.schema.alterTable('users', table => {
    table.boolean('is_oauth_user').defaultTo(false);
    table.string('oauth_provider'); // 'google', 'apple', etc.
    table.string('oauth_id'); // ID from OAuth provider
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    table.string('avatar_url');
  });
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  const hasIsOauthUser = await knex.schema.hasColumn('users', 'is_oauth_user');
  if (!hasIsOauthUser) {
    return; // Columns don't exist, nothing to rollback
  }
  
  return knex.schema.alterTable('users', table => {
    table.dropColumn('is_oauth_user');
    table.dropColumn('oauth_provider');
    table.dropColumn('oauth_id');
    table.dropColumn('email_verified');
    table.dropColumn('email_verified_at');
    table.dropColumn('avatar_url');
  });
};