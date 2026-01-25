"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { Database } from "@/types/supabase"

type MovementInsert = Database['public']['Tables']['movements']['Insert']

export default function AddMovementForm() {
  const [form, setForm] = useState<MovementInsert>({
    worker_id: "",
    item_id: "",
    from_zone: "",
    to_zone: "",
    approved: false
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submit() {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Get current user
      const supabaseClient = createClient()
      const { data: { user } } = await supabaseClient.auth.getUser()
      
      if (!user) {
        setError("You must be logged in to log movements")
        setLoading(false)
        return
      }

      // Insert movement into database
      const { data: movementData, error: insertError } = await supabaseClient
        .from("movements")
        .insert({
          ...form,
          worker_id: form.worker_id || user.id
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error inserting movement:", insertError.message)
        setError(insertError.message)
        setLoading(false)
        return
      }

      // Process the movement (update inventory, trigger alerts) via API
      try {
        const processResponse = await fetch("/api/movements/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_id: form.item_id,
            from_zone: form.from_zone,
            to_zone: form.to_zone
          })
        })

        if (!processResponse.ok) {
          const errorData = await processResponse.json()
          console.error("Error processing movement:", errorData.error)
          // Don't fail the whole operation, just log the error
        }
      } catch (processError) {
        console.error("Error processing movement:", processError)
        // Don't fail the whole operation, just log the error
      }

      setSuccess(true)
      
      // Reset form after a short delay
      setTimeout(() => {
        setForm({
          worker_id: "",
          item_id: "",
          from_zone: "",
          to_zone: "",
          approved: false
        })
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-[#e6dccf] p-4 rounded-xl shadow">
      <div className="grid grid-cols-2 gap-2">
        {(["worker_id", "item_id", "from_zone", "to_zone"] as const).map(f => (
          <input
            key={f}
            placeholder={f.replace("_", " ")}
            className="border rounded px-2 py-1"
            value={form[f]}
            onChange={e => setForm({ ...form, [f]: e.target.value })}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-2 animate-pulse">
          ❌ {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-600 mt-2 animate-pulse">
          ✅ Movement logged successfully!
        </p>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="mt-3 w-full bg-[#3a2e1f] text-white py-2 rounded hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "Logging..." : "Log Movement"}
      </button>
    </div>
  )
}
