"use client";

import { useState,  useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import VoiceRecorder from "@/components/dpr/VoiceRecorder";
import { formatErrorForUser } from "@/lib/errorHandler";

export default function CreateDPRForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    work_done: "",
    labor_count: 0,
    materials_used: "",
    issues: "",
  });
  const [voiceText, setVoiceText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);

  // Auto-assign project from worker assignment
  useEffect(() => {
    async function fetchWorkerProject() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoadingProject(false);
        return;
      }

      // Get worker's assigned project
      const { data: assignment } = await supabase
        .from("project_assignments" as any)
        .select("project_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (assignment && "project_id" in assignment) {
        setProjectId(assignment.project_id as string);
      }
      setLoadingProject(false);
    }

    fetchWorkerProject();
  }, []);

  // Summarize text
  function summarizeText(text: string): string {
    if (!text || text.length < 100) return text;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join(". ");
    return summary + (sentences.length > 3 ? "..." : "");
  }

  function handleVoiceText(text: string) {
    setVoiceText(text);
    setForm(prev => ({
      ...prev,
      work_done: text,
    }));
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create a DPR");
      }

      if (!form.work_done.trim()) {
        throw new Error("Work done is required");
      }

      // Create DPR record in 'dprs' database table
      const dprData = {
        project_id: projectId,
        date: form.date,
        work_done: form.work_done.trim(),
        labor_count: form.labor_count || 0,
        materials_used: form.materials_used?.trim() || null,
        issues: form.issues?.trim() || null,
        created_by: user.id,
      };

      // Insert into dprs database table
      const response = await fetch("/api/dprs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dprData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create DPR");
      }

      setSuccess(true);
      
      // Generate and download PDF
      try {
        const pdfResponse = await fetch("/api/dprs/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dprData),
        });

        if (pdfResponse.ok) {
          const blob = await pdfResponse.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const dateStr = form.date.replace(/-/g, "");
          link.download = `DPR-${dateStr}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } catch (pdfError) {
        console.error("Error generating PDF:", pdfError);
        // Don't throw - PDF generation failure shouldn't prevent DPR creation
      }
      
      // Reset form
      setForm({
        date: new Date().toISOString().split("T")[0],
        work_done: "",
        labor_count: 0,
        materials_used: "",
        issues: "",
      });
      setVoiceText("");

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      setError(formatErrorForUser(err));
    } finally {
      setUploading(false);
    }
  }

  if (loadingProject) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Create Daily Progress Report</h3>
        {projectId && (
          <span className="text-xs text-muted-foreground bg-blue-50 px-2 py-1 rounded">
            Project Assigned
          </span>
        )}
      </div>

      {/* Date */}
      <div>
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
          className="mt-1"
        />
      </div>

      {/* Voice Recording */}
      <div>
        <Label>Voice Update (Hindi)</Label>
        <div className="mt-2">
          <VoiceRecorder onText={handleVoiceText} />
        </div>
        {voiceText && (
          <p className="text-xs text-muted-foreground mt-2">
            Voice captured: {voiceText.substring(0, 50)}...
          </p>
        )}
      </div>

      {/* Work Done */}
      <div>
        <Label htmlFor="work_done">Work Done *</Label>
        <textarea
          id="work_done"
          value={form.work_done}
          onChange={(e) => setForm({ ...form, work_done: e.target.value })}
          placeholder="Describe the work done today..."
          className="mt-1 w-full border rounded px-3 py-2 h-24 text-sm"
          required
        />
      </div>

      {/* Labor Count */}
      <div>
        <Label htmlFor="labor_count">Labor Count</Label>
        <Input
          id="labor_count"
          type="number"
          value={form.labor_count}
          onChange={(e) => setForm({ ...form, labor_count: parseInt(e.target.value) || 0 })}
          min="0"
          className="mt-1"
        />
      </div>

      {/* Materials Used */}
      <div>
        <Label htmlFor="materials_used">Materials Used</Label>
        <textarea
          id="materials_used"
          value={form.materials_used}
          onChange={(e) => setForm({ ...form, materials_used: e.target.value })}
          placeholder="List materials used..."
          className="mt-1 w-full border rounded px-3 py-2 h-20 text-sm"
        />
      </div>

      {/* Issues */}
      <div>
        <Label htmlFor="issues">Issues</Label>
        <textarea
          id="issues"
          value={form.issues}
          onChange={(e) => setForm({ ...form, issues: e.target.value })}
          placeholder="Any issues or concerns..."
          className="mt-1 w-full border rounded px-3 py-2 h-20 text-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          DPR created successfully!
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={uploading}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating DPR...
          </>
        ) : (
          "Create DPR"
        )}
      </Button>
    </form>
  );
}
