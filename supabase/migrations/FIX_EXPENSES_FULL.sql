-- 1. Create the Expense Reports TABLE (if missing)
CREATE TABLE IF NOT EXISTS expense_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  description TEXT,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on Table
ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;

-- 3. Create Table Policies (Drop first to avoid errors)
DROP POLICY IF EXISTS "Public read access" ON expense_reports;
DROP POLICY IF EXISTS "Authenticated insert access" ON expense_reports;

CREATE POLICY "Public read access" ON expense_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated insert access" ON expense_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Create the STORAGE BUCKET (expense-photos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('expense-photos', 'expense-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Create Storage Policies (Drop first)
DROP POLICY IF EXISTS "Public View" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;

CREATE POLICY "Public View" ON storage.objects FOR SELECT TO public USING (bucket_id = 'expense-photos');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'expense-photos');

-- 6. FORCE SCHEMA CACHE RELOAD (Crucial Fix)
NOTIFY pgrst, 'reload schema';
