exports.up = function(knex) {
  return knex.schema.createTable('membership_cards', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('membership_id').unsigned().notNullable().references('id').inTable('memberships').onDelete('CASCADE');
    table.string('card_number').unique().notNullable();
    table.string('pdf_url').notNullable();
    table.string('qr_code_url');
    table.date('issue_date').defaultTo(knex.fn.now());
    table.date('expiry_date');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('membership_cards');
};