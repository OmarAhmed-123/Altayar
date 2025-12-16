exports.up = function(knex) {
  return knex.schema.createTable('automated_triggers', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.string('event_type').notNullable(); // e.g., 'user_registered', 'booking_completed', 'birthday', 'inactivity'
    table.jsonb('conditions').defaultTo('{}'); // JSON object for trigger conditions
    table.jsonb('actions').defaultTo('{}'); // JSON object for actions (e.g., send email, create voucher)
    table.boolean('is_active').defaultTo(true);
    table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('automated_triggers');
};