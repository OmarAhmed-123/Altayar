/**
 * Migration: Add tier column to memberships table
 * This migration adds the tier column to the memberships table
 * to support better PDF file matching
 */

exports.up = async function(knex) {
  // Check if tier column already exists
  const hasColumn = await knex.schema.hasColumn('memberships', 'tier');
  
  if (!hasColumn) {
    await knex.schema.table('memberships', function(table) {
      table.string('tier').nullable().after('name');
    });
  }
  
  // Update existing memberships with tier based on name if tier is null, empty, or "null"
  const memberships = await knex('memberships')
    .whereNull('tier')
    .orWhere('tier', '')
    .orWhere('tier', 'null');
  
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
    
    return knex('memberships')
      .where('id', membership.id)
      .update({ tier: tier });
  });
  
  await Promise.all(updates);
  
  // Also clean up any "null" string values
  await knex('memberships')
    .where('tier', 'null')
    .update({ tier: null });
  
  console.log('✅ Migration completed: Added tier column to memberships table');
};

exports.down = function(knex) {
  return knex.schema.table('memberships', function(table) {
    table.dropColumn('tier');
  });
};

