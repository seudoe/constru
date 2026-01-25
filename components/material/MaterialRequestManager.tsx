"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase-browser";
import { approveMaterialRequest, rejectMaterialRequest } from "@/actions/material-request";
import { Check, X, Loader2, Package, MapPin, Calendar, User, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea" // Assuming this exists or using simple textarea
import { Badge } from "@/components/ui/badge" // If Shadcn badge exists, else creating basic one

const supabase = createClient();


interface MaterialRequestManagerProps {
  onApproveSuccess?: () => void;
}

export default function MaterialRequestManager({ onApproveSuccess }: MaterialRequestManagerProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isPending, startTransition] = useTransition();

  // Fetch only pending requests
  async function fetchRequests() {
    const { data } = await supabase
      .from("material_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (data) setRequests(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchRequests();
    const channel = supabase
      .channel("manager_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "material_requests" },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function handleApprove(id: string) {
    startTransition(async () => {
      const result = await approveMaterialRequest(id);
      if (result.success) {
        toast.success("Request approved and added to inventory");
        if (onApproveSuccess) onApproveSuccess();
      } else {
        toast.error("Failed to approve: " + result.error);
      }
    });
  }

  function handleRejectSubmit() {
    if (!rejectingId || !rejectReason) return;
    
    startTransition(async () => {
      const result = await rejectMaterialRequest(rejectingId, rejectReason);
      if (result.success) {
        toast.success("Request rejected");
        setRejectingId(null);
        setRejectReason("");
      } else {
        toast.error("Failed to reject: " + result.error);
      }
    });
  }

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h2 className="text-xl font-semibold opacity-90 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary"/> Pending Approvals
          </h2>
          <p className="text-sm text-muted-foreground opacity-80">Review requests from engineers.</p>
        </div>
        
        {requests.length > 0 && (
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
            {requests.length} Use(s) Waiting
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 opacity-50"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-xl bg-[var(--card)]/50">
          <Package className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
          <p className="text-lg font-medium opacity-70">No pending requests</p>
          <p className="text-sm opacity-50">All caught up!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => (
            <div 
              key={req.id} 
              className="bg-card border border-border p-5 rounded-lg shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden transition-all hover:shadow-md"
            >
               {/* Decorative Side Bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h3 className="text-lg font-bold text-foreground">{req.material_name}</h3>
                  <span className="text-xs font-mono bg-secondary px-2 py-1 rounded text-muted-foreground">
                    {req.material_id}
                  </span>
                  {req.engineer_note && (
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                      Re-applied
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-primary" />
                    <span>{req.engineer_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{req.zone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Package className="w-4 h-4 text-primary" />
                    <span>Qty: {req.quantity}</span>
                  </div>
                </div>
                {req.engineer_note && (
                  <div className="mt-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded inline-block">
                    Note: {req.engineer_note}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 justify-end md:justify-start">
                 <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectingId(req.id)}
                  disabled={isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(req.id)}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request.
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <DialogFooter>
             <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
             <Button variant="destructive" onClick={handleRejectSubmit} disabled={!rejectReason || isPending}>
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Confirm Rejection
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
