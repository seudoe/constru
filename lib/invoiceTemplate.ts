import { InvoiceData } from "../types/invoice";

export function generateInvoiceHTML(data: InvoiceData, gstInfo: any) {
  let subtotal = 0;
  let totalTax = 0;

  const rows = data.items
    .map((item, i ) => {
      const amount = item.qty * item.rate;
      const tax = (amount * item.taxPercent) / 100;
      subtotal += amount;
      totalTax += tax;

      return `
      <tr>
        <td style="text-align: center;">${i + 1}</td>
        <td>${item.description}</td>
        <td style="text-align: center;">${item.hsn}</td>
        <td style="text-align: center;">${item.qty} ${item.unit}</td>
        <td style="text-align: right;">₹${item.rate.toLocaleString()}</td>
        <td style="text-align: center;">${item.taxPercent}%</td>
        <td style="text-align: right;">₹${amount.toLocaleString()}</td>
      </tr>
    `;
    })
    .join("");

  const total = subtotal + totalTax;

  return `
<!DOCTYPE html>
<html>
<head>
<style>
  body { 
    font-family: Arial, sans-serif; 
    padding: 40px; 
    margin: 0;
    background: white;
  }
  h1 { 
    text-align: center; 
    color: #333;
    margin-bottom: 30px;
    font-size: 28px;
  }
  table { 
    width: 100%; 
    border-collapse: collapse; 
    margin: 20px 0;
  }
  th, td { 
    border: 1px solid #333; 
    padding: 12px 8px; 
    font-size: 12px; 
  }
  th {
    background-color: #f5f5f5;
    font-weight: bold;
    text-align: center;
  }
  .header { 
    display: flex; 
    justify-content: space-between; 
    margin-bottom: 20px;
  }
  .header > div {
    flex: 1;
  }
  .header > div:last-child {
    text-align: right;
  }
  .box { 
    border: 1px solid #333; 
    padding: 15px; 
    margin: 20px 0;
    background-color: #fafafa;
  }
  .totals-table {
    width: 300px;
    margin-left: auto;
    margin-top: 20px;
  }
  .totals-table td {
    padding: 8px 12px;
  }
  .totals-table .total-row {
    font-weight: bold;
    background-color: #f0f0f0;
  }
  .company-name {
    font-size: 18px;
    font-weight: bold;
    color: #2563eb;
  }
  .invoice-info {
    font-size: 14px;
    line-height: 1.6;
  }
</style>
</head>
<body>

<h1>TAX INVOICE</h1>

<div class="header">
  <div>
    <div class="company-name">${data.company.name}</div>
    <div style="margin-top: 10px; line-height: 1.5;">
      ${data.company.address}<br>
      <strong>GSTIN:</strong> ${data.company.gstin}<br>
      <strong>Phone:</strong> ${data.company.phone}
    </div>
  </div>
  <div class="invoice-info">
    <strong>Invoice No:</strong> ${data.invoiceNo}<br>
    <strong>Date:</strong> ${data.invoiceDate}<br>
    <strong>Due Date:</strong> ${data.dueDate}
  </div>
</div>

<div class="box">
  <strong style="font-size: 14px;">Bill To:</strong><br><br>
  <strong>${data.client.name}</strong><br>
  ${data.client.address}<br>
  <strong>GSTIN:</strong> ${data.client.gstin || "N/A"}<br><br>

  <strong>Project:</strong> ${data.client.projectName}<br>
  <strong>Site:</strong> ${data.client.siteAddress}
</div>

<table>
  <thead>
    <tr>
      <th style="width: 40px;">#</th>
      <th style="width: 300px;">Description</th>
      <th style="width: 80px;">HSN</th>
      <th style="width: 100px;">Qty</th>
      <th style="width: 100px;">Rate</th>
      <th style="width: 60px;">Tax</th>
      <th style="width: 120px;">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>

<table class="totals-table">
  <tr>
    <td><strong>Subtotal:</strong></td>
    <td style="text-align: right;"><strong>₹${subtotal.toLocaleString()}</strong></td>
  </tr>
  <tr>
    <td><strong>Total Tax:</strong></td>
    <td style="text-align: right;"><strong>₹${totalTax.toLocaleString()}</strong></td>
  </tr>
  <tr class="total-row">
    <td><strong>Grand Total:</strong></td>
    <td style="text-align: right;"><strong>₹${total.toLocaleString()}</strong></td>
  </tr>
</table>

<div class="box">
  <strong>GST Registered Name:</strong> ${gstInfo.legalName || "Verified Business Entity"}<br>
  <strong>GST Status:</strong> ${gstInfo.status || "Active"}
</div>

<div style="margin-top: 40px;">
  <strong>Authorized Signature:</strong><br><br>
  <div style="border-bottom: 1px solid #333; width: 300px; margin-top: 30px;"></div>
</div>

</body>
</html>
`;
}
