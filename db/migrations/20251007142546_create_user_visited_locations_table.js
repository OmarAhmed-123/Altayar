exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('user_visited_locations');
  if (hasTable) {
    console.log('✅ [Migration] user_visited_locations table already exists, skipping creation');
    return;
  }
  
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    console.warn('⚠️  [Migration] users table does not exist. Skipping user_visited_locations table creation.');
    return;
  }
  
  return knex.schema.createTable('user_visited_locations', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('location_name').notNullable();
    table.decimal('latitude', 9, 6);
    table.decimal('longitude', 9, 6);
    table.string('country');
    table.string('city');
    table.string('source').defaultTo('manual');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_visited_locations');
};