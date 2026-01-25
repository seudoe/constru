-- OTP Permit-to-Work System Schema
-- Run this in Supabase SQL Editor

-- 1. Create labours table (references users with labour role)
CREATE TABLE IF NOT EXISTS labours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Create task_assignments table (many-to-many between kanban tasks and labours/contractors)
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES kanban(id) ON DELETE CASCADE,
  assignee_type TEXT NOT NULL CHECK (assignee_type IN ('labour', 'contractor')),
  assignee_id UUID NOT NULL, -- References either labours.id or contractors.id
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(task_id, assignee_type, assignee_id)
);

-- 3. Create otp_requests table
CREATE TABLE IF NOT EXISTS otp_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES kanban(id) ON DELETE CASCADE,
  labour_id UUID REFERENCES labours(id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(task_id, labour_id)
);

-- 4. Add new columns to kanban table for OTP permit-to-work
ALTER TABLE kanban 
ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'normal' CHECK (task_type IN ('normal', 'hazardous')),
ADD COLUMN IF NOT EXISTS require_otp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS otp_authorized BOOLEAN DEFAULT false;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_labours_user_id ON labours(user_id);
CREATE INDEX IF NOT EXISTS idx_labours_is_active ON labours(is_active);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assignee ON task_assignments(assignee_type, assignee_id);
CREATE INDEX IF NOT EXISTS idx_otp_requests_task_id ON otp_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_otp_requests_labour_id ON otp_requests(labour_id);
CREATE INDEX IF NOT EXISTS idx_otp_requests_verified ON otp_requests(is_verified);

-- 6. Enable RLS
ALTER TABLE labours ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_requests ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies

-- Labours: Visible to authenticated users, manageable by managers/engineers
CREATE POLICY "Authenticated users can view labours" ON labours
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage labours" ON labours
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role IN ('manager', 'engineer')
    )
  );

-- Task assignments: Visible to authenticated users, manageable by managers/engineers
CREATE POLICY "Authenticated users can view task assignments" ON task_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage task assignments" ON task_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role IN ('manager', 'engineer')
    )
  );

-- OTP requests: Labours can view their own, managers can view all
CREATE POLICY "Labours can view their own OTP requests" ON otp_requests
  FOR SELECT TO authenticated 
  USING (
    labour_id IN (
      SELECT id FROM labours WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all OTP requests" ON otp_requests
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role IN ('manager', 'engineer')
    )
  );

CREATE POLICY "Managers can create OTP requests" ON otp_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role IN ('manager', 'engineer')
    )
  );

CREATE POLICY "Labours can update their own OTP verification" ON otp_requests
  FOR UPDATE TO authenticated
  USING (
    labour_id IN (
      SELECT id FROM labours WHERE user_id = auth.uid()
    )
  );

-- 8. Create function to generate random 6-digit OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to populate labours table from existing users
CREATE OR REPLACE FUNCTION populate_labours_from_users()
RETURNS VOID AS $$
BEGIN
  INSERT INTO labours (user_id, name, email, phone)
  SELECT 
    u.id,
    COALESCE(p.full_name, u.email) as name,
    u.email,
    p.phone
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  LEFT JOIN user_roles ur ON ur.id = u.id
  WHERE ur.role IN ('worker', 'construction_worker')
    AND NOT EXISTS (SELECT 1 FROM labours WHERE user_id = u.id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for updated_at
CREATE TRIGGER update_labours_updated_at 
  BEFORE UPDATE ON labours 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Populate labours table with existing workers
SELECT populate_labours_from_users();