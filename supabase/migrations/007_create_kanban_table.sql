-- Create kanban table
CREATE TABLE IF NOT EXISTS kanban (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  state TEXT NOT NULL DEFAULT 'not started' CHECK (state IN ('not started', 'in progress', 'completed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kanban_state ON kanban(state);
CREATE INDEX IF NOT EXISTS idx_kanban_priority ON kanban(priority);
CREATE INDEX IF NOT EXISTS idx_kanban_created_at ON kanban(created_at DESC);

-- Enable RLS
ALTER TABLE kanban ENABLE ROW LEVEL SECURITY;

-- Global view - all authenticated users can view
CREATE POLICY "Authenticated users can view kanban" ON kanban
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create tasks
CREATE POLICY "Authenticated users can create kanban" ON kanban
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Authenticated users can update tasks (for drag-drop)
CREATE POLICY "Authenticated users can update kanban" ON kanban
  FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated users can delete tasks
CREATE POLICY "Authenticated users can delete kanban" ON kanban
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_kanban_updated_at') THEN
    CREATE TRIGGER update_kanban_updated_at 
      BEFORE UPDATE ON kanban 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
