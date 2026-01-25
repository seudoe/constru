"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function InventoryCard() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("inventory")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching inventory:", error);
          setItems([]);
        } else if (data) {
          setItems(data);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-semibold text-slate-900">Recent Inventory</h2>
        </div>
        <Link
          href="/inventory"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
      ) : items.length === 0 ? (
        <p className="text-slate-500 text-sm">No inventory items</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div>
                <p className="font-medium text-slate-900">{item.item_name}</p>
                <p className="text-xs text-slate-500">{item.zone}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{item.quantity}</p>
                <p className="text-xs text-slate-500">Qty</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
