"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Move, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function MovementsCard() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovements() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("movements")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching movements:", error);
          setMovements([]);
        } else if (data) {
          setMovements(data);
        }
      } catch (error) {
        console.error("Error fetching movements:", error);
        setMovements([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMovements();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Move className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-semibold text-slate-900">Recent Movements</h2>
        </div>
        <Link
          href="/movements"
          className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : movements.length === 0 ? (
        <p className="text-slate-500 text-sm">No movements</p>
      ) : (
        <div className="space-y-3">
          {movements.map((movement) => (
            <div
              key={movement.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div>
                <p className="font-medium text-slate-900 text-sm">
                  {movement.item_id}
                </p>
                <p className="text-xs text-slate-500">
                  {movement.from_zone} → {movement.to_zone}
                </p>
              </div>
              <div
                className={`px-2 py-1 rounded text-xs font-medium ${
                  movement.approved
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {movement.approved ? "Approved" : "Pending"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
