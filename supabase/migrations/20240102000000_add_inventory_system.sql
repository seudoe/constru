-- Add inventory management tables

-- Create inventory table
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_id TEXT NOT NULL UNIQUE,
  zone TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create movements table
CREATE TABLE movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  from_zone TEXT NOT NULL,
  to_zone TEXT NOT NULL,
  approved BOOLEAN DEFAULT false,
  risk_level TEXT,
  time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  level TEXT NOT NULL,
  related_item_id UUID REFERENCES inventory(id),
  related_worker_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory
CREATE POLICY "Anyone can view inventory" ON inventory
  FOR SELECT USING (true);

CREATE POLICY "Managers can manage inventory" ON inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'engineer')
    )
  );

-- Create policies for movements
CREATE POLICY "Anyone can view movements" ON movements
  FOR SELECT USING (true);

CREATE POLICY "Workers can create movements" ON movements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Managers can update movements" ON movements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'engineer')
    )
  );

-- Create policies for alerts
CREATE POLICY "Anyone can view alerts" ON alerts
  FOR SELECT USING (true);

CREATE POLICY "System can create alerts" ON alerts
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_inventory_item_id ON inventory(item_id);
CREATE INDEX idx_inventory_zone ON inventory(zone);
CREATE INDEX idx_movements_item_id ON movements(item_id);
CREATE INDEX idx_movements_time ON movements(time);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for inventory updated_at
CREATE TRIGGER update_inventory_updated_at 
  BEFORE UPDATE ON inventory 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();