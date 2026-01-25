"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Loader } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { InvoiceData } from "@/types/invoice";
import { InvoiceFormWithInventory } from "./InvoiceFormWithInventory";

const demoInvoiceData: InvoiceData = {
  invoiceNo: "INV-2024-0012",
  invoiceDate: "15 Sep 2024",
  dueDate: "15 Oct 2024",

  company: {
    name: "Thakur Constructions Pvt. Ltd.",
    gstin: "27AAECT1234F1Z9",
    address: "2nd Floor, Skyline Plaza, Andheri East, Mumbai - 400069",
    phone: "+91 98765 43210",
  },

  client: {
    name: "Swayam Builders & Developers",
    gstin: "27AABCS7890Q1Z3",
    address: "Plot No. 18, Sector 7, Navi Mumbai - 400705",
    projectName: "Skyline Residency Tower A",
    siteAddress: "Sector 7, Nerul, Navi Mumbai",
  },

  items: [
    {
      description: "Excavation & Foundation Work",
      hsn: "9954",
      qty: 1,
      unit: "Job",
      rate: 450000,
      taxPercent: 18,
    },
    {
      description: "RCC Column & Slab Casting",
      hsn: "9954",
      qty: 120,
      unit: "Cum",
      rate: 5200,
      taxPercent: 18,
    },
    {
      description: "TMT Steel Supply (Fe500)",
      hsn: "7214",
      qty: 18,
      unit: "MT",
      rate: 64000,
      taxPercent: 18,
    },
    {
      description: "Labour Charges – Mason & Helper",
      hsn: "9985",
      qty: 45,
      unit: "Man-day",
      rate: 950,
      taxPercent: 18,
    },
  ],
};
const GST_BUCKET = "Invoices"; // 👈 change if needed

export function GSTInvoiceGenerator() {
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  const [pastInvoices, setPastInvoices] = useState<
    { name: string; createdAt: string }[]
  >([]);
  const [loadingPast, setLoadingPast] = useState(false);

  const [invoice, setInvoice] = useState<InvoiceData | null>(demoInvoiceData);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleGenerateFromForm = (data: InvoiceData) => {
    setInvoice(data);
    // Auto-generate after form submission
    setTimeout(() => {
      createPDF(data);
    }, 100);
  };

  async function createPDF(invoiceData?: InvoiceData) {
    const dataToUse = invoiceData || invoice;
    
    if (!dataToUse || !dataToUse.company.name || !dataToUse.client.name || dataToUse.items.length === 0) {
      alert("Please fill in all required fields and add at least one item");
      return;
    }

    setIsLoading(true);
    console.log("creating pdf");
    try {
      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToUse),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      // setInvoice();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setGeneratedPdfUrl(url);
      setInvoice(dataToUse);
      
      // Create a temporary download link
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${dataToUse.invoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("PDF downloaded successfully");
      
      // Refresh past invoices
      const supabase = createClient();
      const { data } = await supabase.storage.from(GST_BUCKET).list("", {
        limit: 50,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (data) {
        const formatted = data
          .filter((file) => file.name.toLowerCase().endsWith(".pdf"))
          .map((file) => ({
            name: file.name,
            createdAt: new Date(file.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          }));
        setPastInvoices(formatted);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  }

  useEffect(() => {
    const fetchPastInvoices = async () => {
      setLoadingPast(true);
      const supabase = createClient();

      const { data, error } = await supabase.storage.from(GST_BUCKET).list("", {
        limit: 50,
        sortBy: { column: "created_at", order: "desc" },
      });

      if (error) {
        console.error("Failed to fetch GST invoices:", error);
        setLoadingPast(false);
        return;
      }

      if (!data) {
        setPastInvoices([]);
        setLoadingPast(false);
        return;
      }

      const formatted = data
        .filter((file) => file.name.toLowerCase().endsWith(".pdf"))
        .map((file) => ({
          name: file.name,
          createdAt: new Date(file.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        }));

      setPastInvoices(formatted);
      setLoadingPast(false);
    };
    fetchPastInvoices();
  }, []);
  const viewGSTInvoice = async (fileName: string) => {
    const supabase = createClient();

    const { data } = supabase.storage.from(GST_BUCKET).getPublicUrl(fileName);

    setPreviewUrl(data.publicUrl);
    setIsPreviewOpen(true);
  };

  const downloadGSTInvoice = async (fileName: string) => {
    const supabase = createClient();

    const { data } = await supabase.storage
      .from(GST_BUCKET)
      .getPublicUrl(fileName);

    const link = document.createElement("a");
    link.href = data.publicUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <InvoiceFormWithInventory onGenerate={handleGenerateFromForm} />

      {invoice && invoice.items.length > 0 && (
        <Card className="p-8 transition-all duration-500 hover:shadow-xl animate-slide-in-up bg-white">
          {/* Invoice Header */}
          <div className="border-b-2 border-border pb-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  TAX INVOICE
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  GST Compliant Invoice
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">Invoice #</p>
                <p className="text-lg font-bold text-primary">
                  {invoice.invoiceNo}
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Invoice Date
              </p>
              <p className="text-sm font-medium text-foreground">
                {invoice.invoiceDate}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Due Date
              </p>
              <p className="text-sm font-medium text-foreground">
                {invoice.dueDate}
              </p>
            </div>
          </div>

          {/* Bill From / Bill To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Bill From */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Bill From
              </p>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="font-semibold text-foreground">
                  {invoice.company.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {invoice.company.address}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  GSTIN: {invoice.company.gstin}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Phone: {invoice.company.phone}
                </p>
              </div>
            </div>

            {/* Bill To */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Bill To
              </p>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="font-semibold text-foreground">
                  {invoice.client.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {invoice.client.address}
                </p>
                {invoice.client.gstin && (
                  <p className="text-xs text-muted-foreground mt-2">
                    GSTIN: {invoice.client.gstin}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Project: {invoice.client.projectName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Site: {invoice.client.siteAddress}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                    Description
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                    HSN
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">
                    Qty
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                    Unit
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">
                    Rate
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">
                    GST %
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">
                    GST Amt
                  </th>
                </tr>
              </thead>

              <tbody>
                {invoice.items.map((item, index) => {
                  const amount = item.qty * item.rate;
                  const gstAmount = (amount * item.taxPercent) / 100;

                  return (
                    <tr
                      key={index}
                      className="border-b border-border hover:bg-muted/20"
                    >
                      <td className="py-3 px-2 text-foreground">
                        {item.description}
                      </td>
                      <td className="py-3 px-2 text-foreground">{item.hsn}</td>
                      <td className="py-3 px-2 text-right text-foreground">
                        {item.qty}
                      </td>
                      <td className="py-3 px-2 text-foreground">{item.unit}</td>
                      <td className="py-3 px-2 text-right text-foreground">
                        ₹ {item.rate.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right text-foreground">
                        ₹ {amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right text-foreground">
                        {item.taxPercent}%
                      </td>
                      <td className="py-3 px-2 text-right text-foreground">
                        ₹ {gstAmount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown */}
          {(() => {
            const subtotal = invoice.items.reduce(
              (sum, item) => sum + item.qty * item.rate,
              0,
            );
            const totalGST = invoice.items.reduce((sum, item) => {
              const amount = item.qty * item.rate;
              return sum + (amount * item.taxPercent) / 100;
            }, 0);
            const totalAmount = subtotal + totalGST;

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Subtotal
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹ {subtotal.toLocaleString()}
                  </p>
                </div>

                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Total GST
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    ₹ {totalGST.toLocaleString()}
                  </p>
                </div>

                <div className="bg-primary p-4 rounded-lg">
                  <p className="text-xs font-semibold text-primary-foreground uppercase mb-1">
                    Total Amount
                  </p>
                  <p className="text-2xl font-bold text-primary-foreground">
                    ₹ {totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Footer */}
          <div className="border-t pt-4 mt-8">
            <p className="text-[11px] text-muted-foreground">
              This is a computer-generated invoice. Signature is not required.
              Please retain a copy of this invoice for your records.
            </p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadGSTInvoice(generatedPdfUrl!)}
            >
              Download
            </Button>
          </div>
        </Card>
      )}
      <Card className="p-6 transition-all duration-500 hover:shadow-xl">
        {/* ===== Summary Section ===== */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-sm text-muted-foreground">Total GST Invoices</p>
            <p className="text-3xl font-bold text-foreground mt-1">
              {pastInvoices.length}
            </p>
          </div>

          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* ===== Past Invoices Header ===== */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Past GST Invoices
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {pastInvoices.length} invoice
              {pastInvoices.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Empty State */}
        {pastInvoices.length === 0 && !loadingPast && (
          <p className="text-sm text-muted-foreground">
            No past invoices loaded.
          </p>
        )}

        {/* ===== Invoice List ===== */}
        <div className="space-y-2">
          {pastInvoices.map((invoice) => (
            <div
              key={invoice.name}
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/20"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {invoice.name.replace(".pdf", "")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Generated on {invoice.createdAt}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewGSTInvoice(invoice.name)}
                >
                  View
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadGSTInvoice(invoice.name)}
                >
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-4">
          <DialogHeader>
            <DialogTitle>GST Invoice Preview</DialogTitle>
          </DialogHeader>

          {previewUrl ? (
            <iframe
              src={previewUrl}
              title="GST Invoice PDF"
              className="w-full h-[75vh] rounded-md border"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Loading PDF preview...
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
