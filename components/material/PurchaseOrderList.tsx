"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Truck, AlertTriangle, CheckCircle2 } from "lucide-react";
import GRNPDFDownload from "@/components/GRNPDFDownload";

export default function PurchaseOrderList() {
    const [pos, setPos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchPOs();

        const channel = supabase
            .channel("po_updates")
            .on("postgres_changes", { event: "*", schema: "public", table: "purchase_orders" }, () => fetchPOs())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    async function fetchPOs() {
        // Fetch POs with their related Supplier Bill (if any)
        const { data } = await supabase
            .from("purchase_orders")
            .select("*, supplier_bills(*)")
            .order("created_at", { ascending: false });
        if (data) setPos(data);
        setLoading(false);
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "issued": return "bg-blue-100 text-blue-800 border-blue-200";
            case "billed": return "bg-purple-100 text-purple-800 border-purple-200";
            case "delivered": return "bg-orange-100 text-orange-800 border-orange-200";
            case "completed": return "bg-green-100 text-green-800 border-green-200";
            case "disputed": return "bg-red-100 text-red-800 border-red-200";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "issued": return <FileText className="w-4 h-4" />;
            case "billed": return <FileText className="w-4 h-4" />;
            case "delivered": return <Truck className="w-4 h-4" />;
            case "completed": return <CheckCircle2 className="w-4 h-4" />;
            case "disputed": return <AlertTriangle className="w-4 h-4" />;
            default: return null;
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading procurement data...</div>;

    return (
        <div className="space-y-4">
            {pos.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="pt-6 text-center text-gray-500">
                        No active Purchase Orders. Approve a request to get started.
                    </CardContent>
                </Card>
            ) : (
                pos.map((po) => {
                    // Check for GST Discrepancy (Logic: PO Rate vs Bill Rate)
                    const bill = po.supplier_bills?.[0]; // Assuming one bill per PO
                    const expectedRate = po.gst_rate;
                    const chargedRate = bill?.gst_rate_snapshot;

                    const hasBill = !!bill;
                    const rateMismatch = hasBill && (Number(expectedRate) !== Number(chargedRate));
                    const diffAmount = hasBill ? (Number(chargedRate) - Number(expectedRate)) : 0;

                    return (
                        <Card key={po.id} className={`transition-all ${rateMismatch ? 'border-red-500 shadow-red-100 ring-1 ring-red-500' : 'hover:shadow-sm'}`}>
                            <CardContent className="p-4 flex flex-col gap-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-gray-900">{po.material_name}</h4>
                                            <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(po.status)}`}>
                                                {getStatusIcon(po.status)}
                                                <span className="capitalize">{po.status}</span>
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-500 flex gap-4">
                                            <span>PO #{po.po_number || po.id.slice(0, 8)}</span>
                                            <span>Qty: {po.quantity}</span>
                                            <span>Standard GST: {po.gst_rate}%</span>
                                        </div>
                                    </div>

                                    {/* Status Specific Actions / Info */}
                                    <div className="text-sm font-medium">
                                        {po.status === 'issued' && <span className="text-blue-600">Waiting for Supplier Bill</span>}
                                        {po.status === 'billed' && <span className="text-purple-600">Bill Received. Waiting for Delivery.</span>}
                                        {po.status === 'delivered' && <span className="text-orange-600">Delivered. Validating...</span>}
                                        {po.status === 'disputed' && <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Attention Needed</span>}
                                        {po.status === 'completed' && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Invoiced</span>
                                                <div className="h-4 w-px bg-gray-300 mx-2"></div>
                                                <GRNPDFDownload po={po} bill={bill} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* GST Analysis Section - Only show if bill exists */}
                                {hasBill && (
                                    <div className={`mt-2 p-3 rounded-md text-xs border ${rateMismatch ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                                        <h5 className={`font-semibold mb-2 ${rateMismatch ? 'text-red-800' : 'text-gray-700'}`}>
                                            GST Rate Analysis {rateMismatch && "(ERROR DETECTED)"}
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <span className="block opacity-60">Expected Rate (System)</span>
                                                <span className="font-mono text-sm font-medium">{expectedRate}%</span>
                                            </div>
                                            <div>
                                                <span className="block opacity-60">Charged Rate (Bill)</span>
                                                <span className={`font-mono text-sm font-medium ${rateMismatch ? 'text-red-600 font-bold' : ''}`}>
                                                    {chargedRate}%
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block opacity-60">Difference</span>
                                                <span className={`font-mono text-sm font-medium ${rateMismatch ? 'text-red-600' : 'text-green-600'}`}>
                                                    {diffAmount > 0 ? '+' : ''}{diffAmount}%
                                                </span>
                                            </div>
                                        </div>
                                        {rateMismatch && (
                                            <p className="mt-2 text-red-600 italic">
                                                Warning: Supplier is charging a different tax rate than the system master.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </div>
    );
}
