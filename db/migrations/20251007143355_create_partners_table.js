exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('partners');
  if (hasTable) {
    console.log('✅ [Migration] partners table already exists, skipping creation');
    return;
  }
  
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping partners table creation.');
    return;
  }
  
  return knex.schema.createTable('partners', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('company_name').notNullable();
    table.string('contact_person');
    table.string('email').unique().notNullable();
    table.string('phone');
    table.string('address');
    table.string('partner_type').notNullable();
    table.decimal('commission_rate', 5, 2).defaultTo(0.00);
    table.string('status').defaultTo('pending');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('partners');
};