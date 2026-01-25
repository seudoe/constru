'use server'

import { createClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export type MaterialRequestForm = {
  material_name: string
  material_id: string
  quantity: number
  zone: string
}

export async function submitMaterialRequest(data: MaterialRequestForm) {
  const supabase = await createClient()

  // In a real app, we would get the user from auth
  // const { data: { user } } = await supabase.auth.getUser()
  const engineer_name = "Engineer" // Placeholder
  const engineer_id = "00000000-0000-0000-0000-000000000000" // Placeholder UUID if needed, or handle in DB

  const { error } = await supabase.from("material_requests").insert({
    material_name: data.material_name,
    material_id: data.material_id,
    quantity: data.quantity,
    zone: data.zone,
    engineer_name: engineer_name,
    status: "pending",
    // expires_at is correctly set during rejection, not initial submission usually, 
    // but the original code had it. The prompt says "Set expires_at to NOW() + INTERVAL '2 days' On Reject".
    // So for pending, it can be null.
  })

  if (error) {
    console.error("Error submitting request:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/engineer/inventory")
  revalidatePath("/manager/inventory")
  return { success: true }
}

export async function approveMaterialRequest(id: string) {
  const supabase = await createClient()

  // 1. Fetch the request details
  const { data: request, error: reqError } = await supabase
    .from("material_requests")
    .select("*")
    .eq("id", id)
    .single()

  if (reqError || !request) {
    return { success: false, error: "Request not found" }
  }

  // 2. Fetch GST Rate from Master
  const { data: gstData, error: gstError } = await supabase
    .from("gst_master")
    .select("gst_rate")
    .eq("material_name", request.material_name)
    .single()

  if (gstError || !gstData) {
    console.error("GST Lookup Failed:", request.material_name)
    return { success: false, error: `GST Rate not found for '${request.material_name}'. Please add to GST Master first.` }
  }

  // 3. Create Purchase Order (Locked Financials)
  const gstRate = gstData.gst_rate
  const estimatedCost = 0 // We don't know unit price yet, that comes from Supplier Bill. 
  // OR we could have a rate card. For now, we leave cost 0 or null until bill.

  const { error: poError } = await supabase
    .from("purchase_orders")
    .insert({
      request_id: id,
      material_name: request.material_name,
      quantity: request.quantity,
      gst_rate: gstRate,
      status: 'issued',
      approved_by: (await supabase.auth.getUser()).data.user?.id
    })

  if (poError) {
    console.error("PO Creation Failed:", poError)
    return { success: false, error: "Failed to create Purchase Order" }
  }

  // 4. Update Request Status
  const { error } = await supabase
    .from("material_requests")
    .update({ status: "approved" })
    .eq("id", id)

  if (error) {
    console.error("Error approving request:", error)
    return { success: false, error: error.message }
  }

  // 5. Audit Log (Conceptual - if table exists)
  // await supabase.from("gst_audit_logs").insert(...)

  revalidatePath("/manager/material-requests")
  revalidatePath("/engineer/material-request")
  return { success: true }
}

export async function rejectMaterialRequest(id: string, reason: string) {
  const supabase = await createClient()

  // Set expires_at to 2 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 2)

  const { error } = await supabase
    .from("material_requests")
    .update({
      status: "rejected",
      manager_reason: reason,
      expires_at: expiresAt.toISOString()
    })
    .eq("id", id)

  if (error) {
    console.error("Error rejecting request:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/manager/material-requests")
  revalidatePath("/engineer/material-request")
  return { success: true }
}

export async function reapplyMaterialRequest(id: string, note?: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("material_requests")
    .update({
      status: "pending",
      manager_reason: null,
      expires_at: null,
      engineer_note: note
    })
    .eq("id", id)

  if (error) {
    console.error("Error reapplying request:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/engineer/inventory")
  revalidatePath("/manager/inventory")
  return { success: true }
}
