exports.up = async function(knex) {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('vouchers');
  if (hasTable) {
    console.log('✅ [Migration] vouchers table already exists, skipping creation');
    return;
  }
  
  // Check if users table exists
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping vouchers table creation.');
    console.warn('💡 [Migration] This migration will be applied when users table is created.');
    return;
  }
  
  return knex.schema.createTable('vouchers', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('code').notNullable().unique();
    table.enum('type', ['dinner', 'breakfast', 'spa', 'gym', 'dental_cleaning', 'makeup', 'manual_gift']).notNullable();
    table.decimal('value', 10, 2).defaultTo(0);
    table.string('description');
    table.integer('issued_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('expires_at');
    table.boolean('is_used').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('vouchers');
};