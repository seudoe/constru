-- Add OTP permit-to-work columns to existing kanban table
-- This is a safer migration that only adds missing columns

-- Add new columns to kanban table if they don't exist
DO $$ 
BEGIN
  -- Add task_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kanban' AND column_name = 'task_type') THEN
    ALTER TABLE kanban ADD COLUMN task_type TEXT DEFAULT 'normal' CHECK (task_type IN ('normal', 'hazardous'));
  END IF;

  -- Add require_otp column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kanban' AND column_name = 'require_otp') THEN
    ALTER TABLE kanban ADD COLUMN require_otp BOOLEAN DEFAULT false;
  END IF;

  -- Add otp_authorized column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kanban' AND column_name = 'otp_authorized') THEN
    ALTER TABLE kanban ADD COLUMN otp_authorized BOOLEAN DEFAULT false;
  END IF;
END $$;