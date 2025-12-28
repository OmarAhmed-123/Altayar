/**
 * Migration: Add blog views tracking
 * - Adds views_count, destination, tags columns on blogs table
 * - Creates blog_views table to store unique viewers
 */

exports.up = async function up(knex) {
  // Check if blogs table exists
  const hasBlogsTable = await knex.schema.hasTable('blogs');
  if (!hasBlogsTable) {
    console.warn('⚠️  [Migration] blogs table does not exist. Skipping blog views tracking.');
    return;
  }
  
  const hasViewsColumn = await knex.schema.hasColumn('blogs', 'views_count');
  const hasDestinationColumn = await knex.schema.hasColumn('blogs', 'destination');
  const hasTagsColumn = await knex.schema.hasColumn('blogs', 'tags');

  await knex.schema.alterTable('blogs', table => {
    if (!hasViewsColumn) {
      table.integer('views_count').notNullable().defaultTo(0);
    }
    if (!hasDestinationColumn) {
      table.string('destination');
    }
    if (!hasTagsColumn) {
      table.json('tags');
    }
  });

  const hasBlogViews = await knex.schema.hasTable('blog_views');
  if (!hasBlogViews) {
    await knex.schema.createTable('blog_views', table => {
      table.increments('id').primary();
      table
        .integer('blog_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('blogs')
        .onDelete('CASCADE');
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
      table.string('visitor_fingerprint', 128).notNullable();
      table.timestamp('last_viewed_at').defaultTo(knex.fn.now());
      table.timestamps(true, true);

      table.unique(['blog_id', 'visitor_fingerprint']);
      table.index(['blog_id', 'user_id']);
    });
  }
};

exports.down = async function down(knex) {
  const hasBlogViews = await knex.schema.hasTable('blog_views');
  if (hasBlogViews) {
    await knex.schema.dropTable('blog_views');
  }

  const hasViewsColumn = await knex.schema.hasColumn('blogs', 'views_count');
  const hasDestinationColumn = await knex.schema.hasColumn('blogs', 'destination');
  const hasTagsColumn = await knex.schema.hasColumn('blogs', 'tags');

  await knex.schema.alterTable('blogs', table => {
    if (hasViewsColumn) {
      table.dropColumn('views_count');
    }
    if (hasDestinationColumn) {
      table.dropColumn('destination');
    }
    if (hasTagsColumn) {
      table.dropColumn('tags');
    }
  });
};

