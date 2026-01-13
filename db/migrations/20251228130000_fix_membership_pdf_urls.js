/**
 * Migration to fix membership PDF URLs
 * This resets pdf_url to point to the original PDF files in /memberships/
 */
exports.up = async function (knex) {
    // Check if memberships table exists
    const hasTable = await knex.schema.hasTable('memberships');
    if (!hasTable) {
        console.warn('⚠️ [Fix PDF] memberships table does not exist. Skipping.');
        return;
    }

    // Mapping of tier to original PDF filename
    const pdfMappings = [
        { tier: 'Bronze', pdf_url: '/memberships/BronzeMembership_1765997586555.pdf' },
        { tier: 'Silver', pdf_url: '/memberships/SilverMembership_251209_034110.pdf' },
        { tier: 'Gold', pdf_url: '/memberships/GoldMembership_251209_034358.pdf' },
        { tier: 'Platinum', pdf_url: '/memberships/PlatinumMembership_251209_034038.pdf' },
        { tier: 'VIP', pdf_url: '/memberships/VIPMembership_251209_034220.pdf' },
        { tier: 'Diamond', pdf_url: '/memberships/DiamondMembership_251209_034339.pdf' },
        { tier: 'Business', pdf_url: '/memberships/BusinessMembership_251209_034310.pdf' }
    ];

    console.log('🔄 [Fix PDF] Updating membership PDF URLs to original files...');

    for (const mapping of pdfMappings) {
        try {
            const updated = await knex('memberships')
                .where('tier', mapping.tier)
                .update({ pdf_url: mapping.pdf_url });

            if (updated > 0) {
                console.log(`✅ [Fix PDF] Updated ${mapping.tier}: ${mapping.pdf_url}`);
            } else {
                console.log(`⚠️ [Fix PDF] No membership found with tier: ${mapping.tier}`);
            }
        } catch (error) {
            console.error(`❌ [Fix PDF] Failed to update ${mapping.tier}:`, error.message);
        }
    }

    console.log('✅ [Fix PDF] PDF URL fix completed');
};

exports.down = async function (knex) {
    // No rollback needed - this is a data fix
    console.log('⚠️ [Fix PDF] No rollback action for PDF URL fix');
};
