import { supabase } from "./supabase-browser"
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js"



export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE"

export type RealtimePayload<T> = {
  new: T | null
  old: T | null
  eventType: RealtimeEventType
}

/**
 * Generic table subscription helper
 * Works for inventory, movements, alerts, etc.
 */
export function subscribeToTable<T>(
  table: string,
  callback: (payload: RealtimePayload<T>) => void
) {
  const channel = supabase.channel(`realtime-${table}`)

  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table },
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      callback({
        new: (payload.new as T) || null,
        old: (payload.old as T) || null,
        eventType: payload.eventType as RealtimeEventType
      })
    }
  )

  channel.subscribe()

  // 🔁 Return unsubscribe handler for cleanup (important for PWA + memory)
  return () => {
    supabase.removeChannel(channel)
  }
}


  export function subscribeToContracts(onChange: () => void) {
  return supabase
    .channel("contracts-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "contracts" },
      () => onChange()
    )
    .subscribe()


}
