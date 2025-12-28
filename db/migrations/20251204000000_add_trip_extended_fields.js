exports.up = async function (knex) {
  // Check if trips table exists
  const hasTable = await knex.schema.hasTable('trips');
  if (!hasTable) {
    console.warn('⚠️  [Migration] trips table does not exist. Skipping extended fields addition.');
    return;
  }
  
  // Check if columns already exist
  const hasDescription = await knex.schema.hasColumn('trips', 'description');
  const hasDetails = await knex.schema.hasColumn('trips', 'details');
  const hasIsPublic = await knex.schema.hasColumn('trips', 'is_public');
  
  if (hasDescription && hasDetails && hasIsPublic) {
    console.log('✅ [Migration] Extended fields already exist in trips table.');
    return;
  }
  
  return knex.schema.alterTable('trips', table => {
    if (!hasDescription) table.text('description');
    if (!hasDetails) table.jsonb('details').defaultTo('{}');
    if (!hasIsPublic) table.boolean('is_public').defaultTo(false);
  });
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('trips');
  if (!hasTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  const hasDescription = await knex.schema.hasColumn('trips', 'description');
  const hasDetails = await knex.schema.hasColumn('trips', 'details');
  const hasIsPublic = await knex.schema.hasColumn('trips', 'is_public');
  
  if (!hasDescription && !hasDetails && !hasIsPublic) {
    return; // Columns don't exist, nothing to rollback
  }
  
  return knex.schema.alterTable('trips', table => {
    if (hasDescription) table.dropColumn('description');
    if (hasDetails) table.dropColumn('details');
    if (hasIsPublic) table.dropColumn('is_public');
  });
};

