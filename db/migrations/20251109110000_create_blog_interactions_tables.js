/**
 * Migration: Create blog_saves and blog_shares tables
 * Run with: npx knex migrate:latest
 */

exports.up = async function(knex) {
  const hasBlogSavesTable = await knex.schema.hasTable('blog_saves');
  const hasBlogSharesTable = await knex.schema.hasTable('blog_shares');
  
  if (hasBlogSavesTable && hasBlogSharesTable) {
    console.log('✅ [Migration] blog_interactions tables already exist, skipping creation');
    return;
  }
  
  const hasBlogsTable = await knex.schema.hasTable('blogs');
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasBlogsTable || !hasUsersTable) {
    console.warn('⚠️  [Migration] Required tables (blogs, users) do not exist. Skipping blog_interactions tables creation.');
    return;
  }
  
  return Promise.all([
    // Create blog_saves table
    !hasBlogSavesTable ? knex.schema.createTable('blog_saves', function(table) {
      table.increments('id').primary();
      table.integer('blog_id').unsigned().notNullable();
      table.integer('user_id').unsigned().notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.foreign('blog_id').references('id').inTable('blogs').onDelete('CASCADE');
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      
      table.unique(['blog_id', 'user_id']);
    }) : Promise.resolve(),

    // Create blog_shares table
    !hasBlogSharesTable ? knex.schema.createTable('blog_shares', function(table) {
      table.increments('id').primary();
      table.integer('blog_id').unsigned().notNullable();
      table.integer('user_id').unsigned().notNullable();
      table.string('share_type', 50).defaultTo('app');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.foreign('blog_id').references('id').inTable('blogs').onDelete('CASCADE');
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    }) : Promise.resolve()
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('blog_shares'),
    knex.schema.dropTableIfExists('blog_saves')
  ]);
};

