exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('review_helpfulness');
  if (hasTable) {
    console.log('✅ [Migration] review_helpfulness table already exists, skipping creation');
    return;
  }
  
  const hasReviewsTable = await knex.schema.hasTable('reviews');
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasReviewsTable || !hasUsersTable) {
    console.warn('⚠️  [Migration] Required tables do not exist. Skipping review_helpfulness table creation.');
    return;
  }
  
  return knex.schema.createTable('review_helpfulness', table => {
    table.increments('id').primary();
    table.integer('review_id').unsigned().notNullable().references('id').inTable('reviews').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_helpful').notNullable();
    table.timestamps(true, true);
    table.unique(['review_id', 'user_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('review_helpfulness');
};