"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Loader2, MapPin, Calendar, ImageIcon, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function ExpenseReportList() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expense_reports")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) setReports(data);
      setLoading(false);
    };

    fetchReports();
  }, []);

  if (loading) return <div className="p-4 text-center op-50"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></div>;

  if (reports.length === 0) {
    return (
      <div className="p-6 border border-dashed rounded-lg text-center text-muted-foreground">
        <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
        No expense reports submitted yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report.id} className="card p-4 flex gap-4 items-start border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/5 transition-colors">
          {/* Image Thumbnail */}
          <Dialog>
            <DialogTrigger>
               <img 
                src={report.image_url} 
                alt="Expense" 
                className="w-20 h-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity border border-border" 
              />
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-none">
               <img src={report.image_url} alt="Full View" className="w-full h-auto max-h-[80vh] object-contain" />
            </DialogContent>
          </Dialog>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--foreground)] truncate">
              {report.description || "No description provided"}
            </p>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(report.created_at).toLocaleDateString()}
              </span>
              
              {report.address ? (
                 <a 
                  href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-start gap-1 hover:text-blue-500 hover:underline transition-colors mt-1 max-w-full"
                >
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="truncate">{report.address}</span>
                </a>
              ) : report.latitude && report.longitude && (
                <a 
                  href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-blue-500 hover:underline transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  View Location
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
