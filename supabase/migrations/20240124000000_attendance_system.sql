-- Create attendance_requests table
CREATE TABLE attendance_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID NOT NULL,
    worker_name VARCHAR(255) NOT NULL,
    worker_email VARCHAR(255) NOT NULL,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    is_within_zone BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_attendance table
CREATE TABLE daily_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendance_date DATE NOT NULL,
    present_worker_ids UUID[] NOT NULL DEFAULT '{}',
    total_workers_present INTEGER DEFAULT 0,
    marked_by UUID NOT NULL, -- engineer/supervisor who marked attendance
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(attendance_date) -- Only one record per date
);

-- Create indexes for better performance
CREATE INDEX idx_attendance_requests_worker_id ON attendance_requests(worker_id);
CREATE INDEX idx_attendance_requests_status ON attendance_requests(status);
CREATE INDEX idx_attendance_requests_date ON attendance_requests(request_date);
CREATE INDEX idx_daily_attendance_date ON daily_attendance(attendance_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_attendance_requests_updated_at 
    BEFORE UPDATE ON attendance_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_attendance_updated_at 
    BEFORE UPDATE ON daily_attendance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies (Row Level Security)
ALTER TABLE attendance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendance ENABLE ROW LEVEL SECURITY;

-- Policy for attendance_requests (engineers can see all, workers can see their own)
CREATE POLICY "Engineers can view all attendance requests" ON attendance_requests
    FOR SELECT USING (true); -- You can add role-based checks here

CREATE POLICY "Workers can insert their own requests" ON attendance_requests
    FOR INSERT WITH CHECK (true); -- You can add worker-specific checks here

CREATE POLICY "Engineers can update attendance requests" ON attendance_requests
    FOR UPDATE USING (true); -- You can add role-based checks here

-- Policy for daily_attendance (engineers can manage all)
CREATE POLICY "Engineers can manage daily attendance" ON daily_attendance
    FOR ALL USING (true); -- You can add role-based checks here