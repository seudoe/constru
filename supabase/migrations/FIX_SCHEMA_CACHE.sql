-- RUN THIS IN SUPABASE SQL EDITOR TO FIX THE ERROR
-- This command forces the Database API to refresh its cache of your tables.

NOTIFY pgrst, 'reload schema';

-- Also ensuring the column exists just in case
ALTER TABLE material_requests ADD COLUMN IF NOT EXISTS engineer_note text;
