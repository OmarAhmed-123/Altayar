/**
 * Migration: Add reels columns to blogs table
 * Run with: npx knex migrate:latest
 */

exports.up = function(knex) {
  return knex.schema.table('blogs', function(table) {
    // Add media_url column if it doesn't exist
    table.string('media_url').nullable();
    
    // Add media_type column if it doesn't exist
    table.string('media_type', 50).nullable(); // 'image' or 'video'
    
    // Add is_reel column if it doesn't exist
    table.boolean('is_reel').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.table('blogs', function(table) {
    table.dropColumn('media_url');
    table.dropColumn('media_type');
    table.dropColumn('is_reel');
  });
};

