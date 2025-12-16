exports.up = function(knex) {
  return knex.schema.createTable('affiliate_referrals', table => {
    table.increments('id').primary();
    table.integer('affiliate_link_id').unsigned().notNullable().references('id').inTable('affiliate_links').onDelete('CASCADE');
    table.integer('referred_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL'); // The user who was referred
    table.string('referred_email'); // If user not registered
    table.decimal('earned_commission', 10, 2).defaultTo(0.00);
    table.string('commission_currency');
    table.integer('earned_points').defaultTo(0);
    table.string('status').defaultTo('pending'); // 'pending', 'approved', 'paid', 'cancelled'
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('affiliate_referrals');
};