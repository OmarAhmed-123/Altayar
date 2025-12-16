exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.enum('role', ['super_admin', 'admin', 'hr', 'sales', 'reservations', 'data_entry', 'accountant', 'customer']).defaultTo('customer');
    table.integer('membership_id').unsigned().references('id').inTable('memberships').onDelete('SET NULL');
    table.integer('points').defaultTo(0);
    table.decimal('cashback', 10, 2).defaultTo(0);
    table.string('profile_picture_url').defaultTo('');
    table.timestamps(true, true);
  });
};
exports.down = function(knex) { return knex.schema.dropTable('users'); };