-- ============================================
-- DPRS TABLE SCHEMA (SAFE VERSION - Preserves Data)
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create the update_updated_at_column function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 2: Create the dprs table if it doesn't exist
CREATE TABLE IF NOT EXISTS dprs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  work_done TEXT NOT NULL,
  labor_count INTEGER DEFAULT 0,
  materials_used TEXT,
  issues TEXT,
  photos TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  full_text TEXT,
  short_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add columns that might not exist (safe - won't error if they exist)
DO $$ 
BEGIN
  -- Add photos column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dprs' AND column_name = 'photos'
  ) THEN
    ALTER TABLE dprs ADD COLUMN photos TEXT[] DEFAULT '{}';
  END IF;

  -- Add videos column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dprs' AND column_name = 'videos'
  ) THEN
    ALTER TABLE dprs ADD COLUMN videos TEXT[] DEFAULT '{}';
  END IF;

  -- Add full_text column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dprs' AND column_name = 'full_text'
  ) THEN
    ALTER TABLE dprs ADD COLUMN full_text TEXT;
  END IF;

  -- Add short_summary column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dprs' AND column_name = 'short_summary'
  ) THEN
    ALTER TABLE dprs ADD COLUMN short_summary TEXT;
  END IF;

  -- Add project_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dprs' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE dprs ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
  END IF;

  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dprs' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE dprs ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 4: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dprs_date ON dprs(date DESC);
CREATE INDEX IF NOT EXISTS idx_dprs_project_id ON dprs(project_id);
CREATE INDEX IF NOT EXISTS idx_dprs_created_by ON dprs(created_by);

-- Step 5: Enable Row Level Security
ALTER TABLE dprs ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view dprs" ON dprs;
DROP POLICY IF EXISTS "Anyone can create dprs" ON dprs;
DROP POLICY IF EXISTS "Workers can view own DPRs" ON dprs;
DROP POLICY IF EXISTS "Workers can create DPRs" ON dprs;
DROP POLICY IF EXISTS "Managers can update DPRs" ON dprs;

-- Step 7: Create RLS Policies
-- Workers can view their own DPRs and managers can view all
CREATE POLICY "Workers can view own DPRs" ON dprs
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Workers can create DPRs (must set created_by to their own user ID)
CREATE POLICY "Workers can create DPRs" ON dprs
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Managers can update DPRs (for corrections if needed)
CREATE POLICY "Managers can update DPRs" ON dprs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Step 8: Create trigger for updated_at timestamp
DROP TRIGGER IF EXISTS update_dprs_updated_at ON dprs;

CREATE TRIGGER update_dprs_updated_at 
  BEFORE UPDATE ON dprs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERY (Run this to check the schema)
-- ============================================
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable,
--   column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'dprs' 
-- ORDER BY ordinal_position;
-- ============================================
