exports.up = function(knex) {
  return knex.schema.createTable('marketing_campaigns', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.string('campaign_type').notNullable(); // e.g., 'email', 'sms', 'notification', 'voucher'
    table.jsonb('target_audience').defaultTo('{}'); // Criteria for targeting users
    table.jsonb('content').defaultTo('{}'); // Email body, SMS text, notification message
    table.timestamp('start_date');
    table.timestamp('end_date');
    table.string('status').defaultTo('draft'); // 'draft', 'scheduled', 'active', 'completed', 'cancelled'
    table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('marketing_campaigns');
};