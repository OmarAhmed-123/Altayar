/**
 * Script to fix membership tier values in database
 * This script updates all memberships with proper tier values based on their names
 * Run this script if migration doesn't work or to fix existing data
 */

const knex = require('knex');
const knexfile = require('./knexfile');

async function fixMembershipTiers() {
  const db = knex(knexfile.development || knexfile);
  
  try {
    console.log('🔧 Starting membership tier fix...');
    
    // Get all memberships
    const memberships = await db('memberships').select('*');
    
    console.log(`📊 Found ${memberships.length} memberships to process`);
    
    const updates = memberships.map(membership => {
      const name = (membership.name || '').toLowerCase();
      let tier = 'Silver'; // default
      
      // Check Arabic names first
      if (name.includes('برونزية') || name.includes('برونزي')) {
        tier = 'Bronze';
      } else if (name.includes('فضية') || name.includes('فضي')) {
        tier = 'Silver';
      } else if (name.includes('ذهبية') || name.includes('ذهبي')) {
        tier = 'Gold';
      } else if (name.includes('بلاتينية') || name.includes('بلاتيني')) {
        tier = 'Platinum';
      } else if (name.includes('vip') || name.includes('في اي بي')) {
        tier = 'VIP';
      } else if (name.includes('الماسية') || name.includes('الماسي') || name.includes('الألماس')) {
        tier = 'Diamond';
      } else if (name.includes('تجارية') || name.includes('تجاري') || name.includes('أعمال')) {
        tier = 'Business';
      } else if (name.includes('business')) {
        tier = 'Business';
      } else if (name.includes('diamond')) {
        tier = 'Diamond';
      } else if (name.includes('vip')) {
        tier = 'VIP';
      } else if (name.includes('platinum')) {
        tier = 'Platinum';
      } else if (name.includes('gold')) {
        tier = 'Gold';
      } else if (name.includes('silver')) {
        tier = 'Silver';
      }
      
      console.log(`  - Membership ID ${membership.id}: "${membership.name}" -> Tier: ${tier}`);
      
      return db('memberships')
        .where('id', membership.id)
        .update({ tier: tier });
    });
    
    await Promise.all(updates);
    
    // Clean up any "null" string values
    const nullStringCount = await db('memberships').where('tier', 'null').count('* as count').first();
    if (nullStringCount && nullStringCount.count > 0) {
      console.log(`🧹 Cleaning up ${nullStringCount.count} "null" string values...`);
      await db('memberships').where('tier', 'null').update({ tier: null });
    }
    
    console.log('✅ Membership tier fix completed successfully!');
  } catch (error) {
    console.error('❌ Error fixing membership tiers:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run the script
fixMembershipTiers();

