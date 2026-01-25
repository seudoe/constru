-- Create company table for storing company details
-- Using singleton pattern with fixed ID
CREATE TABLE IF NOT EXISTS company (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT,
  gstin TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert singleton record if it doesn't exist
INSERT INTO company (id, name, gstin, address, phone)
VALUES ('00000000-0000-0000-0000-000000000001', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_singleton ON company(id) WHERE id = '00000000-0000-0000-0000-000000000001';

-- Enable RLS
ALTER TABLE company ENABLE ROW LEVEL SECURITY;

-- Owners can view company details
CREATE POLICY "Owners can view company" ON company
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Owners can update company details
CREATE POLICY "Owners can update company" ON company
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Owners can insert company details (if not exists)
CREATE POLICY "Owners can insert company" ON company
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_company_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_updated_at
  BEFORE UPDATE ON company
  FOR EACH ROW
  EXECUTE FUNCTION update_company_updated_at();
