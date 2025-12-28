exports.up = async function(knex) {
  // Check if required tables exist
  const hasUsersTable = await knex.schema.hasTable('users');
  const hasMembershipsTable = await knex.schema.hasTable('memberships');
  const hasMembershipCardsTable = await knex.schema.hasTable('membership_cards');
  
  if (hasMembershipCardsTable) {
    console.log('✅ [Migration] membership_cards table already exists.');
    return;
  }
  
  if (!hasUsersTable || !hasMembershipsTable) {
    console.warn('⚠️  [Migration] Required tables (users, memberships) do not exist. Skipping membership_cards table creation.');
    console.warn('💡 [Migration] This migration will be applied when required tables are created.');
    return;
  }
  
  return knex.schema.createTable('membership_cards', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('membership_id').unsigned().notNullable().references('id').inTable('memberships').onDelete('CASCADE');
    table.string('card_number').unique().notNullable();
    table.string('pdf_url').notNullable();
    table.string('qr_code_url');
    table.date('issue_date').defaultTo(knex.fn.now());
    table.date('expiry_date');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('membership_cards');
};