"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Package, FileText } from "lucide-react";
import { InvoiceData, InvoiceItem } from "@/types/invoice";

interface InventoryItem {
  id: string;
  item_name: string;
  item_id: string;
  quantity: number;
  zone: string;
}

export function InvoiceFormWithInventory({
  onGenerate,
}: {
  onGenerate: (data: InvoiceData) => void;
}) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const formatDateForInvoice = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNo: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    invoiceDate: formatDateForInvoice(new Date()),
    dueDate: formatDateForInvoice(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    company: {
      name: "",
      gstin: "",
      address: "",
      phone: "",
    },
    client: {
      name: "",
      gstin: "",
      address: "",
      projectName: "",
      siteAddress: "",
    },
    items: [],
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    const supabase = createClient();
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .order("item_name", { ascending: true });

    if (data) {
      setInventory(data);
    }
    setLoading(false);
  }

  function addItemFromInventory(item: InventoryItem) {
    const newItem: InvoiceItem = {
      description: item.item_name,
      hsn: "9954", // Default HSN for construction services
      qty: 1,
      unit: "Unit",
      rate: 0, // User needs to input
      taxPercent: 18, // Default GST
    };

    setInvoice({
      ...invoice,
      items: [...invoice.items, newItem],
    });
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: any) {
    const updatedItems = [...invoice.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setInvoice({ ...invoice, items: updatedItems });
  }

  function removeItem(index: number) {
    setInvoice({
      ...invoice,
      items: invoice.items.filter((_, i) => i !== index),
    });
  }

  function addManualItem() {
    const newItem: InvoiceItem = {
      description: "",
      hsn: "9954",
      qty: 1,
      unit: "Unit",
      rate: 0,
      taxPercent: 18,
    };
    setInvoice({ ...invoice, items: [...invoice.items, newItem] });
  }

  const glassyInputStr = "w-full rounded-xl border-gray-200 bg-white/50 dark:bg-black/20 focus:bg-white transition-all p-3.5 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none shadow-sm font-medium";
  const glassyLabelStr = "text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1.5 block";

  return (
    <div className="animate-slide-up space-y-8">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-amber-600 rounded-2xl opacity-20 group-hover:opacity-30 transition duration-500 blur-lg"></div>
        <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/30 flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invoice Details</h2>
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Generate New Invoice</p>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Invoice Number & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="invoiceNo" className={glassyLabelStr}>Invoice Number *</label>
                <input
                  id="invoiceNo"
                  value={invoice.invoiceNo}
                  onChange={(e) =>
                    setInvoice({ ...invoice, invoiceNo: e.target.value })
                  }
                  required
                  className={glassyInputStr}
                />
              </div>
              <div>
                <label htmlFor="invoiceDate" className={glassyLabelStr}>Invoice Date *</label>
                <input
                  id="invoiceDate"
                  type="date"
                  value={
                    invoice.invoiceDate
                      ? new Date(invoice.invoiceDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      invoiceDate: formatDateForInvoice(new Date(e.target.value)),
                    })
                  }
                  required
                  className={glassyInputStr}
                />
              </div>
              <div>
                <label htmlFor="dueDate" className={glassyLabelStr}>Due Date *</label>
                <input
                  id="dueDate"
                  type="date"
                  value={
                    invoice.dueDate
                      ? new Date(invoice.dueDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      dueDate: formatDateForInvoice(new Date(e.target.value)),
                    })
                  }
                  required
                  className={glassyInputStr}
                />
              </div>
            </div>

            {/* Company Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Company Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="companyName" className={glassyLabelStr}>Company Name *</label>
                  <input
                    id="companyName"
                    value={invoice.company.name}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        company: { ...invoice.company, name: e.target.value },
                      })
                    }
                    required
                    className={glassyInputStr}
                  />
                </div>
                <div>
                  <label htmlFor="companyGSTIN" className={glassyLabelStr}>Company GSTIN *</label>
                  <input
                    id="companyGSTIN"
                    value={invoice.company.gstin}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        company: { ...invoice.company, gstin: e.target.value },
                      })
                    }
                    required
                    className={glassyInputStr}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="companyAddress" className={glassyLabelStr}>Company Address *</label>
                  <input
                    id="companyAddress"
                    value={invoice.company.address}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        company: { ...invoice.company, address: e.target.value },
                      })
                    }
                    required
                    className={glassyInputStr}
                  />
                </div>
                <div>
                  <label htmlFor="companyPhone" className={glassyLabelStr}>Company Phone *</label>
                  <input
                    id="companyPhone"
                    value={invoice.company.phone}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        company: { ...invoice.company, phone: e.target.value },
                      })
                    }
                    required
                    className={glassyInputStr}
                  />
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Client Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="clientName" className={glassyLabelStr}>Client Name *</label>
                  <input
                    id="clientName"
                    value={invoice.client.name}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        client: { ...invoice.client, name: e.target.value },
                      })
                    }
                    required
                    className={glassyInputStr}
                  />
                </div>
                <div>
                  <label htmlFor="clientGSTIN" className={glassyLabelStr}>Client GSTIN (Optional)</label>
                  <input
                    id="clientGSTIN"
                    value={invoice.client.gstin || ""}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        client: { ...invoice.client, gstin: e.target.value },
                      })
                    }
                    className={glassyInputStr}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="clientAddress" className={glassyLabelStr}>Client Address *</label>
                  <input
                    id="clientAddress"
                    value={invoice.client.address}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        client: { ...invoice.client, address: e.target.value },
                      })
                    }
                    required
                    className={glassyInputStr}
                  />
                </div>
                <div>
                  <label htmlFor="projectName" className={glassyLabelStr}>Project Name *</label>
                  <input
                    id="projectName"
                    value={invoice.client.projectName}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        client: { ...invoice.client, projectName: e.target.value },
                      })
                    }
                    required
                    className={glassyInputStr}
                  />
                </div>
                <div>
                  <label htmlFor="siteAddress" className={glassyLabelStr}>Site Address *</label>
                  <input
                    id="siteAddress"
                    value={invoice.client.siteAddress}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        client: { ...invoice.client, siteAddress: e.target.value },
                      })
                    }
                    required
                    className={glassyInputStr}
                  />
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Invoice Items</h3>
                <div className="flex gap-2 flex-wrap">
                  {!loading && inventory.length > 0 && (
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            const selectedItem = inventory.find(i => i.id === e.target.value);
                            if (selectedItem) addItemFromInventory(selectedItem);
                            e.target.value = ""; // Reset
                          }
                        }}
                        className={`${glassyInputStr} pr-8`}
                        defaultValue=""
                      >
                        <option value="">Select from Inventory...</option>
                        {inventory.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.item_name} (Qty: {item.quantity}, Zone: {item.zone})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    onClick={addManualItem}
                    type="button"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold hover:bg-orange-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Manual Item
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {invoice.items.map((item, index) => (
                  <div
                    key={index}
                    className="p-5 border border-gray-100 dark:border-white/5 rounded-xl bg-gray-50/50 dark:bg-zinc-800/30 space-y-4 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        Item Details
                      </span>
                      <button
                        onClick={() => removeItem(index)}
                        type="button"
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Description *</label>
                        <input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(index, "description", e.target.value)
                          }
                          placeholder="Item description"
                          className={`${glassyInputStr} py-2.5 text-sm`}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">HSN *</label>
                        <input
                          value={item.hsn}
                          onChange={(e) => updateItem(index, "hsn", e.target.value)}
                          placeholder="HSN Code"
                          className={`${glassyInputStr} py-2.5 text-sm`}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Qty *</label>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) =>
                            updateItem(index, "qty", parseFloat(e.target.value) || 0)
                          }
                          className={`${glassyInputStr} py-2.5 text-sm`}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Unit *</label>
                        <input
                          value={item.unit}
                          onChange={(e) => updateItem(index, "unit", e.target.value)}
                          placeholder="Unit"
                          className={`${glassyInputStr} py-2.5 text-sm`}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Rate *</label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "rate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={`${glassyInputStr} py-2.5 text-sm`}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">GST % *</label>
                        <input
                          type="number"
                          value={item.taxPercent}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "taxPercent",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={`${glassyInputStr} py-2.5 text-sm`}
                          required
                        />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 text-right bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                      Amount: ₹
                      {(item.qty * item.rate).toLocaleString()} | GST: ₹
                      {((item.qty * item.rate * item.taxPercent) / 100).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {invoice.items.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50/50 dark:bg-zinc-900/30">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">
                    No items added yet.
                  </p>
                  <p className="text-xs text-gray-400">Add items from inventory or manually above.</p>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="pt-4">
              <button
                onClick={() => {
                  // Validate before generating
                  if (!invoice.company.name || !invoice.company.gstin || !invoice.company.address || !invoice.company.phone) {
                    alert("Please fill in all company details");
                    return;
                  }
                  if (!invoice.client.name || !invoice.client.address || !invoice.client.projectName || !invoice.client.siteAddress) {
                    alert("Please fill in all client details");
                    return;
                  }
                  if (invoice.items.length === 0) {
                    alert("Please add at least one item");
                    return;
                  }
                  if (invoice.items.some(item => !item.description || !item.hsn || item.qty <= 0 || item.rate <= 0)) {
                    alert("Please fill in all item details correctly");
                    return;
                  }
                  onGenerate(invoice);
                }}
                disabled={
                  !invoice.company.name ||
                  !invoice.client.name ||
                  invoice.items.length === 0
                }
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Generate Invoice PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
