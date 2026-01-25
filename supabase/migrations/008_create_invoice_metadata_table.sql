-- Create invoices table for metadata storage
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_no TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  company_name TEXT NOT NULL,
  company_gstin TEXT NOT NULL,
  company_address TEXT,
  company_phone TEXT,
  
  client_name TEXT NOT NULL,
  client_gstin TEXT,
  client_address TEXT NOT NULL,
  project_name TEXT NOT NULL,
  site_address TEXT NOT NULL,
  
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_tax DECIMAL(12, 2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  
  pdf_path TEXT, -- Path in Invoices bucket
  pdf_url TEXT,  -- Public URL
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_no ON invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_client_name ON invoices(client_name);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Managers can view all invoices
CREATE POLICY "Managers can view invoices" ON invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can create invoices
CREATE POLICY "Managers can create invoices" ON invoices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE id = auth.uid() AND role = 'manager'
    ) AND auth.uid() = created_by
  );

-- Create trigger for updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invoices_updated_at') THEN
    CREATE TRIGGER update_invoices_updated_at 
      BEFORE UPDATE ON invoices 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
