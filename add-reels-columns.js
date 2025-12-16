/**
 * Script to add reels columns to blogs table
 * Run with: node add-reels-columns.js
 */

require('dotenv').config();
const knex = require('knex')(require('./knexfile.js').development);

async function addColumns() {
  try {
    console.log('🔄 Adding reels columns to blogs table...\n');
    
    // Add columns using raw SQL (PostgreSQL)
    const queries = [
      `ALTER TABLE blogs ADD COLUMN IF NOT EXISTS media_url VARCHAR(255)`,
      `ALTER TABLE blogs ADD COLUMN IF NOT EXISTS media_type VARCHAR(50)`,
      `ALTER TABLE blogs ADD COLUMN IF NOT EXISTS is_reel BOOLEAN DEFAULT false`
    ];
    
    for (const query of queries) {
      try {
        await knex.raw(query);
        console.log(`✅ Executed: ${query.substring(0, 50)}...`);
      } catch (err) {
        // If column already exists, that's fine
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log(`ℹ️  Column already exists (skipped)`);
        } else {
          throw err;
        }
      }
    }
    
    // Verify columns exist
    console.log('\n📊 Verifying columns...');
    const hasMediaUrl = await knex.schema.hasColumn('blogs', 'media_url');
    const hasMediaType = await knex.schema.hasColumn('blogs', 'media_type');
    const hasIsReel = await knex.schema.hasColumn('blogs', 'is_reel');
    
    console.log('  - media_url:', hasMediaUrl ? '✅' : '❌');
    console.log('  - media_type:', hasMediaType ? '✅' : '❌');
    console.log('  - is_reel:', hasIsReel ? '✅' : '❌');
    
    if (hasMediaUrl && hasMediaType && hasIsReel) {
      console.log('\n🎉 All columns are present! Database is ready for reels.');
      console.log('✅ You can now upload reels without errors.');
    } else {
      console.log('\n⚠️  Some columns are missing. Please check manually.');
    }
    
    await knex.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await knex.destroy();
    process.exit(1);
  }
}

addColumns();

