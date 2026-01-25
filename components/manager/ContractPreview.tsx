"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";

interface ContractData {
  project_name: string;
  project_type: string;
  area: number;
  location: string;
  quality: string;

  estimated_days: number;
  days_explanation: string;

  workers_required: number;
  workers_explanation: string;

  material_cost: number;
  material_explanation: string;

  labor_cost: number;
  labor_explanation: string;

  total_cost: number;
  total_explanation: string;
}

interface PastContract {
  id: string;
  project_name: string;
  total_cost: number;
  pdf_url: string;
  created_at: string;
}

export default function ContractPreview({
  formData,
}: {
  formData: {
    project_name: string;
    project_type: string;
    area: number;
    location: string;
    quality: string;
  };
}) {
  const supabase = createClient();

  const [estimate, setEstimate] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pastContracts, setPastContracts] = useState<PastContract[]>([]);

  // -------------------------------
  // Fetch past contracts
  // -------------------------------
  const loadPastContracts = async () => {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPastContracts(data);
    }
  };

  useEffect(() => {
    loadPastContracts();
  }, []);

  // -------------------------------
  // Estimate with Gemini
  // -------------------------------
  const estimateWithAI = async () => {
    if (
      !formData.project_name ||
      !formData.project_type ||
      !formData.area ||
      !formData.location
    ) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const prompt = `
You are a senior construction project estimator in India.

Estimate a construction contract based on:

Project Name: ${formData.project_name}
Project Type: ${formData.project_type}
Area: ${formData.area} sq.ft
Location: ${formData.location}
Quality Level: ${formData.quality}

Return STRICT JSON in this exact format:

{
  "estimated_days": number,
  "days_explanation": string,
  "workers_required": number,
  "workers_explanation": string,
  "material_cost": number,
  "material_explanation": string,
  "labor_cost": number,
  "labor_explanation": string,
  "total_cost": number,
  "total_explanation": string
}

All costs in INR.
All explanations must sound realistic and professional.
`;

      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error("AI Error:", data);
        alert("AI estimation failed. Check console.");
        setLoading(false);
        return;
      }

      setEstimate({
        project_name: formData.project_name,
        project_type: formData.project_type,
        area: formData.area,
        location: formData.location,
        quality: formData.quality,
        ...data,
      });
    } catch (err) {
      console.error("🔥 Estimate Error:", err);
      alert("AI estimation crashed");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Generate PDF + Save to Supabase
  // -------------------------------
  const generatePdfAndSave = async () => {
    if (!estimate) return;

    setSaving(true);

    try {
      // 1️⃣ Generate PDF via Puppeteer API
      const pdfRes = await fetch("/api/contracts/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(estimate),
      });

      if (!pdfRes.ok) {
        alert("PDF generation failed");
        setSaving(false);
        return;
      }

      const pdfBlob = await pdfRes.blob();

      // 2️⃣ Upload to Supabase Storage
      const fileName = `contract-${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from("contracts")
          .upload(fileName, pdfBlob, {
            contentType: "application/pdf",
            upsert: true,
          });

      if (uploadError) {
        console.error("Upload Error:", uploadError);
        alert("PDF upload failed");
        setSaving(false);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("contracts")
        .getPublicUrl(fileName);

      // 3️⃣ Insert row into contracts table
      const { error: dbError } = await supabase.from("contracts").insert({
        project_name: estimate.project_name,
        project_type: estimate.project_type,
        location: estimate.location,
        area: estimate.area,
        quality: estimate.quality,

        estimated_days: estimate.estimated_days,
        workers_required: estimate.workers_required,

        material_cost: estimate.material_cost,
        labor_cost: estimate.labor_cost,
        total_cost: estimate.total_cost,

        pdf_url: publicUrl.publicUrl,
      });

      if (dbError) {
        console.error("DB Error:", dbError);
        alert("Database save failed");
        setSaving(false);
        return;
      }

      // 4️⃣ Open PDF + refresh past contracts
      window.open(publicUrl.publicUrl, "_blank");
      await loadPastContracts();
      alert("Contract generated & saved successfully!");

    } catch (err) {
      console.error("🔥 Save Error:", err);
      alert("Contract save failed");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div className="space-y-6">

      {/* Estimate Preview */}
      <div className="border rounded-lg p-4 bg-white shadow">
        <h2 className="text-lg font-semibold mb-2">Estimate Preview</h2>

        {!estimate && (
          <p className="text-muted-foreground">No estimate yet.</p>
        )}

        {estimate && (
          <div className="space-y-2 text-sm">
            <div><b>Days:</b> {estimate.estimated_days}</div>
            <div><b>Workers:</b> {estimate.workers_required}</div>
            <div><b>Material:</b> ₹{estimate.material_cost.toLocaleString()}</div>
            <div><b>Labor:</b> ₹{estimate.labor_cost.toLocaleString()}</div>
            <div><b>Total:</b> ₹{estimate.total_cost.toLocaleString()}</div>

            <Button
              onClick={generatePdfAndSave}
              disabled={saving}
              className="mt-3"
            >
              {saving ? "Generating..." : "Generate PDF & Save"}
            </Button>
          </div>
        )}
      </div>

      {/* AI Estimate Button */}
      <Button
        onClick={estimateWithAI}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Estimating..." : "Estimate with AI"}
      </Button>

      {/* Past Contracts */}
      <div className="border rounded-lg p-4 bg-white shadow">
        <h2 className="text-lg font-semibold mb-2">Past Contracts</h2>

        {pastContracts.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No contracts yet.
          </p>
        )}

        <div className="space-y-2">
          {pastContracts.map((c) => (
            <div
              key={c.id}
              className="border rounded p-2 flex justify-between items-center text-sm"
            >
              <div>
                <div className="font-medium">{c.project_name}</div>
                <div className="text-muted-foreground">
                  ₹{c.total_cost.toLocaleString()} •{" "}
                  {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>

              <a
                href={c.pdf_url}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                View PDF
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
