"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase-browser";
import { submitMaterialRequest, reapplyMaterialRequest, MaterialRequestForm } from "@/actions/material-request";
import { Loader2, Plus, RefreshCw, Archive, CheckCircle2, XCircle, Clock, Package } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const supabase = createClient();

export default function MaterialRequestEngineer() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reapplyId, setReapplyId] = useState<string | null>(null);
  const [reapplyNote, setReapplyNote] = useState("");

  // Form State
  const [formData, setFormData] = useState<MaterialRequestForm>({
    material_name: "",
    material_id: "",
    quantity: 0,
    zone: ""
  });
  const [isSubmitting, startTransition] = useTransition();

  // Fetch Requests
  async function fetchRequests() {
    const { data } = await supabase
      .from("material_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setRequests(data);
    setLoading(false);
  }

  // Realtime Subscription
  useEffect(() => {
    fetchRequests();
    const channel = supabase
      .channel("engineer_requests")
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

  // Submit Handler
  function handleSubmit() {
    if (!formData.material_name || !formData.quantity || !formData.zone) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      const result = await submitMaterialRequest(formData);
      if (result.success) {
        toast.success("Request submitted successfully");
        setFormData({ material_name: "", material_id: "", quantity: 0, zone: "" });
        setIsDialogOpen(false);
      } else {
        toast.error("Failed to submit request: " + result.error);
      }
    });
  }

  // Reapply Handler
  function handleReapply(id: string) {
    if (!id) return;
    startTransition(async () => {
      const result = await reapplyMaterialRequest(id, reapplyNote);
      if (result.success) {
        toast.success("Request re-applied successfully");
        setReapplyId(null);
        setReapplyNote("");
      } else {
        toast.error("Failed to reapply: " + result.error);
      }
    });
  }

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold opacity-90 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary"/> My Material Requests
          </h2>
          <p className="text-sm text-muted-foreground opacity-80">Track status and submit new requests.</p>
        </div>

        {/* Dialog for New Request */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Material Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Request Material</DialogTitle>
              <DialogDescription>
                Submit a new request for material supply. Manager approval required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Material
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Cement"
                  className="col-span-3"
                  value={formData.material_name}
                  onChange={e => setFormData({ ...formData, material_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mid" className="text-right">
                  ID
                </Label>
                <Input
                  id="mid"
                  placeholder="e.g. MAT-01"
                  className="col-span-3"
                  value={formData.material_id}
                  onChange={e => setFormData({ ...formData, material_id: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="qty" className="text-right">
                  Quantity
                </Label>
                <Input
                  id="qty"
                  type="number"
                  placeholder="0"
                  className="col-span-3"
                  value={formData.quantity || ""}
                  onChange={e => setFormData({ ...formData, quantity: +e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="zone" className="text-right">
                  Zone
                </Label>
                <Input
                  id="zone"
                  placeholder="e.g. Zone A"
                  className="col-span-3"
                  value={formData.zone}
                  onChange={e => setFormData({ ...formData, zone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
               <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Submit Request
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      <div className="space-y-3 animate-slide-up">
        {loading ? (
          <div className="text-center py-12 opacity-50"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 opacity-50 border border-dashed border-[var(--border)] rounded-lg">
            No requests found.
          </div>
        ) : (
          requests.map(req => (
            <div 
              key={req.id} 
              className={`group card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:bg-secondary/20 border-l-4 ${
                req.status === 'approved' ? 'border-l-emerald-500' :
                req.status === 'rejected' ? 'border-l-red-500' :
                'border-l-amber-500'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{req.material_name}</span>
                  <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                    {req.material_id}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-3">
                  <span>Qty: <b>{req.quantity}</b></span>
                  <span className="opacity-50">|</span>
                  <span>Zone: {req.zone}</span>
                  <span className="opacity-50">|</span>
                  <span className="text-xs">{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
                {req.manager_reason && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded inline-block">
                    Reason: {req.manager_reason}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 min-w-[140px] justify-end">
                {req.status === 'pending' && (
                  <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-full text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" /> Pending
                  </span>
                )}
                {req.status === 'approved' && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                    <span className="text-[10px] text-muted-foreground opacity-80">
                      Inventory Updated
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(req.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {req.status === 'rejected' && (
                  <div className="flex flex-col items-end gap-2">
                      <span className="flex items-center gap-1.5 text-red-600 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-full text-xs font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setReapplyId(req.id)}
                      disabled={isSubmitting}
                      className="h-7 text-xs px-2 hover:bg-background"
                    >
                        <RefreshCw className="w-3 h-3 mr-1.5" /> Reapply
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

       {/* Reapply Modal */}
      <Dialog open={!!reapplyId} onOpenChange={(open) => !open && setReapplyId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reapply Request</DialogTitle>
            <DialogDescription>
              Resubmit this request? You can add an optional note for the manager.
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Reviewing changes..."
            value={reapplyNote}
            onChange={e => setReapplyNote(e.target.value)}
          />
          <DialogFooter>
             <Button variant="outline" onClick={() => { setReapplyId(null); setReapplyNote(""); }}>Cancel</Button>
             <Button onClick={() => handleReapply(reapplyId!)} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Confirm Reapply
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
