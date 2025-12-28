exports.up = async function(knex) {
  // Check if users table exists
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping geolocation fields addition.');
    return;
  }
  
  // Check if columns already exist (check first column as indicator)
  const hasLatitude = await knex.schema.hasColumn('users', 'last_known_latitude');
  if (hasLatitude) {
    console.log('✅ [Migration] Geolocation fields already exist in users table.');
    return;
  }
  
  return knex.schema.alterTable('users', table => {
    table.decimal('last_known_latitude', 9, 6);
    table.decimal('last_known_longitude', 9, 6);
    table.string('detected_country');
    table.string('detected_currency_code');
    table.string('detected_language_code');
  });
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  const hasLatitude = await knex.schema.hasColumn('users', 'last_known_latitude');
  if (!hasLatitude) {
    return; // Columns don't exist, nothing to rollback
  }
  
  return knex.schema.alterTable('users', table => {
    table.dropColumn('last_known_latitude');
    table.dropColumn('last_known_longitude');
    table.dropColumn('detected_country');
    table.dropColumn('detected_currency_code');
    table.dropColumn('detected_language_code');
  });
};