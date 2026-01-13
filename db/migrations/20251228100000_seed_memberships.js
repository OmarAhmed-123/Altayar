/**
 * Migration to seed memberships data
 * This adds the 7 membership tiers with their PDF files
 */
exports.up = async function (knex) {
    // Check if memberships table exists
    const hasTable = await knex.schema.hasTable('memberships');
    if (!hasTable) {
        console.warn('⚠️ [Seed] memberships table does not exist. Skipping seeding.');
        return;
    }

    // Check if memberships already exist
    const existingMemberships = await knex('memberships').count('* as count').first();
    if (existingMemberships.count > 0) {
        console.log(`✅ [Seed] Found ${existingMemberships.count} existing memberships. Skipping seeding.`);
        return;
    }

    const memberships = [
        {
            name: 'العضوية البرونزية',
            tier: 'Bronze',
            price: 500.00,
            points: 100,
            point_multiplier: 1.0,
            welcome_points: 50,
            welcome_cashback: 0,
            duration_days: 365,
            benefits: ['خصم 5% على جميع الرحلات', 'أولوية الحجز', 'نقاط مكافآت'],
            description: 'العضوية البرونزية - البداية المثالية لرحلتك معنا',
            pdf_url: '/memberships/BronzeMembership_1765997586555.pdf',
            is_active: true
        },
        {
            name: 'العضوية الفضية',
            tier: 'Silver',
            price: 1000.00,
            points: 250,
            point_multiplier: 1.25,
            welcome_points: 100,
            welcome_cashback: 50,
            duration_days: 365,
            benefits: ['خصم 10% على جميع الرحلات', 'أولوية الحجز', 'نقاط مكافآت مضاعفة', 'دعم فني مميز'],
            description: 'العضوية الفضية - امتيازات إضافية ومزايا حصرية',
            pdf_url: '/memberships/SilverMembership_251209_034110.pdf',
            is_active: true
        },
        {
            name: 'العضوية الذهبية',
            tier: 'Gold',
            price: 2000.00,
            points: 500,
            point_multiplier: 1.5,
            welcome_points: 200,
            welcome_cashback: 100,
            duration_days: 365,
            benefits: ['خصم 15% على جميع الرحلات', 'أولوية قصوى للحجز', 'نقاط مكافآت ثلاثية', 'ترقية مجانية للغرف', 'دعم فني على مدار الساعة'],
            description: 'العضوية الذهبية - تجربة فاخرة ومميزة',
            pdf_url: '/memberships/GoldMembership_251209_034358.pdf',
            is_active: true
        },
        {
            name: 'العضوية البلاتينية',
            tier: 'Platinum',
            price: 3500.00,
            points: 1000,
            point_multiplier: 2.0,
            welcome_points: 500,
            welcome_cashback: 200,
            duration_days: 365,
            benefits: ['خصم 20% على جميع الرحلات', 'حجز مضمون', 'نقاط مكافآت رباعية', 'ترقية فورية للغرف', 'خدمة الكونسيرج', 'وصول VIP للمطار'],
            description: 'العضوية البلاتينية - أعلى مستويات الخدمة والرفاهية',
            pdf_url: '/memberships/PlatinumMembership_251209_034038.pdf',
            is_active: true
        },
        {
            name: 'عضوية VIP',
            tier: 'VIP',
            price: 5000.00,
            points: 2000,
            point_multiplier: 2.5,
            welcome_points: 1000,
            welcome_cashback: 500,
            duration_days: 365,
            benefits: ['خصم 25% على جميع الرحلات', 'خدمة شخصية مخصصة', 'استقبال VIP في المطار', 'ليموزين مجاني', 'وصول لصالات VIP', 'مدير حساب شخصي'],
            description: 'عضوية VIP - تجربة سفر استثنائية بكل المقاييس',
            pdf_url: '/memberships/VIPMembership_251209_034220.pdf',
            is_active: true
        },
        {
            name: 'العضوية الماسية',
            tier: 'Diamond',
            price: 7500.00,
            points: 3500,
            point_multiplier: 3.0,
            welcome_points: 2000,
            welcome_cashback: 1000,
            duration_days: 365,
            benefits: ['خصم 30% على جميع الرحلات', 'سفر بدرجة رجال الأعمال', 'إقامة 5 نجوم', 'جولات خاصة', 'طاهٍ خاص عند الطلب', 'تأمين سفر شامل'],
            description: 'العضوية الماسية - القمة في عالم السفر الفاخر',
            pdf_url: '/memberships/DiamondMembership_251209_034339.pdf',
            is_active: true
        },
        {
            name: 'العضوية التجارية',
            tier: 'Business',
            price: 10000.00,
            points: 5000,
            point_multiplier: 3.5,
            welcome_points: 3000,
            welcome_cashback: 2000,
            duration_days: 365,
            benefits: ['خصم 35% على جميع الرحلات', 'حزمة أعمال متكاملة', 'قاعات اجتماعات', 'سكرتيرة سفر', 'تنسيق مؤتمرات', 'خدمات ترجمة فورية'],
            description: 'العضوية التجارية - الخيار الأمثل لرجال الأعمال',
            pdf_url: '/memberships/BusinessMembership_251209_034310.pdf',
            is_active: true
        }
    ];

    console.log('🔄 [Seed] Inserting 7 memberships...');

    for (const membership of memberships) {
        try {
            await knex('memberships').insert(membership);
            console.log(`✅ [Seed] Inserted: ${membership.tier} - ${membership.name}`);
        } catch (error) {
            console.error(`❌ [Seed] Failed to insert ${membership.tier}:`, error.message);
            // Continue with other memberships
        }
    }

    console.log('✅ [Seed] Memberships seeding completed');
};

exports.down = async function (knex) {
    // Remove seeded memberships
    const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'VIP', 'Diamond', 'Business'];
    await knex('memberships').whereIn('tier', tiers).del();
    console.log('✅ [Seed] Removed seeded memberships');
};
