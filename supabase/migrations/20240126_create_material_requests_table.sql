-- Create material_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS material_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_name TEXT NOT NULL,
  material_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  zone TEXT NOT NULL,
  engineer_name TEXT,
  engineer_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  manager_reason TEXT,
  engineer_note TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view material requests" ON material_requests FOR SELECT USING (true);
CREATE POLICY "Engineers can create material requests" ON material_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Managers can update material requests" ON material_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'engineer')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_material_requests_status ON material_requests(status);
CREATE INDEX IF NOT EXISTS idx_material_requests_created_at ON material_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_material_requests_expires_at ON material_requests(expires_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_material_requests_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ language 'plpgsql';

CREATE TRIGGER update_material_requests_updated_at 
  BEFORE UPDATE ON material_requests 
  FOR EACH ROW EXECUTE FUNCTION update_material_requests_updated_at();

-- Force PostgREST to refresh its schema cache
NOTIFY pgrst, 'reload schema';