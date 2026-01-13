/**
 * Migration to add missing columns to users table
 * Adds phone and is_super_admin columns needed for registration
 */
exports.up = async function (knex) {
    const hasTable = await knex.schema.hasTable('users');
    if (!hasTable) {
        console.log('⚠️ [Migration] users table does not exist, skipping column additions');
        return;
    }

    // Check and add phone column
    const hasPhone = await knex.schema.hasColumn('users', 'phone');
    if (!hasPhone) {
        console.log('🔄 [Migration] Adding phone column to users table...');
        await knex.schema.alterTable('users', table => {
            table.string('phone', 20).nullable();
        });
        console.log('✅ [Migration] Added phone column to users table');
    } else {
        console.log('✅ [Migration] phone column already exists');
    }

    // Check and add is_super_admin column
    const hasSuperAdmin = await knex.schema.hasColumn('users', 'is_super_admin');
    if (!hasSuperAdmin) {
        console.log('🔄 [Migration] Adding is_super_admin column to users table...');
        await knex.schema.alterTable('users', table => {
            table.boolean('is_super_admin').defaultTo(false);
        });
        console.log('✅ [Migration] Added is_super_admin column to users table');
    } else {
        console.log('✅ [Migration] is_super_admin column already exists');
    }

    console.log('✅ [Migration] add_missing_user_columns completed successfully');
};

exports.down = async function (knex) {
    const hasTable = await knex.schema.hasTable('users');
    if (!hasTable) return;

    // Remove phone column if it exists
    const hasPhone = await knex.schema.hasColumn('users', 'phone');
    if (hasPhone) {
        await knex.schema.alterTable('users', table => {
            table.dropColumn('phone');
        });
    }

    // Remove is_super_admin column if it exists
    const hasSuperAdmin = await knex.schema.hasColumn('users', 'is_super_admin');
    if (hasSuperAdmin) {
        await knex.schema.alterTable('users', table => {
            table.dropColumn('is_super_admin');
        });
    }
};
