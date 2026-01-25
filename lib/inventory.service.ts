import { supabase } from "./supabase-browser"
import { Database } from "@/types/supabase"

type InventoryInsert = Database["public"]["Tables"]["inventory"]["Insert"]
type InventoryUpdate = Database["public"]["Tables"]["inventory"]["Update"]

export async function fetchInventory() {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function addInventoryItem(item: InventoryInsert) {
  const { error } = await supabase
    .from("inventory")
    .insert([item])

  if (error) throw error
}

export async function updateInventoryQuantity(item_id: string, newQty: number) {
  const updates: InventoryUpdate = {
    quantity: newQty
  }
  const { error } = await supabase
    .from("inventory")
    .update(updates)
    .eq("item_id", item_id)

  if (error) throw error
}
