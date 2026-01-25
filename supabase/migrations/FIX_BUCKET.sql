-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-photos', 'expense-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to avoid conflicts (clean slate)
DROP POLICY IF EXISTS "Public View" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public view" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- 3. Create Policy: Allow Public Read Access (VIEW)
CREATE POLICY "Public View"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'expense-photos');

-- 4. Create Policy: Allow Authenticated Users to Upload (INSERT)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-photos');

-- 5. Create Policy: Allow Authenticated Users to Upload (INSERT) - Fallback for ANON if you use anon key for uploads (optional)
-- Uncomment if you still get RLS errors with anon user
-- CREATE POLICY "Anon Upload"
-- ON storage.objects FOR INSERT
-- TO anon
-- WITH CHECK (bucket_id = 'expense-photos');
