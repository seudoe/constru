"use client"

import { useState } from "react"
import { estimateContract } from "@/lib/ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ContractForm({ onEstimated }: any) {
  const [form, setForm] = useState({
    projectName: "",
    projectType: "",
    area: "",
    location: "",
    quality: "standard",
  })
  const [loading, setLoading] = useState(false)

  const submit = async () => {
  setLoading(true)

  try {
    const ai = await estimateContract({
      projectType: form.projectType,
      area: Number(form.area),
      location: form.location,
      quality: form.quality as any,
    })

    console.log("AI RESPONSE:", ai)

    if (ai?.error) {
      alert("AI Error: " + ai.error)
      setLoading(false)
      return
    }

    onEstimated({ ...form, ...ai })
  } catch (err) {
    console.error("Estimate failed:", err)
    alert("Estimate failed. Check console.")
  }

  setLoading(false)
}


  return (
    <div className="card p-4 space-y-3">
      <h2 className="text-lg font-semibold">New Contract</h2>

      <Input placeholder="Project Name" onChange={e => setForm({ ...form, projectName: e.target.value })} />
      <Input placeholder="Project Type" onChange={e => setForm({ ...form, projectType: e.target.value })} />
      <Input placeholder="Area (sqft)" type="number" onChange={e => setForm({ ...form, area: e.target.value })} />
      <Input placeholder="Location" onChange={e => setForm({ ...form, location: e.target.value })} />

      <select className="border rounded p-2"
        onChange={e => setForm({ ...form, quality: e.target.value })}>
        <option value="basic">Basic</option>
        <option value="standard">Standard</option>
        <option value="premium">Premium</option>
      </select>

      <Button onClick={submit} disabled={loading}>
        {loading ? "Estimating..." : "Estimate with AI"}
      </Button>
    </div>
  )
}
