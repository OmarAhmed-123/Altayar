exports.up = async function up(knex) {
  // Check if users table exists
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping is_super_admin and created_by columns addition.');
    return;
  }
  
  const hasIsSuperAdmin = await knex.schema.hasColumn('users', 'is_super_admin');
  const hasCreatedBy = await knex.schema.hasColumn('users', 'created_by');

  await knex.schema.alterTable('users', table => {
    if (!hasIsSuperAdmin) {
      table.boolean('is_super_admin').notNullable().defaultTo(false);
    }

    if (!hasCreatedBy) {
      table
        .integer('created_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
    }
  });

  // Ensure existing super admins are flagged correctly
  await knex('users')
    .where('role', 'super_admin')
    .update({ is_super_admin: true });
};

exports.down = async function down(knex) {
  const hasCreatedBy = await knex.schema.hasColumn('users', 'created_by');
  const hasIsSuperAdmin = await knex.schema.hasColumn('users', 'is_super_admin');

  await knex.schema.alterTable('users', table => {
    if (hasCreatedBy) {
      table.dropColumn('created_by');
    }
    if (hasIsSuperAdmin) {
      table.dropColumn('is_super_admin');
    }
  });
};

