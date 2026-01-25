-- Comprehensive RLS policies for production security

-- ============================================
-- INVENTORY POLICIES
-- ============================================
DROP POLICY IF EXISTS "Anyone can view inventory" ON inventory;
DROP POLICY IF EXISTS "Managers can manage inventory" ON inventory;

-- Everyone can view inventory
CREATE POLICY "Anyone can view inventory" ON inventory
  FOR SELECT
  USING (true);

-- Only managers/engineers can manage inventory
CREATE POLICY "Managers can manage inventory" ON inventory
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role IN ('manager', 'engineer')
    )
  );

-- ============================================
-- MOVEMENTS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Anyone can view movements" ON movements;
DROP POLICY IF EXISTS "Workers can create movements" ON movements;
DROP POLICY IF EXISTS "Managers can update movements" ON movements;

-- Everyone can view movements
CREATE POLICY "Anyone can view movements" ON movements
  FOR SELECT
  USING (true);

-- Workers can create movements
CREATE POLICY "Workers can create movements" ON movements
  FOR INSERT
  WITH CHECK (
    worker_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role IN ('worker', 'construction_worker')
    )
  );

-- Managers can approve/update movements
CREATE POLICY "Managers can update movements" ON movements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================
-- ATTENDANCE POLICIES
-- ============================================
-- Enable RLS if not already enabled
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Everyone can view attendance
CREATE POLICY "Anyone can view attendance" ON attendance
  FOR SELECT
  USING (true);

-- Only managers can insert/update attendance
CREATE POLICY "Managers can manage attendance" ON attendance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================
-- ALERTS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Anyone can view alerts" ON alerts;
DROP POLICY IF EXISTS "System can create alerts" ON alerts;

-- Everyone can view alerts
CREATE POLICY "Anyone can view alerts" ON alerts
  FOR SELECT
  USING (true);

-- System/service role can create alerts
CREATE POLICY "System can create alerts" ON alerts
  FOR INSERT
  WITH CHECK (true);

-- Managers can delete/resolve alerts
CREATE POLICY "Managers can delete alerts" ON alerts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================
-- USER ROLES POLICIES
-- ============================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own role
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT
  USING (id = auth.uid());

-- Managers can view all roles
CREATE POLICY "Managers can view all roles" ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.id = auth.uid() AND ur.role = 'manager'
    )
  );

-- Only service role can insert roles (via API)
-- No direct user insert policy
