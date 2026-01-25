-- Add missing inventory management tables (only if they don't exist)

-- Create inventory table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_id TEXT NOT NULL UNIQUE,
  zone TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create movements table if it doesn't exist
CREATE TABLE IF NOT EXISTS movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  from_zone TEXT NOT NULL,
  to_zone TEXT NOT NULL,
  approved BOOLEAN DEFAULT false,
  risk_level TEXT,
  time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  level TEXT NOT NULL,
  related_item_id UUID REFERENCES inventory(id),
  related_worker_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS only if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'inventory' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'movements' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'alerts' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies for inventory (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'Anyone can view inventory') THEN
    CREATE POLICY "Anyone can view inventory" ON inventory FOR SELECT USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'Managers can manage inventory') THEN
    CREATE POLICY "Managers can manage inventory" ON inventory
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role IN ('manager', 'engineer')
        )
      );
  END IF;
END $$;

-- Create policies for movements (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'movements' AND policyname = 'Anyone can view movements') THEN
    CREATE POLICY "Anyone can view movements" ON movements FOR SELECT USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'movements' AND policyname = 'Workers can create movements') THEN
    CREATE POLICY "Workers can create movements" ON movements FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'movements' AND policyname = 'Managers can update movements') THEN
    CREATE POLICY "Managers can update movements" ON movements
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role IN ('manager', 'engineer')
        )
      );
  END IF;
END $$;

-- Create policies for alerts (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Anyone can view alerts') THEN
    CREATE POLICY "Anyone can view alerts" ON alerts FOR SELECT USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'System can create alerts') THEN
    CREATE POLICY "System can create alerts" ON alerts FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_inventory_item_id ON inventory(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_zone ON inventory(zone);
CREATE INDEX IF NOT EXISTS idx_movements_item_id ON movements(item_id);
CREATE INDEX IF NOT EXISTS idx_movements_time ON movements(time);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- Create function to update updated_at timestamp (only if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for inventory updated_at (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_inventory_updated_at') THEN
    CREATE TRIGGER update_inventory_updated_at 
      BEFORE UPDATE ON inventory 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;