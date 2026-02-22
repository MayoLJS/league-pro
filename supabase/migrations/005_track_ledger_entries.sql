-- ============================================================================
-- Track Ledger Entries in Registrations
-- Migration: 005_track_ledger_entries.sql
-- ============================================================================
-- 
-- Purpose: Link registrations to their ledger entries
-- - Prevents deleting wrong ledger entries when toggling payment
-- - Allows precise rollback of payment transactions
--
-- ============================================================================

-- Add column to track which ledger entry was created for this registration
ALTER TABLE registrations 
ADD COLUMN ledger_entry_id UUID REFERENCES ledger(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_registrations_ledger_entry 
ON registrations(ledger_entry_id);

-- Add comment for documentation
COMMENT ON COLUMN registrations.ledger_entry_id IS 
'References the specific ledger CREDIT entry created when payment was marked as PAID';
