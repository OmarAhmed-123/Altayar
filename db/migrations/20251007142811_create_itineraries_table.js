exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('itineraries');
  if (hasTable) {
    console.log('✅ [Migration] itineraries table already exists, skipping creation');
    return;
  }
  
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping itineraries table creation.');
    return;
  }
  
  return knex.schema.createTable('itineraries', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description');
    table.date('start_date');
    table.date('end_date');
    table.jsonb('destinations').defaultTo('[]');
    table.jsonb('travel_details').defaultTo('{}');
    table.string('share_code').unique();
    table.boolean('is_public').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('itineraries');
};