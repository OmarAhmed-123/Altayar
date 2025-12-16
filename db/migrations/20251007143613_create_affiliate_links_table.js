exports.up = function(knex) {
  return knex.schema.createTable('affiliate_links', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('campaign_id').unsigned().notNullable().references('id').inTable('affiliate_campaigns').onDelete('CASCADE');
    table.string('code').unique().notNullable(); // Unique affiliate code
    table.string('link_url').notNullable(); // The actual URL with the code
    table.integer('clicks').defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('affiliate_links');
};