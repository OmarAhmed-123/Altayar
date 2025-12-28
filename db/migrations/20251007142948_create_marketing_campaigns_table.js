exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('marketing_campaigns');
  if (hasTable) {
    console.log('✅ [Migration] marketing_campaigns table already exists, skipping creation');
    return;
  }
  
  const hasUsersTable = await knex.schema.hasTable('users');
  
  return knex.schema.createTable('marketing_campaigns', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.string('campaign_type').notNullable();
    table.jsonb('target_audience').defaultTo('{}');
    table.jsonb('content').defaultTo('{}');
    table.timestamp('start_date');
    table.timestamp('end_date');
    table.string('status').defaultTo('draft');
    if (hasUsersTable) {
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    } else {
      table.integer('created_by').unsigned().nullable();
    }
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('marketing_campaigns');
};