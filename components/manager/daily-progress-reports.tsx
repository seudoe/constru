"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DPRItem {
  id: number;
  date: string;
  site: string;
  fileName: string;
}

export function DailyProgressReports() {
  const [dprs, setDprs] = useState<DPRItem[]>([]);
  const [loadedCount, setLoadedCount] = useState(5);
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  /* ---------------- Fetch DPRs ---------------- */
  useEffect(() => {
    async function fetchDPRs() {
      const supabase = createClient();

      const { data, error } = await supabase.storage
        .from("dpr") // bucket name
        .list("", {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });
      // console.log(data, error);
      if (error) {
        console.error("Failed to fetch DPRs:", error);
        return;
      }
      console.log(data);
      const formatted = data
        .filter((file) => file.name.endsWith(".pdf"))
        .map((file, index) => ({
          id: index,
          date: new Date(file.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          site: file.name.replace(".pdf", ""),
          fileName: file.name,
        }));

      setDprs(formatted);
    }
    console.log("Fetching DPRs...");
    fetchDPRs();
  }, []);

  const displayedDPRs = dprs.slice(0, loadedCount);

  const handleLoadMore = () => {
    setLoadedCount((prev) => Math.min(prev + 5, dprs.length));
  };

  /* ---------------- View PDF ---------------- */
  const handleViewPDF = (fileName: string) => {
    const supabase = createClient();
    const { data } = supabase.storage.from("dpr").getPublicUrl(fileName);

    setSelectedPDF(data.publicUrl);
    setIsPreviewOpen(true);
  };

  /* ---------------- Download PDF ---------------- */
  const handleDownloadPDF = (fileName: string) => {
    const supabase = createClient();
    const { data } = supabase.storage.from("dpr").getPublicUrl(fileName);

    window.open(data.publicUrl, "_blank");
  };

  return (
    <>
      <Card className="p-6 transition-all duration-500 hover:shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Daily Progress Reports
          </h2>
          <FileText className="w-5 h-5 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          {displayedDPRs.map((dpr) => (
            <div
              key={dpr.id}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary transition-all border border-border"
            >
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">
                  {dpr.date}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{dpr.site}</p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => handleViewPDF(dpr.fileName)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  View PDF
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => handleDownloadPDF(dpr.fileName)}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>

        {loadedCount < dprs.length && (
          <Button
            variant="outline"
            className="w-full mt-4 h-9"
            onClick={handleLoadMore}
          >
            Load More ({dprs.length - loadedCount} remaining)
          </Button>
        )}
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
          </DialogHeader>

          {selectedPDF && (
            <iframe
              src={selectedPDF}
              className="w-full h-[70vh] rounded-md border"
              title="DPR PDF Preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
