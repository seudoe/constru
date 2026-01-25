import { createClient } from "@supabase/supabase-js"
import { runAlertEngine } from "./alertEngine"
import { Database } from "@/types/supabase"

type InventoryRow = Database['public']['Tables']['inventory']['Row']
type InventoryUpdate = Database['public']['Tables']['inventory']['Update']

// Create admin client for server-side operations
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null

export async function processMovement(movement: {
  item_id: string
  from_zone: string
  to_zone: string
}) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured")
  }

  const { data: item } = await supabaseAdmin
    .from("inventory")
    .select("*")
    .eq("item_id", movement.item_id)
    .single()

  if (!item) throw new Error("Item not found")

  const typedItem = item as InventoryRow
  if (typedItem.quantity <= 0) {
    throw new Error("No stock left")
  }

  const updateData: InventoryUpdate = { quantity: typedItem.quantity - 1 }
  
  const { data: updated } = await supabaseAdmin
    .from("inventory")
    .update(updateData)
    .eq("id", typedItem.id)
    .select()
    .single()

  if (updated) {
    await runAlertEngine(updated as InventoryRow)
  }

  return updated
}
