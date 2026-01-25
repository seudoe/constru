-- Create dprs table if it doesn't exist
CREATE TABLE IF NOT EXISTS dprs (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if table exists but columns are missing
DO $$ 
BEGIN
  -- Add photos column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dprs' AND column_name = 'photos'
  ) THEN
    ALTER TABLE dprs ADD COLUMN photos TEXT[] DEFAULT '{}';
  END IF;

  -- Add videos column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dprs' AND column_name = 'videos'
  ) THEN
    ALTER TABLE dprs ADD COLUMN videos TEXT[] DEFAULT '{}';
  END IF;

  -- Add full_text column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dprs' AND column_name = 'full_text'
  ) THEN
    ALTER TABLE dprs ADD COLUMN full_text TEXT;
  END IF;

  -- Add short_summary column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dprs' AND column_name = 'short_summary'
  ) THEN
    ALTER TABLE dprs ADD COLUMN short_summary TEXT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE dprs ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dprs' AND policyname = 'Anyone can view dprs') THEN
    CREATE POLICY "Anyone can view dprs" ON dprs FOR SELECT USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dprs' AND policyname = 'Anyone can create dprs') THEN
    CREATE POLICY "Anyone can create dprs" ON dprs FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Create index for date
CREATE INDEX IF NOT EXISTS idx_dprs_date ON dprs(date DESC);

-- Create trigger for updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dprs_updated_at') THEN
    CREATE TRIGGER update_dprs_updated_at 
      BEFORE UPDATE ON dprs 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
