-- Add address column for reverse-geocoded location
ALTER TABLE expense_reports ADD COLUMN IF NOT EXISTS address TEXT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
