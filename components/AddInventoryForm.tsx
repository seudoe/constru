"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { Database } from "@/types/supabase"

type InventoryInsert = Database['public']['Tables']['inventory']['Insert']

export default function AddInventoryForm() {
  const [form, setForm] = useState<InventoryInsert>({
    item_name: "",
    item_id: "",
    zone: "",
    quantity: 0,
    min_stock: 10
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addItem() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from("inventory").insert(form)

    setLoading(false)

    if (insertError) {
      console.error("Insert failed:", insertError.message)
      if (insertError.message.includes("duplicate key") || insertError.code === "23505") {
        setError(`Item ID "${form.item_id}" already exists. Please use a unique ID.`)
      } else {
        setError(insertError.message)
      }
      return
    }

    setForm({
      item_name: "",
      item_id: "",
      zone: "",
      quantity: 0,
      min_stock: 10
    })
  }

  return (
    <div className="card-premium w-full sm:w-96 animate-slide-up">
      <h3 className="text-lg font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-700">Add Inventory</h3>

      <div className="space-y-3 mb-4">
        {(["item_name", "item_id", "zone"] as const).map(f => (
          <div key={f}>
            <label className="text-xs font-semibold uppercase text-muted-foreground ml-1 mb-1 block">
              {f.replace("_", " ")}
            </label>
            <input
              placeholder={`Enter ${f.replace("_", " ")}`}
              className="w-full bg-white/50 border border-input/50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              value={form[f]}
              onChange={e => setForm({ ...form, [f]: e.target.value })}
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground ml-1 mb-1 block">Quantity</label>
            <input
              type="number"
              placeholder="0"
              className="w-full bg-white/50 border border-input/50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: +e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground ml-1 mb-1 block">Min Stock</label>
            <input
              type="number"
              placeholder="10"
              className="w-full bg-white/50 border border-input/50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              value={form.min_stock || 10}
              onChange={e => setForm({ ...form, min_stock: +e.target.value })}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm mb-4 border border-red-100 flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      <button
        onClick={addItem}
        disabled={loading}
        className="w-full btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Adding..." : "Add to Inventory"}
      </button>
    </div>
  )
}
