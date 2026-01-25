import { createClient } from "@/lib/supabase-browser"

export type UserRole = "worker" | "manager" | "admin" | "engineer" | "construction_worker"

export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = createClient();
  
  // Use user_roles table as the source of truth (same as middleware)
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("id", userId)
    .single()

  if (error || !data) {
    // Fallback to profiles table if user_roles doesn't exist
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (profileError || !profileData) {
      console.warn("Role fetch failed, defaulting to worker:", error?.message || profileError?.message)
      return "worker"
    }

    // Map profile roles to user_roles format
    const profileRole = profileData.role as string
    if (profileRole === "construction_worker") return "worker"
    return profileRole as UserRole
  }

  // Map user_roles to expected format
  const role = data.role as string
  if (role === "construction_worker") return "worker"
  return role as UserRole
}