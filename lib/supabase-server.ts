import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {
          // ❌ NO-OP (Next.js forbids setting cookies here)
        },
        remove() {
          // ❌ NO-OP (Next.js forbids removing cookies here)
        },
      },
    }
  )
}
