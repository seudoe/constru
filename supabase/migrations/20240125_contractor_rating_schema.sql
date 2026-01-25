-- Contractor Rating System Schema
-- Run this in Supabase SQL Editor

-- 1. Create contractors table if it doesn't exist
CREATE TABLE IF NOT EXISTS contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id), -- Optional link to auth user
  current_rating FLOAT DEFAULT 10.0,
  rating_last_updated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create defects table
CREATE TABLE IF NOT EXISTS defects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id), -- Admin/Manager who approved this defect/resolution
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create contractor_ratings table (History)
CREATE TABLE IF NOT EXISTS contractor_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  score FLOAT NOT NULL,
  risk TEXT NOT NULL, -- EXCELLENT, GOOD, MEDIUM, HIGH, CRITICAL
  advice TEXT NOT NULL,
  reasons JSONB, -- Array of strings explaining the score
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_ratings ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies

-- Contractors: Visible to everyone authenticated, Manageable by Managers/Engineers
CREATE POLICY "Authenticated users can view contractors" ON contractors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage contractors" ON contractors
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'engineer')
    )
  );

-- Defects: Visible to everyone, Manageable by Managers/Engineers
CREATE POLICY "Authenticated users can view defects" ON defects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage defects" ON defects
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'engineer')
    )
  );

-- Ratings: Read-only for everyone (or specifically managers/contractors themselves)
CREATE POLICY "Authenticated users can view ratings" ON contractor_ratings
  FOR SELECT TO authenticated USING (true);

-- Only Managers/System can insert ratings (via API potentially using Service Role, but let's allow managers for now)
CREATE POLICY "Managers can insert ratings" ON contractor_ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'engineer')
    )
  );

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_contractors_rating ON contractors(current_rating);
CREATE INDEX IF NOT EXISTS idx_defects_contractor ON defects(contractor_id);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_ratings_contractor ON contractor_ratings(contractor_id);
CREATE INDEX IF NOT EXISTS idx_ratings_calculated_at ON contractor_ratings(calculated_at DESC);

-- 7. Triggers for updated_at
CREATE TRIGGER update_contractors_updated_at 
  BEFORE UPDATE ON contractors 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_defects_updated_at 
  BEFORE UPDATE ON defects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
