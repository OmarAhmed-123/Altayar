exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('partner_services');
  if (hasTable) {
    console.log('✅ [Migration] partner_services table already exists, skipping creation');
    return;
  }
  
  const hasPartnersTable = await knex.schema.hasTable('partners');
  if (!hasPartnersTable) {
    console.warn('⚠️  [Migration] partners table does not exist. Skipping partner_services table creation.');
    return;
  }
  
  return knex.schema.createTable('partner_services', table => {
    table.increments('id').primary();
    table.integer('partner_id').unsigned().notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description');
    table.string('service_type').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.jsonb('details').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('partner_services');
};