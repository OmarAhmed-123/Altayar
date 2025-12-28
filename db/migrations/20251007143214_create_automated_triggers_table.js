exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('automated_triggers');
  if (hasTable) {
    console.log('✅ [Migration] automated_triggers table already exists, skipping creation');
    return;
  }
  
  const hasUsersTable = await knex.schema.hasTable('users');
  
  return knex.schema.createTable('automated_triggers', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.string('event_type').notNullable();
    table.jsonb('conditions').defaultTo('{}');
    table.jsonb('actions').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    if (hasUsersTable) {
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    } else {
      table.integer('created_by').unsigned().nullable();
    }
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('automated_triggers');
};