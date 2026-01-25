// components/shared/MovementsView.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { subscribeToTable } from "@/lib/realtime";
import AddMovementForm from "@/components/AddMovementForm";

interface Movement {
  id: string;
  worker_id: string;
  item_id: string;
  from_zone: string;
  to_zone: string;
  approved: boolean | null;
  created_at: string | null;
}

interface MovementsViewProps {
  canAddMovements?: boolean;
}

export default function MovementsView({ canAddMovements = true }: MovementsViewProps) {
  const [movements, setMovements] = useState<Movement[]>([]);

  async function fetchMovements() {
    const supabase = createClient();
    const { data } = await supabase
      .from("movements")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setMovements(data);
  }

  useEffect(() => {
    let mounted = true;

    async function initializeData() {
      await fetchMovements();

      if (!mounted) return;

      const unsubscribe = subscribeToTable<Movement>("movements", (payload) => {
        if (payload.eventType === "INSERT") {
          setMovements((prev) => [payload.new!, ...prev]);
        }

        if (payload.eventType === "UPDATE") {
          setMovements((prev) =>
            prev.map((m) => (m.id === payload.new!.id ? payload.new! : m))
          );
        }

        if (payload.eventType === "DELETE") {
          setMovements((prev) => prev.filter((m) => m.id !== payload.old!.id));
        }
      });

      return unsubscribe;
    }

    initializeData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">🔄 Movements</h1>
        {canAddMovements && <AddMovementForm />}
      </div>

      <div className="space-y-4">
        {movements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No movements found.
          </div>
        )}

        {movements.map((m) => (
          <div
            key={m.id}
            className={`
              bg-card border border-border rounded-xl p-4 shadow
              transition hover:shadow-lg
              ${!m.approved ? "ring-2 ring-red-400 animate-pulse" : ""}
            `}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">
                  {m.item_id} — {m.from_zone} → {m.to_zone}
                </p>
                <p className="text-sm text-muted-foreground">
                  Worker: {m.worker_id}
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  m.approved
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                }`}
              >
                {m.approved ? "Approved" : "Unauthorized"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
