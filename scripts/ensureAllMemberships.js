/**
 * Script to ensure all 6 required memberships exist in the database
 * Required memberships: Diamond, Business, Gold, Platinum, Silver, VIP
 */

require('dotenv').config();
const { Model } = require('objection');
const Knex = require('knex');
const knexConfig = require('../knexfile');

// Initialize Knex
const knex = Knex(knexConfig.development);
Model.knex(knex);

// Import Membership Model
const Membership = require('../models/Membership');

// Define all 6 required memberships with Arabic names and proper tiers
const requiredMemberships = [
  {
    name: 'عضوية فضية',
    tier: 'Silver',
    price: 149.0,
    points: 500,
    point_multiplier: 1.0,
    cashback_rate: 1.5,
    welcome_points: 100,
    welcome_cashback: 5,
    duration_days: 365,
    benefits: [
      'خصم 5% على الرحلات',
      'دعم أولوية',
      'تتبع نقاط ذكي',
    ],
    description: 'بداية مثالية للمنضمين الجدد',
    is_active: true,
  },
  {
    name: 'عضوية ذهبية',
    tier: 'Gold',
    price: 349.0,
    points: 1500,
    point_multiplier: 1.5,
    cashback_rate: 2.5,
    welcome_points: 350,
    welcome_cashback: 25,
    duration_days: 365,
    benefits: [
      'خصم 10% على الفنادق',
      'استشاري سفر متخصص',
      'هدايا ترحيبية',
    ],
    description: 'الأكثر مبيعاً لعشاق السفر',
    is_active: true,
  },
  {
    name: 'عضوية بلاتينية',
    tier: 'Platinum',
    price: 599.0,
    points: 2500,
    point_multiplier: 1.75,
    cashback_rate: 3.5,
    welcome_points: 600,
    welcome_cashback: 40,
    duration_days: 365,
    benefits: [
      'خصم 15% على جميع الخدمات',
      'دعم فني متميز',
      'ترقية مجانية للرحلات',
      'دعوات حصرية',
    ],
    description: 'مستوى متقدم من الامتيازات',
    is_active: true,
  },
  {
    name: 'عضوية VIP',
    tier: 'VIP',
    price: 799.0,
    points: 3000,
    point_multiplier: 2.0,
    cashback_rate: 4.5,
    welcome_points: 900,
    welcome_cashback: 60,
    duration_days: 365,
    benefits: [
      'إدارة رحلات خاصة',
      'مساعد شخصي 24/7',
      'ترقية مجانية للفنادق',
      'دعوات خاصة للأحداث',
    ],
    description: 'أعلى مستوى من الامتياز',
    is_active: true,
  },
  {
    name: 'عضوية ماسية',
    tier: 'Diamond',
    price: 1299.0,
    points: 5000,
    point_multiplier: 2.5,
    cashback_rate: 6.0,
    welcome_points: 1500,
    welcome_cashback: 100,
    duration_days: 365,
    benefits: [
      'خصم 20% على جميع الخدمات',
      'مدير رحلات شخصي',
      'ترقية VIP في الفنادق',
      'دعوات حصرية للأحداث',
      'خدمة نقل مجانية',
    ],
    description: 'تجربة فاخرة لا تُنسى',
    is_active: true,
  },
  {
    name: 'عضوية الأعمال',
    tier: 'Business',
    price: 1999.0,
    points: 8000,
    point_multiplier: 3.0,
    cashback_rate: 8.0,
    welcome_points: 2500,
    welcome_cashback: 150,
    duration_days: 365,
    benefits: [
      'خصم 25% على جميع الخدمات',
      'فريق دعم مخصص',
      'ترقية VIP في جميع الفنادق',
      'دعوات حصرية للأحداث',
      'خدمة نقل VIP',
      'إدارة رحلات جماعية',
    ],
    description: 'الحل الأمثل للشركات',
    is_active: true,
  },
];

async function ensureAllMemberships() {
  try {
    console.log('🔍 Checking and creating required memberships...\n');

    // Check available columns once at the beginning
    const tableInfo = await knex('information_schema.columns')
      .where({ table_name: 'memberships', table_schema: 'public' })
      .select('column_name');

    const columnNames = tableInfo.map(col => col.column_name);
    const hasExtendedFields = {
      point_multiplier: columnNames.includes('point_multiplier'),
      cashback_rate: columnNames.includes('cashback_rate'),
      welcome_points: columnNames.includes('welcome_points'),
      welcome_cashback: columnNames.includes('welcome_cashback'),
      duration_days: columnNames.includes('duration_days'),
      description: columnNames.includes('description'),
      tier: columnNames.includes('tier'),
    };

    const createdMemberships = [];
    const updatedMemberships = [];

    for (const membershipData of requiredMemberships) {
      // Check if membership exists by tier (case-insensitive) or by name
      let existing = null;
      
      if (hasExtendedFields.tier) {
        existing = await Membership.query()
          .whereRaw('LOWER(tier) = ?', [membershipData.tier.toLowerCase()])
          .first();
      }
      
      // If not found by tier, try by name
      if (!existing) {
        existing = await Membership.query()
          .whereRaw('LOWER(name) = ?', [membershipData.name.toLowerCase()])
          .first();
      }

      if (existing) {
        // Update existing membership to match required data
        const updateData = {
          name: membershipData.name,
          price: membershipData.price,
          points: membershipData.points,
          benefits: membershipData.benefits,
          is_active: membershipData.is_active,
        };

        // Add extended fields if they exist in database
        if (hasExtendedFields.point_multiplier) {
          updateData.point_multiplier = membershipData.point_multiplier;
        }
        if (hasExtendedFields.cashback_rate) {
          updateData.cashback_rate = membershipData.cashback_rate;
        }
        if (hasExtendedFields.welcome_points) {
          updateData.welcome_points = membershipData.welcome_points;
        }
        if (hasExtendedFields.welcome_cashback) {
          updateData.welcome_cashback = membershipData.welcome_cashback;
        }
        if (hasExtendedFields.duration_days) {
          updateData.duration_days = membershipData.duration_days;
        }
        if (hasExtendedFields.description) {
          updateData.description = membershipData.description;
        }
        if (hasExtendedFields.tier) {
          updateData.tier = membershipData.tier;
        }

        await Membership.query()
          .findById(existing.id)
          .patch(updateData);
        updatedMemberships.push(membershipData.tier);
        console.log(`  ✅ Updated: ${membershipData.tier} - ${membershipData.name}`);
      } else {
        // Create new membership - only include fields that exist
        const insertData = {
          name: membershipData.name,
          price: membershipData.price,
          points: membershipData.points,
          benefits: membershipData.benefits,
          is_active: membershipData.is_active,
        };

        // Add extended fields if they exist in database
        if (hasExtendedFields.point_multiplier) {
          insertData.point_multiplier = membershipData.point_multiplier;
        }
        if (hasExtendedFields.cashback_rate) {
          insertData.cashback_rate = membershipData.cashback_rate;
        }
        if (hasExtendedFields.welcome_points) {
          insertData.welcome_points = membershipData.welcome_points;
        }
        if (hasExtendedFields.welcome_cashback) {
          insertData.welcome_cashback = membershipData.welcome_cashback;
        }
        if (hasExtendedFields.duration_days) {
          insertData.duration_days = membershipData.duration_days;
        }
        if (hasExtendedFields.description) {
          insertData.description = membershipData.description;
        }
        if (hasExtendedFields.tier) {
          insertData.tier = membershipData.tier;
        }

        await Membership.query().insert(insertData);
        createdMemberships.push(membershipData.tier);
        console.log(`  ➕ Created: ${membershipData.tier} - ${membershipData.name}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Created: ${createdMemberships.length} memberships`);
    console.log(`   - Updated: ${updatedMemberships.length} memberships`);
    console.log(`   - Total: ${requiredMemberships.length} memberships\n`);

    // Verify all memberships exist
    const allMemberships = await Membership.query()
      .where('is_active', true)
      .orderBy('price', 'asc');

    console.log('📋 All Active Memberships:');
    console.log('═══════════════════════════════════════════════════════════');
    for (const membership of allMemberships) {
      console.log(`\n🎫 ${membership.tier || 'N/A'} - ${membership.name}`);
      console.log(`   💰 Price: ${membership.price} EGP`);
      console.log(`   ⭐ Points: ${membership.points}`);
      if (membership.point_multiplier !== undefined) {
        console.log(`   📈 Multiplier: ${membership.point_multiplier}x`);
      }
      if (membership.cashback_rate !== undefined) {
        console.log(`   💵 Cashback: ${membership.cashback_rate}%`);
      }
    }
    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Check if all required tiers exist
    const existingTiers = allMemberships.map(m => m.tier.toLowerCase());
    const requiredTiers = requiredMemberships.map(m => m.tier.toLowerCase());
    const missingTiers = requiredTiers.filter(t => !existingTiers.includes(t));

    if (missingTiers.length > 0) {
      console.warn(`⚠️  Warning: Missing tiers: ${missingTiers.join(', ')}`);
    } else {
      console.log('✅ All required memberships are present!\n');
    }

  } catch (error) {
    console.error('❌ Error ensuring memberships:', error);
    throw error;
  } finally {
    await knex.destroy();
  }
}

// Run the script
if (require.main === module) {
  ensureAllMemberships()
    .then(() => {
      console.log('✨ Membership check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Membership check failed:', error);
      process.exit(1);
    });
}

module.exports = { ensureAllMemberships };

