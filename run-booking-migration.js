/**
 * Script to run booking_type enum migration safely
 * This adds 'package' to the bookings_booking_type_enum
 */

require('dotenv').config();
const knex = require('knex');
const knexfile = require('./knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

async function runBookingMigration() {
  try {
    console.log('🔄 Running booking_type migration...');
    
    // Check if using CHECK constraint or ENUM
    const constraintCheck = await db.raw(`
      SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bookings_booking_type_check'
        AND conrelid = 'bookings'::regclass
      ) as exists;
    `);
    
    const enumCheck = await db.raw(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'bookings_booking_type_enum'
      ) as exists;
    `);
    
    const hasConstraint = constraintCheck.rows[0]?.exists;
    const hasEnum = enumCheck.rows[0]?.exists;
    
    if (hasConstraint) {
      console.log('📋 Found CHECK constraint, updating...');
      
      // Get current constraint definition
      const constraintDef = await db.raw(`
        SELECT pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conname = 'bookings_booking_type_check'
        AND conrelid = 'bookings'::regclass;
      `);
      
      const definition = constraintDef.rows[0]?.definition || '';
      
      if (definition.includes("'package'")) {
        console.log('✅ "package" already in CHECK constraint');
        return;
      }
      
      // Drop and recreate constraint
      await db.raw(`ALTER TABLE bookings DROP CONSTRAINT bookings_booking_type_check;`);
      await db.raw(`
        ALTER TABLE bookings ADD CONSTRAINT bookings_booking_type_check 
        CHECK (booking_type IN ('tour', 'nile_cruise', 'flight_ticket', 'hotel_booking', 'transfer', 'nile_trip', 'general_tour', 'package'));
      `);
      
      console.log('✅ Successfully updated CHECK constraint to include "package"');
      
    } else if (hasEnum) {
      console.log('📋 Found ENUM type, updating...');
      
      // Check if 'package' already exists
      const enumValueCheck = await db.raw(`
        SELECT EXISTS (
          SELECT 1 
          FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'bookings_booking_type_enum'
          AND e.enumlabel = 'package'
        ) as exists;
      `);
      
      if (enumValueCheck.rows[0]?.exists) {
        console.log('✅ "package" already exists in enum');
        return;
      }
      
      // Add 'package' to enum
      await db.raw(`ALTER TYPE bookings_booking_type_enum ADD VALUE 'package';`);
      console.log('✅ Successfully added "package" to enum');
      
    } else {
      console.log('⚠️  Neither CHECK constraint nor ENUM found. Creating CHECK constraint...');
      await db.raw(`
        ALTER TABLE bookings ADD CONSTRAINT bookings_booking_type_check 
        CHECK (booking_type IN ('tour', 'nile_cruise', 'flight_ticket', 'hotel_booking', 'transfer', 'nile_trip', 'general_tour', 'package'));
      `);
      console.log('✅ Created CHECK constraint with "package"');
    }
    
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('✅ "package" already exists');
    } else {
      console.error('❌ Error running migration:', error.message);
      throw error;
    }
  } finally {
    await db.destroy();
  }
}

runBookingMigration()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

