"use client";

import { useState, useEffect } from "react";
import { ClipboardList, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

export default function DPRsCard() {
  const [dprs, setDprs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDPRs() {
      try {
        const response = await fetch("/api/dprs");
        const data = await response.json();
        if (Array.isArray(data)) {
          setDprs(data.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching DPRs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDPRs();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-semibold text-slate-900">Daily Progress</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/dprs/new"
            className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
            title="Add DPR"
          >
            <Plus className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard/dprs"
            className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : dprs.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-slate-500 text-sm mb-2">No DPRs yet</p>
          <Link
            href="/dashboard/dprs/new"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Create your first DPR
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {dprs.map((dpr) => (
            <div
              key={dpr.id}
              className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-500">{dpr.date}</p>
                <p className="text-xs font-medium text-slate-700">
                  {dpr.labor_count} workers
                </p>
              </div>
              <p className="text-sm font-medium text-slate-900 line-clamp-2">
                {dpr.work_done}
              </p>
              {dpr.issues && (
                <p className="text-xs text-red-600 mt-1">⚠️ {dpr.issues}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
