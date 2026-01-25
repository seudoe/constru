-- Create site_inventory table if it doesn't exist
CREATE TABLE IF NOT EXISTS site_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id text NOT NULL,
  material_name text NOT NULL,
  quantity int DEFAULT 0,
  engineer_id uuid, -- Optional: tracking who 'owns' or last touched this inventory, if needed
  zone text,        -- Optional: if inventory is zone-specific
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(material_id, zone) -- Prevent duplicates for same material in same zone
);

-- Trigger Function: On Approve Material Request
CREATE OR REPLACE FUNCTION on_approve_material_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    
    -- Insert or Update site_inventory
    INSERT INTO site_inventory (material_id, material_name, quantity, engineer_id, zone)
    VALUES (NEW.material_id, NEW.material_name, NEW.quantity, NEW.engineer_id, NEW.zone)
    ON CONFLICT (material_id, zone) 
    DO UPDATE SET 
      quantity = site_inventory.quantity + EXCLUDED.quantity,
      updated_at = now();
      
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS trigger_approve_material_request ON material_requests;
CREATE TRIGGER trigger_approve_material_request
AFTER UPDATE ON material_requests
FOR EACH ROW
EXECUTE FUNCTION on_approve_material_request();

-- Periodic Cleanup Function (to be called via cron if available, or just manually)
CREATE OR REPLACE FUNCTION cleanup_rejected_requests()
RETURNS void AS $$
BEGIN
  DELETE FROM material_requests
  WHERE status = 'rejected' 
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
