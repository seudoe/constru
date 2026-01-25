"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Clock, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OtpRequest {
  id: number;
  task_id: number;
  labour_id: number;
  otp_code: string;
  is_verified: boolean;
  requested_at: string;
  expires_at: string;
  kanban: {
    id: number;
    description: string;
    task_type: string;
    priority: number;
  };
}

export function OtpNotificationCard() {
  const [otpRequests, setOtpRequests] = useState<OtpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [otpInputs, setOtpInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchOtpRequests();
    // Poll for new OTP requests every 30 seconds
    const interval = setInterval(fetchOtpRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOtpRequests() {
    try {
      const response = await fetch("/api/otp-requests");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setOtpRequests(data);
        }
      }
    } catch (error) {
      console.warn("Failed to fetch OTP requests (feature may not be available):", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(taskId: number, otpCode: string) {
    if (!otpCode || otpCode.length !== 6) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }

    setVerifying(taskId);

    try {
      const response = await fetch("/api/otp-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          otp_code: otpCode,
        }),
      });

      if (response.ok) {
        alert("OTP verified successfully! You can now proceed with the task.");
        setOtpInputs(prev => ({ ...prev, [taskId]: "" }));
        await fetchOtpRequests();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to verify OTP. Please check the code and try again.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      alert("Failed to verify OTP. Please try again.");
    } finally {
      setVerifying(null);
    }
  }

  const handleOtpInputChange = (taskId: number, value: string) => {
    // Only allow numeric input and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtpInputs(prev => ({ ...prev, [taskId]: numericValue }));
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return "border-red-200 bg-red-50";
    if (priority <= 3) return "border-amber-200 bg-amber-50";
    return "border-green-200 bg-green-50";
  };

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return "Critical";
    if (priority === 2) return "High";
    if (priority === 3) return "Medium";
    if (priority === 4) return "Low";
    return "Minimal";
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (otpRequests.length === 0) {
    return null; // Don't show the card if there are no OTP requests
  }

  return (
    <Card className="p-6 border-orange-200 bg-orange-50">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-orange-800">
          Safety Clearance Required
        </h3>
      </div>
      
      <p className="text-sm text-orange-700 mb-4">
        You have been assigned to hazardous tasks that require OTP verification. 
        Please provide the OTP code to your manager for safety clearance.
      </p>

      <div className="space-y-4">
        {otpRequests.map((request) => (
          <Card
            key={request.id}
            className={cn(
              "p-4 border-2",
              getPriorityColor(request.kanban.priority)
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">
                    Hazardous Task
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded",
                    request.kanban.priority <= 2 ? "bg-red-100 text-red-700" :
                    request.kanban.priority <= 3 ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700"
                  )}>
                    {getPriorityLabel(request.kanban.priority)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {request.kanban.description}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  {formatTimeRemaining(request.expires_at)}
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded border">
              <div className="text-center mb-3">
                <Label className="text-sm font-medium text-gray-700">
                  Your OTP Code (Share with Manager):
                </Label>
                <div className="text-2xl font-mono font-bold text-blue-600 mt-1 tracking-wider">
                  {request.otp_code}
                </div>
              </div>
              
              <div className="border-t pt-3">
                <Label className="text-sm text-gray-600 mb-2 block">
                  Or verify directly if manager provides the code:
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otpInputs[request.task_id] || ""}
                    onChange={(e) => handleOtpInputChange(request.task_id, e.target.value)}
                    className="flex-1"
                    maxLength={6}
                    disabled={verifying === request.task_id}
                  />
                  <Button
                    onClick={() => handleVerifyOtp(request.task_id, otpInputs[request.task_id] || "")}
                    disabled={
                      !otpInputs[request.task_id] || 
                      otpInputs[request.task_id].length !== 6 ||
                      verifying === request.task_id
                    }
                    className="px-4"
                  >
                    {verifying === request.task_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-xs text-blue-700">
          <strong>Safety Notice:</strong> These OTP codes are required for hazardous task authorization. 
          Share the code with your manager or supervisor before starting work. The codes expire in 24 hours.
        </p>
      </div>
    </Card>
  );
}