import { supabase } from "@/lib/supabase-browser";

export function generateUpdateId(taskId: string, count: number) {
  const taskNo = taskId.replace("TASK_", "");
  return `UPD_${taskNo}_${String(count).padStart(2, "0")}`;
}

export async function getTodayUpdateCount(taskId: string) {
  const today = new Date().toISOString().split("T")[0];

  // Note: task_updates table exists but may not be in generated types
  // Run: npm run supabase:gen-types to regenerate types
  const { count } = await (supabase as any)
    .from("task_updates")
    .select("*", { count: "exact", head: true })
    .eq("task_id", taskId)
    .gte("created_at", `${today}T00:00:00`);

  return count || 0;
}

export async function saveTaskUpdate(update: any) {
  // Note: task_updates table exists but may not be in generated types
  // Run: npm run supabase:gen-types to regenerate types
  const { error } = await (supabase as any).from("task_updates").insert([update]);
  if (error) throw error;
}
