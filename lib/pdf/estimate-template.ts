/**
 * PDF estimate template using HTML/CSS approach
 * P2.5: PDF Export Backend (EST-P2-005)
 *
 * NOTE: This implementation uses a simple HTML-to-PDF approach.
 * For production, consider using @react-pdf/renderer or puppeteer.
 */

interface EstimateData {
  estimate: {
    id: string;
    name: string;
    description?: string;
    overhead_pct: number;
    markup_pct: number;
    created_at: string;
    estimate_line_items: Array<{
      trade: string;
      category: string;
      description: string;
      quantity: number;
      unit: string;
      unit_cost: number;
    }>;
  };
  company: {
    id: string;
    name: string;
    logo_url?: string;
  };
  project: {
    id: string;
    name: string;
  };
  user: {
    name: string;
    email: string;
  };
}

export async function generateEstimatePDF(data: EstimateData): Promise<Buffer> {
  const { estimate, company, project, user } = data;

  // Group line items by trade
  const tradeGroups = new Map<string, typeof estimate.estimate_line_items>();
  for (const item of estimate.estimate_line_items) {
    if (!tradeGroups.has(item.trade)) {
      tradeGroups.set(item.trade, []);
    }
    tradeGroups.get(item.trade)!.push(item);
  }

  // Calculate totals
  const subtotal = estimate.estimate_line_items.reduce(
    (sum, item) => sum + item.quantity * item.unit_cost,
    0,
  );
  const overheadAmount = subtotal * (estimate.overhead_pct / 100);
  const markupAmount =
    (subtotal + overheadAmount) * (estimate.markup_pct / 100);
  const grandTotal = subtotal + overheadAmount + markupAmount;

  // Generate HTML for PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px solid #001B51;
    }
    .logo {
      max-width: 150px;
      max-height: 60px;
    }
    .header-info {
      text-align: right;
    }
    .header-info h1 {
      margin: 0;
      font-size: 24pt;
      color: #001B51;
    }
    .header-info p {
      margin: 5px 0;
      color: #666;
    }
    .section {
      margin-bottom: 20px;
    }
    .section h2 {
      font-size: 14pt;
      color: #001B51;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
    }
    .info-item {
      padding: 5px 0;
    }
    .info-label {
      font-weight: bold;
      color: #001B51;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background-color: #001B51;
      color: white;
      text-align: left;
      padding: 8px;
      font-weight: bold;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    .trade-header {
      background-color: #f5f5f5;
      font-weight: bold;
      color: #001B51;
    }
    .subtotal-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    .total-row {
      font-weight: bold;
      background-color: #001B51;
      color: white;
    }
    .text-right {
      text-align: right;
    }
    .footer {
      position: fixed;
      bottom: 0.5in;
      left: 0.75in;
      right: 0.75in;
      text-align: center;
      font-size: 8pt;
      color: #999;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72pt;
      color: rgba(0, 27, 81, 0.15);
      z-index: -1;
      font-weight: bold;
    }
    .page-number:after {
      content: counter(page);
    }
  </style>
</head>
<body>
  <div class="watermark">CONFIDENTIAL</div>

  <!-- Cover Page -->
  <div class="header">
    <div>
      ${company.logo_url ? `<img src="${company.logo_url}" class="logo" alt="${company.name}">` : `<h2>${company.name}</h2>`}
    </div>
    <div class="header-info">
      <h1>Cost Estimate</h1>
      <p>${new Date(estimate.created_at).toLocaleDateString()}</p>
      <p>Prepared by: ${user.name}</p>
    </div>
  </div>

  <!-- Project Information -->
  <div class="section">
    <h2>Project Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Project:</span> ${project.name}
      </div>
      <div class="info-item">
        <span class="info-label">Estimate:</span> ${estimate.name}
      </div>
      <div class="info-item">
        <span class="info-label">Company:</span> ${company.name}
      </div>
      <div class="info-item">
        <span class="info-label">Estimator:</span> ${user.name}
      </div>
    </div>
    ${estimate.description ? `<p><span class="info-label">Description:</span> ${estimate.description}</p>` : ""}
  </div>

  <!-- Executive Summary -->
  <div class="section">
    <h2>Executive Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Subtotal (Materials & Labor)</td>
          <td class="text-right">$${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td>Overhead (${estimate.overhead_pct}%)</td>
          <td class="text-right">$${overheadAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td>Markup (${estimate.markup_pct}%)</td>
          <td class="text-right">$${markupAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr class="total-row">
          <td>Grand Total</td>
          <td class="text-right">$${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Trade-by-Trade Detail -->
  <div class="section">
    <h2>Detailed Line Items</h2>
    <table>
      <thead>
        <tr>
          <th>Trade</th>
          <th>Description</th>
          <th class="text-right">Quantity</th>
          <th>Unit</th>
          <th class="text-right">Unit Cost</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${Array.from(tradeGroups.entries())
          .map(([trade, items]) => {
            const tradeTotal = items.reduce(
              (sum, item) => sum + item.quantity * item.unit_cost,
              0,
            );
            return `
              <tr class="trade-header">
                <td colspan="6">${trade.toUpperCase()}</td>
              </tr>
              ${items
                .map(
                  (item) => `
                  <tr>
                    <td></td>
                    <td>${item.description || item.category}</td>
                    <td class="text-right">${item.quantity.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td>${item.unit}</td>
                    <td class="text-right">$${item.unit_cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td class="text-right">$${(item.quantity * item.unit_cost).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  </tr>
                `,
                )
                .join("")}
              <tr class="subtotal-row">
                <td colspan="5" class="text-right">${trade} Subtotal:</td>
                <td class="text-right">$${tradeTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>${company.name} | Confidential Estimate | Page <span class="page-number"></span></p>
  </div>
</body>
</html>
  `;

  // For now, return HTML as a simple buffer
  // In production, use puppeteer or @react-pdf/renderer to convert HTML to actual PDF
  // Example with puppeteer:
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // await page.setContent(html);
  // const pdfBuffer = await page.pdf({ format: 'letter', printBackground: true });
  // await browser.close();
  // return pdfBuffer;

  // Placeholder: return HTML as buffer (frontend will need to handle conversion)
  return Buffer.from(html, "utf-8");
}
