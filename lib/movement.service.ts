import { supabase } from "./supabase-browser"
import { Database } from "@/types/supabase"

type MovementInsert = Database["public"]["Tables"]["movements"]["Insert"]
type MovementUpdate = Database["public"]["Tables"]["movements"]["Update"]

export async function fetchMovements() {
  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .order("time", { ascending: false })

  if (error) throw error
  return data
}

export async function logMovement(movement: MovementInsert) {
  const { error } = await supabase
    .from("movements")
    .insert([movement] as never[])

  if (error) throw error
}

export async function approveMovement(id: string) {
  const updates: MovementUpdate = { approved: true }
  const { error } = await supabase
    .from("movements")
    .update(updates as never)
    .eq("id", id)

  if (error) throw error
}
