-- Add engineer_note to material_requests if it doesn't exist
ALTER TABLE material_requests ADD COLUMN IF NOT EXISTS engineer_note text;

-- Force PostgREST to refresh its schema cache to pick up the new column
NOTIFY pgrst, 'reload schema';

-- Trigger Function: On Approve Material Request
CREATE OR REPLACE FUNCTION on_approve_material_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    
    -- Attempt update first (targeting existing 'inventory' table)
    UPDATE inventory 
    SET quantity = quantity + NEW.quantity
    WHERE item_id = NEW.material_id AND zone = NEW.zone;
    
    IF NOT FOUND THEN
      INSERT INTO inventory (item_name, item_id, quantity, zone, min_stock)
      VALUES (NEW.material_name, NEW.material_id, NEW.quantity, NEW.zone, 10);
    END IF;
      
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create Trigger
DROP TRIGGER IF EXISTS trigger_approve_material_request ON material_requests;
CREATE TRIGGER trigger_approve_material_request
AFTER UPDATE ON material_requests
FOR EACH ROW
EXECUTE FUNCTION on_approve_material_request();

-- Periodic Cleanup Function
CREATE OR REPLACE FUNCTION cleanup_rejected_requests()
RETURNS void AS $$
BEGIN
  DELETE FROM material_requests
  WHERE status = 'rejected' 
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
