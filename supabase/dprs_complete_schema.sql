-- ============================================
-- COMPLETE DPRS TABLE SCHEMA
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

-- Step 2: Create the dprs table (drop and recreate if needed, or use CREATE TABLE IF NOT EXISTS)
DROP TABLE IF EXISTS dprs CASCADE;

CREATE TABLE dprs (
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
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dprs_date ON dprs(date DESC);
CREATE INDEX IF NOT EXISTS idx_dprs_project_id ON dprs(project_id);
CREATE INDEX IF NOT EXISTS idx_dprs_created_by ON dprs(created_by);

-- Step 4: Enable Row Level Security
ALTER TABLE dprs ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view dprs" ON dprs;
DROP POLICY IF EXISTS "Anyone can create dprs" ON dprs;
DROP POLICY IF EXISTS "Workers can view own DPRs" ON dprs;
DROP POLICY IF EXISTS "Workers can create DPRs" ON dprs;
DROP POLICY IF EXISTS "Managers can update DPRs" ON dprs;

-- Step 6: Create RLS Policies
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

-- Step 7: Create trigger for updated_at timestamp
DROP TRIGGER IF EXISTS update_dprs_updated_at ON dprs;

CREATE TRIGGER update_dprs_updated_at 
  BEFORE UPDATE ON dprs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SCHEMA SUMMARY:
-- ============================================
-- Columns:
--   - id (UUID, Primary Key)
--   - date (DATE, Required)
--   - work_done (TEXT, Required)
--   - labor_count (INTEGER, Default: 0)
--   - materials_used (TEXT, Optional)
--   - issues (TEXT, Optional)
--   - photos (TEXT[], Array of photo URLs)
--   - videos (TEXT[], Array of video URLs)
--   - full_text (TEXT, Optional - for full text search)
--   - short_summary (TEXT, Optional - for quick previews)
--   - project_id (UUID, Foreign Key to projects)
--   - created_by (UUID, Foreign Key to auth.users)
--   - created_at (TIMESTAMP, Auto-generated)
--   - updated_at (TIMESTAMP, Auto-updated via trigger)
--
-- Indexes:
--   - idx_dprs_date (on date DESC for chronological queries)
--   - idx_dprs_project_id (for filtering by project)
--   - idx_dprs_created_by (for filtering by creator)
--
-- RLS Policies:
--   - Workers can view their own DPRs
--   - Managers can view all DPRs
--   - Workers can create DPRs (must set created_by = auth.uid())
--   - Managers can update DPRs
-- ============================================
