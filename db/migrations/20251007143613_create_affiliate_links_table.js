exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('affiliate_links');
  if (hasTable) {
    console.log('✅ [Migration] affiliate_links table already exists, skipping creation');
    return;
  }
  
  const hasUsersTable = await knex.schema.hasTable('users');
  const hasCampaignsTable = await knex.schema.hasTable('affiliate_campaigns');
  
  if (!hasUsersTable || !hasCampaignsTable) {
    console.warn('⚠️  [Migration] Required tables do not exist. Skipping affiliate_links table creation.');
    return;
  }
  
  return knex.schema.createTable('affiliate_links', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('campaign_id').unsigned().notNullable().references('id').inTable('affiliate_campaigns').onDelete('CASCADE');
    table.string('code').unique().notNullable();
    table.string('link_url').notNullable();
    table.integer('clicks').defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('affiliate_links');
};