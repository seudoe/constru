-- Create tool_qr_codes table for storing QR code metadata
CREATE TABLE IF NOT EXISTS tool_qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code TEXT NOT NULL UNIQUE, -- Unique identifier for the QR code
  location_type TEXT NOT NULL CHECK (location_type IN ('site', 'tool_room', 'storage')),
  location_name TEXT NOT NULL, -- Name of the site/tool room/storage
  created_by UUID NOT NULL, -- Engineer who created the QR
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tool_borrowings table for storing borrowing records
CREATE TABLE IF NOT EXISTS tool_borrowings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_id UUID NOT NULL REFERENCES tool_qr_codes(id) ON DELETE CASCADE,
  borrower_name TEXT NOT NULL,
  borrower_phone TEXT NOT NULL,
  borrowed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tool_borrowing_items table for storing individual tools borrowed
CREATE TABLE IF NOT EXISTS tool_borrowing_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  borrowing_id UUID NOT NULL REFERENCES tool_borrowings(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  tool_number TEXT NOT NULL, -- Painted ID number on the physical tool
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tool_qr_codes_qr_code ON tool_qr_codes(qr_code);
CREATE INDEX IF NOT EXISTS idx_tool_qr_codes_created_by ON tool_qr_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_tool_borrowings_qr_code_id ON tool_borrowings(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_tool_borrowings_borrowed_at ON tool_borrowings(borrowed_at);
CREATE INDEX IF NOT EXISTS idx_tool_borrowing_items_borrowing_id ON tool_borrowing_items(borrowing_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tool_qr_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_tool_qr_codes_updated_at 
    BEFORE UPDATE ON tool_qr_codes 
    FOR EACH ROW EXECUTE FUNCTION update_tool_qr_codes_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE tool_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_borrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_borrowing_items ENABLE ROW LEVEL SECURITY;

-- Policies for tool_qr_codes (engineers can manage, anyone can view for QR scanning)
CREATE POLICY "Anyone can view QR codes" ON tool_qr_codes
    FOR SELECT USING (true);

CREATE POLICY "Engineers can create QR codes" ON tool_qr_codes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE id = auth.uid() AND role IN ('engineer', 'manager', 'admin')
        )
    );

CREATE POLICY "Engineers can update QR codes" ON tool_qr_codes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE id = auth.uid() AND role IN ('engineer', 'manager', 'admin')
        )
    );

-- Policies for tool_borrowings (anyone can insert for form submission, engineers can view all)
CREATE POLICY "Anyone can create borrowings" ON tool_borrowings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Engineers can view all borrowings" ON tool_borrowings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE id = auth.uid() AND role IN ('engineer', 'manager', 'admin')
        )
    );

-- Policies for tool_borrowing_items (anyone can insert, engineers can view)
CREATE POLICY "Anyone can create borrowing items" ON tool_borrowing_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Engineers can view all borrowing items" ON tool_borrowing_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE id = auth.uid() AND role IN ('engineer', 'manager', 'admin')
        )
    );
