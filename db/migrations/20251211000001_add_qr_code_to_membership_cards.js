/**
 * Migration: Add qr_code column to membership_cards table
 * This migration is idempotent - it can be run multiple times safely
 */

exports.up = async function(knex) {
  // Check if column already exists
  const hasQrCode = await knex.schema.hasColumn('membership_cards', 'qr_code');
  
  if (!hasQrCode) {
    await knex.schema.alterTable('membership_cards', table => {
      table.string('qr_code').nullable().unique();
    });
    
    console.log('✅ Added qr_code column to membership_cards table');
    
    // Generate QR codes for existing cards that don't have one
    const cardsWithoutQrCode = await knex('membership_cards')
      .whereNull('qr_code')
      .select('id', 'card_number');
    
    const { nanoid } = require('nanoid');
    for (const card of cardsWithoutQrCode) {
      let qrCode;
      let exists = true;
      
      // Generate unique QR code
      while (exists) {
        qrCode = nanoid(16);
        const existing = await knex('membership_cards')
          .where('qr_code', qrCode)
          .first();
        exists = !!existing;
      }
      
      await knex('membership_cards')
        .where('id', card.id)
        .update({ qr_code: qrCode });
    }
    
    console.log(`✅ Generated QR codes for ${cardsWithoutQrCode.length} existing membership cards`);
  } else {
    console.log('ℹ️  qr_code column already exists in membership_cards table, skipping');
  }
};

exports.down = async function(knex) {
  const hasQrCode = await knex.schema.hasColumn('membership_cards', 'qr_code');
  
  if (hasQrCode) {
    await knex.schema.alterTable('membership_cards', table => {
      table.dropColumn('qr_code');
    });
    
    console.log('✅ Removed qr_code column from membership_cards table');
  } else {
    console.log('ℹ️  qr_code column does not exist, skipping');
  }
};

