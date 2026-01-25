-- Safe OTP Permit-to-Work System Schema
-- Only creates tables if they don't exist
-- Fixed to use correct data types matching existing kanban table

-- 1. Create labours table if it doesn't exist
CREATE TABLE IF NOT EXISTS labours (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Create task_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_assignments (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT REFERENCES kanban(id) ON DELETE CASCADE,
  assignee_type TEXT NOT NULL CHECK (assignee_type IN ('labour', 'contractor')),
  assignee_id BIGINT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(task_id, assignee_type, assignee_id)
);

-- 3. Create otp_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS otp_requests (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT REFERENCES kanban(id) ON DELETE CASCADE,
  labour_id BIGINT REFERENCES labours(id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(task_id, labour_id)
);

-- 4. Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_labours_user_id') THEN
    CREATE INDEX idx_labours_user_id ON labours(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_labours_is_active') THEN
    CREATE INDEX idx_labours_is_active ON labours(is_active);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_task_assignments_task_id') THEN
    CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_task_assignments_assignee') THEN
    CREATE INDEX idx_task_assignments_assignee ON task_assignments(assignee_type, assignee_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_otp_requests_task_id') THEN
    CREATE INDEX idx_otp_requests_task_id ON otp_requests(task_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_otp_requests_labour_id') THEN
    CREATE INDEX idx_otp_requests_labour_id ON otp_requests(labour_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_otp_requests_verified') THEN
    CREATE INDEX idx_otp_requests_verified ON otp_requests(is_verified);
  END IF;
END $$;

-- 5. Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'labours' AND rowsecurity = true) THEN
    ALTER TABLE labours ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'task_assignments' AND rowsecurity = true) THEN
    ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'otp_requests' AND rowsecurity = true) THEN
    ALTER TABLE otp_requests ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 6. Create RLS Policies (only if they don't exist)

-- Labours policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view labours' AND tablename = 'labours') THEN
    CREATE POLICY "Authenticated users can view labours" ON labours
      FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Managers can manage labours' AND tablename = 'labours') THEN
    CREATE POLICY "Managers can manage labours" ON labours
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE id = auth.uid() AND role IN ('manager', 'engineer')
        )
      );
  END IF;
END $$;

-- Task assignments policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view task assignments' AND tablename = 'task_assignments') THEN
    CREATE POLICY "Authenticated users can view task assignments" ON task_assignments
      FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Managers can manage task assignments' AND tablename = 'task_assignments') THEN
    CREATE POLICY "Managers can manage task assignments" ON task_assignments
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE id = auth.uid() AND role IN ('manager', 'engineer')
        )
      );
  END IF;
END $$;

-- OTP requests policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Labours can view their own OTP requests' AND tablename = 'otp_requests') THEN
    CREATE POLICY "Labours can view their own OTP requests" ON otp_requests
      FOR SELECT TO authenticated 
      USING (
        labour_id IN (
          SELECT id FROM labours WHERE user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Managers can view all OTP requests' AND tablename = 'otp_requests') THEN
    CREATE POLICY "Managers can view all OTP requests" ON otp_requests
      FOR SELECT TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE id = auth.uid() AND role IN ('manager', 'engineer')
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Managers can create OTP requests' AND tablename = 'otp_requests') THEN
    CREATE POLICY "Managers can create OTP requests" ON otp_requests
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE id = auth.uid() AND role IN ('manager', 'engineer')
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Labours can update their own OTP verification' AND tablename = 'otp_requests') THEN
    CREATE POLICY "Labours can update their own OTP verification" ON otp_requests
      FOR UPDATE TO authenticated
      USING (
        labour_id IN (
          SELECT id FROM labours WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 7. Create helper functions if they don't exist
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to populate labours table from existing users
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

-- 9. Create triggers for updated_at if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_labours_updated_at') THEN
    CREATE TRIGGER update_labours_updated_at 
      BEFORE UPDATE ON labours 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 10. Try to populate labours table (ignore errors if tables don't exist)
DO $$
BEGIN
  PERFORM populate_labours_from_users();
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if dependent tables don't exist yet
    NULL;
END $$;