-- 1. Create the missing column
ALTER TABLE material_requests ADD COLUMN IF NOT EXISTS engineer_note text;

-- 2. Force the API to learn about the new column
NOTIFY pgrst, 'reload schema';
