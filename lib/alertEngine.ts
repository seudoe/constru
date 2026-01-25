import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"

type AlertInsert = Database['public']['Tables']['alerts']['Insert']

// Create admin client for server-side operations
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null

export async function runAlertEngine(item: {
  id: string
  item_name: string
  quantity: number
  min_stock: number | null
}) {
  if (!supabaseAdmin) {
    console.warn("Supabase admin client not configured")
    return
  }

  const min = item.min_stock ?? 10

  if (item.quantity >= min) return

  const alertData: AlertInsert = {
    message: `Low stock for ${item.item_name} (${item.quantity} left)`,
    level: "warning"
  }

  await supabaseAdmin.from("alerts").insert(alertData)
}
