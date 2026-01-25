import { Database } from "@/types/supabase"

export type UserRole = string

interface User {
  user_metadata?: {
    role?: UserRole
  }
}

export function getUserRole(user: User): UserRole {
  return user?.user_metadata?.role ?? "construction_worker"
}

export function canApprove(role: UserRole) {
  return role === "manager"
}

export function canAddInventory(role: UserRole) {
  return role === "manager" || role === "engineer"
}

export function canMoveItems(role: UserRole) {
  return role === "construction_worker" || role === "manager"
}
