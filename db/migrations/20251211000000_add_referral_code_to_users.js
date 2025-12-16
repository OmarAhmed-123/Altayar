/**
 * Migration: Add referral_code column to users table
 * This migration is idempotent - it can be run multiple times safely
 */

exports.up = async function(knex) {
  // Check if column already exists
  const hasReferralCode = await knex.schema.hasColumn('users', 'referral_code');
  
  if (!hasReferralCode) {
    await knex.schema.alterTable('users', table => {
      table.string('referral_code').nullable().unique();
    });
    
    console.log('✅ Added referral_code column to users table');
    
    // Generate referral codes for existing users who don't have one
    const usersWithoutCode = await knex('users')
      .whereNull('referral_code')
      .select('id');
    
    for (const user of usersWithoutCode) {
      const referralCode = `ALT-${user.id.toString().padStart(6, '0')}-${Date.now().toString().slice(-4)}`;
      await knex('users')
        .where('id', user.id)
        .update({ referral_code: referralCode });
    }
    
    console.log(`✅ Generated referral codes for ${usersWithoutCode.length} existing users`);
  } else {
    console.log('ℹ️  referral_code column already exists in users table, skipping');
  }
};

exports.down = async function(knex) {
  const hasReferralCode = await knex.schema.hasColumn('users', 'referral_code');
  
  if (hasReferralCode) {
    await knex.schema.alterTable('users', table => {
      table.dropColumn('referral_code');
    });
    
    console.log('✅ Removed referral_code column from users table');
  } else {
    console.log('ℹ️  referral_code column does not exist, skipping');
  }
};

