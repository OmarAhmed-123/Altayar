/**
 * Script to run database migration
 * Run with: node run-migration.js
 */

require('dotenv').config();
const knex = require('knex')(require('./knexfile.js').development);

async function runMigration() {
  try {
    console.log('🔄 Running migrations...');
    
    // First, try to add columns directly using raw SQL (safer approach)
    console.log('📝 Adding columns directly...');
    
    try {
      await knex.raw(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'media_url') THEN
            ALTER TABLE blogs ADD COLUMN media_url VARCHAR(255);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'media_type') THEN
            ALTER TABLE blogs ADD COLUMN media_type VARCHAR(50);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'is_reel') THEN
            ALTER TABLE blogs ADD COLUMN is_reel BOOLEAN DEFAULT false;
          END IF;
        END $$;
      `);
      console.log('✅ Columns added successfully using raw SQL!');
    } catch (rawError) {
      console.log('⚠️  Raw SQL approach failed, trying migration...');
      console.log('Error:', rawError.message);
      
      // Fallback to migration
      const [batchNo, log] = await knex.migrate.latest();
      console.log('✅ Migration completed successfully!');
      console.log('📋 Batch number:', batchNo);
      console.log('📝 Migrations run:', log);
    }
    
    // Verify columns exist
    const hasMediaUrl = await knex.schema.hasColumn('blogs', 'media_url');
    const hasMediaType = await knex.schema.hasColumn('blogs', 'media_type');
    const hasIsReel = await knex.schema.hasColumn('blogs', 'is_reel');
    
    console.log('\n📊 Column Status:');
    console.log('  - media_url:', hasMediaUrl ? '✅' : '❌');
    console.log('  - media_type:', hasMediaType ? '✅' : '❌');
    console.log('  - is_reel:', hasIsReel ? '✅' : '❌');
    
    if (hasMediaUrl && hasMediaType && hasIsReel) {
      console.log('\n🎉 All columns are present! Database is ready.');
    } else {
      console.log('\n⚠️  Some columns are missing. Please check the migration.');
    }
    
    await knex.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error(error.stack);
    await knex.destroy();
    process.exit(1);
  }
}

runMigration();

