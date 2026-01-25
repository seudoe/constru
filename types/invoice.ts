export interface InvoiceItem {
  description: string
  hsn: string
  qty: number
  unit: string
  rate: number
  taxPercent: number
}

export interface InvoiceData {
  invoiceNo: string
  invoiceDate: string
  dueDate: string

  company: {
    name: string
    gstin: string
    address: string
    phone: string
  }

  client: {
    name: string
    gstin?: string
    address: string
    projectName: string
    siteAddress: string
  }

  items: InvoiceItem[]
}