exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('package_analytics');
  if (hasTable) {
    console.log('✅ [Migration] package_analytics table already exists, skipping creation');
    return;
  }
  
  const hasUsersTable = await knex.schema.hasTable('users');
  const hasPackagesTable = await knex.schema.hasTable('packages');
  
  if (!hasPackagesTable) {
    console.warn('⚠️  [Migration] packages table does not exist. Skipping package_analytics table creation.');
    return;
  }
  
  return knex.schema.createTable('package_analytics', table => {
    table.increments('id').primary();
    if (hasUsersTable) {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    } else {
      table.integer('user_id').unsigned().nullable();
    }
    table.integer('package_id').unsigned().references('id').inTable('packages').onDelete('CASCADE');
    table.string('action').notNullable();
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('package_analytics');
};