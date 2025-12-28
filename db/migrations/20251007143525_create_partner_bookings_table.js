exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('partner_bookings');
  if (hasTable) {
    console.log('✅ [Migration] partner_bookings table already exists, skipping creation');
    return;
  }
  
  const hasPartnersTable = await knex.schema.hasTable('partners');
  const hasUsersTable = await knex.schema.hasTable('users');
  const hasPartnerServicesTable = await knex.schema.hasTable('partner_services');
  
  if (!hasPartnersTable || !hasPartnerServicesTable) {
    console.warn('⚠️  [Migration] Required tables do not exist. Skipping partner_bookings table creation.');
    return;
  }
  
  return knex.schema.createTable('partner_bookings', table => {
    table.increments('id').primary();
    table.integer('partner_id').unsigned().notNullable().references('id').inTable('partners').onDelete('CASCADE');
    if (hasUsersTable) {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    } else {
      table.integer('user_id').unsigned().nullable();
    }
    table.integer('partner_service_id').unsigned().notNullable().references('id').inTable('partner_services').onDelete('CASCADE');
    table.string('booking_reference').unique().notNullable();
    table.decimal('total_price', 10, 2).notNullable();
    table.decimal('partner_commission', 10, 2).defaultTo(0.00);
    table.string('status').defaultTo('pending');
    table.jsonb('customer_details').defaultTo('{}');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('partner_bookings');
};