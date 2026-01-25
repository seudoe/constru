"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface CompanyDetails {
  name: string | null;
  gstin: string | null;
  address: string | null;
  phone: string | null;
}

export function CompanyDetailsForm() {
  const [company, setCompany] = useState<CompanyDetails>({
    name: null,
    gstin: null,
    address: null,
    phone: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  async function fetchCompanyDetails() {
    try {
      setLoading(true);
      const supabase = createClient();
      const singletonId = "00000000-0000-0000-0000-000000000001";
      const { data, error } = await supabase
        .from("company")
        .select("*")
        .eq("id", singletonId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is fine for first time
        console.error("Error fetching company details:", error);
      }

      if (data) {
        setCompany({
          name: data.name || null,
          gstin: data.gstin || null,
          address: data.address || null,
          phone: data.phone || null,
        });
      }
    } catch (error) {
      console.error("Error fetching company details:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage(null);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to save company details");
      }

      const singletonId = "00000000-0000-0000-0000-000000000001";

      // Upsert company details using singleton ID
      const { error } = await supabase
        .from("company")
        .upsert({
          id: singletonId,
          name: company.name || null,
          gstin: company.gstin || null,
          address: company.address || null,
          phone: company.phone || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "id"
        });

      if (error) {
        throw error;
      }

      setMessage({ type: "success", text: "Company details saved successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving company details:", error);
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to save company details" 
      });
    } finally {
      setSaving(false);
    }
  }

  function checkIncompleteFields(): string[] {
    const incomplete: string[] = [];
    if (!company.name || company.name.trim() === "") incomplete.push("Company Name");
    if (!company.gstin || company.gstin.trim() === "") incomplete.push("GSTIN");
    if (!company.address || company.address.trim() === "") incomplete.push("Address");
    if (!company.phone || company.phone.trim() === "") incomplete.push("Phone");
    return incomplete;
  }

  const incompleteFields = checkIncompleteFields();
  const hasIncompleteFields = incompleteFields.length > 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Company Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasIncompleteFields && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                All details of company aren't filled yet
              </p>
              <p className="text-xs text-red-600 mt-1">
                Missing fields: {incompleteFields.join(", ")}
              </p>
            </div>
          </div>
        )}

        {message && (
          <div className={`rounded-lg p-4 flex items-center gap-3 ${
            message.type === "success" 
              ? "bg-green-50 border border-green-200" 
              : "bg-red-50 border border-red-200"
          }`}>
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p className={`text-sm ${
              message.type === "success" ? "text-green-800" : "text-red-800"
            }`}>
              {message.text}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={company.name || ""}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              placeholder="Enter company name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="companyGSTIN">GSTIN</Label>
            <Input
              id="companyGSTIN"
              value={company.gstin || ""}
              onChange={(e) => setCompany({ ...company, gstin: e.target.value })}
              placeholder="Enter GSTIN"
              className="mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="companyAddress">Company Address</Label>
            <Input
              id="companyAddress"
              value={company.address || ""}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
              placeholder="Enter company address"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="companyPhone">Company Phone</Label>
            <Input
              id="companyPhone"
              value={company.phone || ""}
              onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              placeholder="Enter phone number"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Details"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}