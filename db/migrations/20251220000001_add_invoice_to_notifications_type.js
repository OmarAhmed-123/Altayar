/**
 * Migration: Add 'invoice' to notifications type enum
 * This adds 'invoice' as a valid notification type for invoice-related notifications
 * 
 * CRITICAL: PostgreSQL enum modifications must be done carefully
 * This migration handles both ENUM and CHECK constraint cases
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
        SELECT 1 FROM pg_type WHERE typname = 'notifications_type_enum'
      ) INTO enum_exists;
      
      -- Check if CHECK constraint exists
      SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notifications_type_check'
        AND conrelid = 'notifications'::regclass
      ) INTO check_constraint_exists;
      
      -- Case 1: Using ENUM type
      IF enum_exists THEN
        -- Check if 'invoice' already exists in enum
        IF NOT EXISTS (
          SELECT 1 
          FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'notifications_type_enum'
          AND e.enumlabel = 'invoice'
        ) THEN
          ALTER TYPE notifications_type_enum ADD VALUE 'invoice';
          RAISE NOTICE 'Added "invoice" to notifications_type_enum';
        ELSE
          RAISE NOTICE '"invoice" already exists in notifications_type_enum';
        END IF;
      
      -- Case 2: Using CHECK constraint (fallback case)
      ELSIF check_constraint_exists THEN
        -- Get current constraint definition
        SELECT pg_get_constraintdef(oid) INTO current_constraint_def
        FROM pg_constraint
        WHERE conname = 'notifications_type_check'
        AND conrelid = 'notifications'::regclass;
        
        -- Check if 'invoice' is already in constraint
        IF current_constraint_def NOT LIKE '%invoice%' THEN
          -- Drop old constraint
          ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
          
          -- Create new constraint with 'invoice' included
          ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
            CHECK (type IN ('offer', 'booking_status', 'membership_upgrade', 'voucher_gift', 'ad_popup', 'chat_message', 'general', 'invoice'));
          
          RAISE NOTICE 'Updated notifications_type_check constraint to include "invoice"';
        ELSE
          RAISE NOTICE '"invoice" already in notifications_type_check constraint';
        END IF;
      
      ELSE
        -- Neither enum nor constraint found - this shouldn't happen, but handle gracefully
        RAISE NOTICE 'Neither enum nor constraint found for notifications.type';
      END IF;
    END $$;
  `);
};

exports.down = function(knex) {
  // Note: PostgreSQL doesn't support removing enum values directly
  // This would require recreating the enum, which is complex and risky
  // For safety, we'll just log a warning
  console.warn('⚠️  Cannot remove enum value directly. Manual intervention required if rollback is needed.');
  return Promise.resolve();
};

