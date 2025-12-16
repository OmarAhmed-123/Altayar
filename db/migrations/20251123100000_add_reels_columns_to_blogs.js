/**
 * Migration: Add reels columns to blogs table
 * Adds media_url, media_type, and is_reel columns to support reels functionality
 */

exports.up = async function(knex) {
  // Use raw SQL to check and add columns safely
  const hasColumn = async (tableName, columnName) => {
    const result = await knex.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = ? AND column_name = ?
    `, [tableName, columnName]);
    return result.rows && result.rows.length > 0;
  };
  
  // Check if columns exist
  const hasMediaUrl = await hasColumn('blogs', 'media_url');
  const hasMediaType = await hasColumn('blogs', 'media_type');
  const hasIsReel = await hasColumn('blogs', 'is_reel');
  
  // Add columns if they don't exist
  const alterPromises = [];
  
  if (!hasMediaUrl) {
    alterPromises.push(
      knex.raw('ALTER TABLE blogs ADD COLUMN IF NOT EXISTS media_url VARCHAR(255)')
    );
  }
  
  if (!hasMediaType) {
    alterPromises.push(
      knex.raw('ALTER TABLE blogs ADD COLUMN IF NOT EXISTS media_type VARCHAR(50)')
    );
  }
  
  if (!hasIsReel) {
    alterPromises.push(
      knex.raw('ALTER TABLE blogs ADD COLUMN IF NOT EXISTS is_reel BOOLEAN DEFAULT false')
    );
  }
  
  if (alterPromises.length > 0) {
    await Promise.all(alterPromises);
  }
  
  return Promise.resolve();
};

exports.down = function(knex) {
  return knex.schema.alterTable('blogs', function(table) {
    table.dropColumn('media_url');
    table.dropColumn('media_type');
    table.dropColumn('is_reel');
  });
};

