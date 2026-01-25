-- Add project_id and created_by to dprs table
DO $$ 
BEGIN
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

-- Create index for project_id and created_by
CREATE INDEX IF NOT EXISTS idx_dprs_project_id ON dprs(project_id);
CREATE INDEX IF NOT EXISTS idx_dprs_created_by ON dprs(created_by);

-- Update RLS policies for role-based access
DROP POLICY IF EXISTS "Anyone can view dprs" ON dprs;
DROP POLICY IF EXISTS "Anyone can create dprs" ON dprs;

-- Workers can view their own DPRs and managers can view all
CREATE POLICY "Workers can view own DPRs" ON dprs
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Workers can create DPRs
CREATE POLICY "Workers can create DPRs" ON dprs
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Managers can update DPRs (for corrections if needed)
CREATE POLICY "Managers can update DPRs" ON dprs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );
