exports.up = function(knex) {
  return knex.schema.createTable('partners', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE'); // User account for partner login
    table.string('company_name').notNullable();
    table.string('contact_person');
    table.string('email').unique().notNullable();
    table.string('phone');
    table.string('address');
    table.string('partner_type').notNullable(); // e.g., 'hotel', 'airline', 'tour_operator', 'agent'
    table.decimal('commission_rate', 5, 2).defaultTo(0.00);
    table.string('status').defaultTo('pending'); // 'pending', 'active', 'suspended'
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('partners');
};