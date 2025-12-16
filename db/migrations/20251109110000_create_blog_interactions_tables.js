/**
 * Migration: Create blog_saves and blog_shares tables
 * Run with: npx knex migrate:latest
 */

exports.up = function(knex) {
  return Promise.all([
    // Create blog_saves table
    knex.schema.createTable('blog_saves', function(table) {
      table.increments('id').primary();
      table.integer('blog_id').unsigned().notNullable();
      table.integer('user_id').unsigned().notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.foreign('blog_id').references('id').inTable('blogs').onDelete('CASCADE');
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      
      // Unique constraint: user can only save a blog once
      table.unique(['blog_id', 'user_id']);
    }),

    // Create blog_shares table
    knex.schema.createTable('blog_shares', function(table) {
      table.increments('id').primary();
      table.integer('blog_id').unsigned().notNullable();
      table.integer('user_id').unsigned().notNullable();
      table.string('share_type', 50).defaultTo('app'); // app, whatsapp, facebook, etc.
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.foreign('blog_id').references('id').inTable('blogs').onDelete('CASCADE');
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('blog_shares'),
    knex.schema.dropTableIfExists('blog_saves')
  ]);
};

