exports.up = function(knex) {
  return knex.schema.createTable('campaign_recipients', table => {
    table.increments('id').primary();
    table.integer('campaign_id').unsigned().notNullable().references('id').inTable('marketing_campaigns').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('status').defaultTo('sent'); // 'sent', 'opened', 'clicked', 'failed'
    table.timestamp('sent_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('campaign_recipients');
};