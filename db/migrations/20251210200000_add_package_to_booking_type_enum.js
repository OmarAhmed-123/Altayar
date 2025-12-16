/**
 * Migration: Add 'package' to booking_type constraint
 * This fixes the constraint violation when creating bookings with type 'package'
 * 
 * CRITICAL FIX: PostgreSQL may use CHECK constraint instead of ENUM
 * This migration handles both cases:
 * 1. If using ENUM: adds 'package' to the enum
 * 2. If using CHECK constraint: drops and recreates constraint with 'package' included
 */

exports.up = function(knex) {
  return knex.raw(`
    DO $$
    DECLARE
      enum_exists boolean;
      check_constraint_exists boolean;
      current_constraint_def text;
    BEGIN
      -- Check if enum type exists
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'bookings_booking_type_enum'
      ) INTO enum_exists;
      
      -- Check if CHECK constraint exists
      SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bookings_booking_type_check'
        AND conrelid = 'bookings'::regclass
      ) INTO check_constraint_exists;
      
      -- Case 1: Using ENUM type
      IF enum_exists THEN
        -- Check if 'package' already exists in enum
        IF NOT EXISTS (
          SELECT 1 
          FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'bookings_booking_type_enum'
          AND e.enumlabel = 'package'
        ) THEN
          ALTER TYPE bookings_booking_type_enum ADD VALUE 'package';
          RAISE NOTICE 'Added "package" to bookings_booking_type_enum';
        ELSE
          RAISE NOTICE '"package" already exists in bookings_booking_type_enum';
        END IF;
      
      -- Case 2: Using CHECK constraint (most likely case)
      ELSIF check_constraint_exists THEN
        -- Get current constraint definition
        SELECT pg_get_constraintdef(oid) INTO current_constraint_def
        FROM pg_constraint
        WHERE conname = 'bookings_booking_type_check'
        AND conrelid = 'bookings'::regclass;
        
        -- Check if 'package' is already in constraint
        IF current_constraint_def NOT LIKE '%package%' THEN
          -- Drop old constraint
          ALTER TABLE bookings DROP CONSTRAINT bookings_booking_type_check;
          
          -- Create new constraint with 'package' included
          ALTER TABLE bookings ADD CONSTRAINT bookings_booking_type_check 
            CHECK (booking_type IN ('tour', 'nile_cruise', 'flight_ticket', 'hotel_booking', 'transfer', 'nile_trip', 'general_tour', 'package'));
          
          RAISE NOTICE 'Updated bookings_booking_type_check constraint to include "package"';
        ELSE
          RAISE NOTICE '"package" already in bookings_booking_type_check constraint';
        END IF;
      
      ELSE
        -- Neither enum nor constraint found - create CHECK constraint
        ALTER TABLE bookings ADD CONSTRAINT bookings_booking_type_check 
          CHECK (booking_type IN ('tour', 'nile_cruise', 'flight_ticket', 'hotel_booking', 'transfer', 'nile_trip', 'general_tour', 'package'));
        
        RAISE NOTICE 'Created bookings_booking_type_check constraint with "package"';
      END IF;
    END $$;
  `);
};

exports.down = function(knex) {
  // Note: PostgreSQL doesn't support removing enum values directly
  // This would require recreating the enum, which is complex
  // For safety, we'll just log a warning
  console.warn('⚠️  Cannot remove enum value directly. Manual intervention required if rollback is needed.');
  return Promise.resolve();
};

