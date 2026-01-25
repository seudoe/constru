-- Create the Expense Reports table
CREATE TABLE IF NOT EXISTS expense_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES auth.users(id), -- Assuming worker is an auth user, or just text if not strict
  image_url TEXT NOT NULL,
  description TEXT,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (Manager/Engineer needs to read)
CREATE POLICY "Public read access"
  ON expense_reports FOR SELECT
  USING (true);

-- Allow authenticated users (Labour) to insert
CREATE POLICY "Authenticated insert access"
  ON expense_reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');


-- STORAGE SETUP --
-- Note: You might need to create the bucket manually in dashboard if this SQL doesn't run with sufficient privs, 
-- but usually inserts into storage.buckets works if extensions enabled.
-- Simpler approach for SQL Editor: Policies.

-- 1. Policy to allow public viewing of expense-photos
-- (Assuming bucket 'expense-photos' will be created)
BEGIN;
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('expense-photos', 'expense-photos', true)
  ON CONFLICT (id) DO NOTHING;

  -- Policy: Allow authenticated uploads
  CREATE POLICY "Allow authenticated uploads" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'expense-photos');

  -- Policy: Allow public view
  CREATE POLICY "Allow public view" 
  ON storage.objects FOR SELECT 
  TO public 
  USING (bucket_id = 'expense-photos');
COMMIT;
