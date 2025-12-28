exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('affiliate_referrals');
  if (hasTable) {
    console.log('✅ [Migration] affiliate_referrals table already exists, skipping creation');
    return;
  }
  
  const hasAffiliateLinksTable = await knex.schema.hasTable('affiliate_links');
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasAffiliateLinksTable) {
    console.warn('⚠️  [Migration] affiliate_links table does not exist. Skipping affiliate_referrals table creation.');
    return;
  }
  
  return knex.schema.createTable('affiliate_referrals', table => {
    table.increments('id').primary();
    table.integer('affiliate_link_id').unsigned().notNullable().references('id').inTable('affiliate_links').onDelete('CASCADE');
    if (hasUsersTable) {
      table.integer('referred_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    } else {
      table.integer('referred_user_id').unsigned().nullable();
    }
    table.string('referred_email');
    table.decimal('earned_commission', 10, 2).defaultTo(0.00);
    table.string('commission_currency');
    table.integer('earned_points').defaultTo(0);
    table.string('status').defaultTo('pending');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('affiliate_referrals');
};