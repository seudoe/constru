-- Update the trigger function to work with the proper material_requests table
CREATE OR REPLACE FUNCTION on_approve_material_request()
RETURNS TRIGGER 
SECURITY DEFINER
AS $
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    
    -- Attempt update first (targeting existing 'inventory' table)
    UPDATE inventory 
    SET quantity = quantity + NEW.quantity,
        updated_at = NOW()
    WHERE item_id = NEW.material_id AND zone = NEW.zone;
    
    -- If no existing record found, insert new one
    IF NOT FOUND THEN
      INSERT INTO inventory (item_name, item_id, quantity, zone, min_stock)
      VALUES (NEW.material_name, NEW.material_id, NEW.quantity, NEW.zone, 10);
    END IF;
      
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Re-create the trigger
DROP TRIGGER IF EXISTS trigger_approve_material_request ON material_requests;
CREATE TRIGGER trigger_approve_material_request
  AFTER UPDATE ON material_requests
  FOR EACH ROW
  EXECUTE FUNCTION on_approve_material_request();

-- Force PostgREST to refresh its schema cache
NOTIFY pgrst, 'reload schema';