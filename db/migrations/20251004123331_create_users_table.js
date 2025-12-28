exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('users');
  if (hasTable) {
    console.log('✅ [Migration] users table already exists, skipping creation');
    return;
  }
  
  // Check if memberships table exists (for foreign key)
  const hasMembershipsTable = await knex.schema.hasTable('memberships');
  
  return knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.enum('role', ['super_admin', 'admin', 'hr', 'sales', 'reservations', 'data_entry', 'accountant', 'customer']).defaultTo('customer');
    
    // Create membership_id column
    if (hasMembershipsTable) {
      // If memberships table exists, create foreign key
      table.integer('membership_id').unsigned().references('id').inTable('memberships').onDelete('SET NULL');
    } else {
      // If memberships table doesn't exist, create column without foreign key
      // Foreign key can be added later when memberships table is created
      table.integer('membership_id').unsigned().nullable();
    }
    
    table.integer('points').defaultTo(0);
    table.decimal('cashback', 10, 2).defaultTo(0);
    table.string('profile_picture_url').defaultTo('');
    table.timestamps(true, true);
  });
};
exports.down = function(knex) { return knex.schema.dropTable('users'); };