import { supabase } from "./supabase-browser"
import { Database } from "@/types/supabase"

type AlertInsert = Database["public"]["Tables"]["alerts"]["Insert"]

export async function createAlert(alert: AlertInsert) {
  const { error } = await supabase
    .from("alerts")
    .insert([alert] as never[])

  if (error) throw error
}

export async function fetchAlerts() {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")

    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}
