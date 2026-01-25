"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { toast } from "sonner";

export default function LabourOTP() {
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    // In a real app we would get the logged-in user's ID
    // For this simple demo, we fetch all pending requests
    // Or we could pass a `labourId` prop if this component is embedded in a dashboard

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            const response = await fetch('/api/otp/pending');
            const data = await response.json();
            if (Array.isArray(data)) {
                setPendingRequests(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (requestId: string, taskId: string, labourId: string) => {
        const code = otpInputs[requestId];
        if (!code) return toast.error("Please enter OTP code");

        try {
            const res = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_id: taskId,
                    labour_id: labourId,
                    otp_code: code
                })
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Identity Verified! Safe to proceed.");
                fetchPending(); // Refresh list
            } else {
                toast.error(data.error || "Verification failed");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    if (loading) return <div>Loading Safety Permits...</div>;

    if (pendingRequests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50">
                <Shield className="w-12 h-12 mb-2 text-slate-300" />
                <p>No pending safety permits.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {pendingRequests.map((req) => (
                <Card key={req.id} className="border-l-4 border-l-amber-500 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Hazardous Task Permit
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 text-sm text-slate-600">
                            <p><strong>Permit ID:</strong> {req.id.slice(0, 8)}</p>
                            <p><strong>Date:</strong> {new Date(req.created_at).toLocaleDateString()}</p>
                            <p className="mt-2 p-2 bg-amber-50 text-amber-800 rounded text-xs rounded-lg border border-amber-100">
                                This task involves hazardous materials. Please enter the OTP code sent to your device to confirm you have safety gear equipped and are ready to start.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter 6-digit OTP"
                                className="font-mono tracking-widest text-center"
                                maxLength={6}
                                value={otpInputs[req.id] || ''}
                                onChange={(e) => setOtpInputs({ ...otpInputs, [req.id]: e.target.value })}
                            />
                            <Button onClick={() => handleVerify(req.id, req.task_id, req.labour_id)}>
                                Verify
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
