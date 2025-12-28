exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('campaign_recipients');
  if (hasTable) {
    console.log('✅ [Migration] campaign_recipients table already exists, skipping creation');
    return;
  }
  
  const hasCampaignsTable = await knex.schema.hasTable('marketing_campaigns');
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasCampaignsTable || !hasUsersTable) {
    console.warn('⚠️  [Migration] Required tables do not exist. Skipping campaign_recipients table creation.');
    return;
  }
  
  return knex.schema.createTable('campaign_recipients', table => {
    table.increments('id').primary();
    table.integer('campaign_id').unsigned().notNullable().references('id').inTable('marketing_campaigns').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('status').defaultTo('sent');
    table.timestamp('sent_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('campaign_recipients');
};