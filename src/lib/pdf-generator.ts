import jsPDF from 'jspdf';
import { Invoice, Client, CompanySettings } from '@/types';
import { format } from 'date-fns';

export interface PDFGenerationOptions {
  invoice: Invoice;
  client: Client;
  companySettings: CompanySettings;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  async generateInvoicePDF(options: PDFGenerationOptions): Promise<Uint8Array> {
    const { invoice, client, companySettings } = options;

    // Reset document
    this.doc = new jsPDF();
    
    // Add company header
    this.addCompanyHeader(companySettings);
    
    // Add invoice details
    this.addInvoiceDetails(invoice);
    
    // Add client information
    this.addClientInformation(client);
    
    // Add line items table
    this.addLineItemsTable(invoice);
    
    // Add totals
    this.addTotals(invoice);
    
    // Add notes if present
    if (invoice.notes) {
      this.addNotes(invoice.notes);
    }
    
    // Add footer
    this.addFooter(companySettings);

    return new Uint8Array(this.doc.output('arraybuffer') as ArrayBuffer);
  }

  private addCompanyHeader(companySettings: CompanySettings): void {
    let yPosition = this.margin;

    // Company name
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(companySettings.name, this.margin, yPosition);
    yPosition += 10;

    // Company details
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    if (companySettings.address.street) {
      this.doc.text(companySettings.address.street, this.margin, yPosition);
      yPosition += 5;
    }
    
    const cityStateZip = [
      companySettings.address.city,
      companySettings.address.state,
      companySettings.address.zipCode
    ].filter(Boolean).join(', ');
    
    if (cityStateZip) {
      this.doc.text(cityStateZip, this.margin, yPosition);
      yPosition += 5;
    }
    
    if (companySettings.address.country) {
      this.doc.text(companySettings.address.country, this.margin, yPosition);
      yPosition += 5;
    }
    
    if (companySettings.email) {
      this.doc.text(`Email: ${companySettings.email}`, this.margin, yPosition);
      yPosition += 5;
    }
    
    if (companySettings.phone) {
      this.doc.text(`Phone: ${companySettings.phone}`, this.margin, yPosition);
    }
  }

  private addInvoiceDetails(invoice: Invoice): void {
    const rightMargin = this.pageWidth - this.margin;
    let yPosition = this.margin;

    // Invoice title
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('INVOICE', rightMargin, yPosition, { align: 'right' });
    yPosition += 15;

    // Invoice details
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Invoice #: ${invoice.invoiceNumber}`, rightMargin, yPosition, { align: 'right' });
    yPosition += 5;
    
    this.doc.text(`Issue Date: ${format(invoice.issueDate, 'MMM dd, yyyy')}`, rightMargin, yPosition, { align: 'right' });
    yPosition += 5;
    
    this.doc.text(`Due Date: ${format(invoice.dueDate, 'MMM dd, yyyy')}`, rightMargin, yPosition, { align: 'right' });
    yPosition += 5;
    
    // Status badge
    const statusColor = this.getStatusColor(invoice.status);
    this.doc.setFillColor(statusColor.r, statusColor.g, statusColor.b);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    
    const statusText = invoice.status.toUpperCase();
    const statusWidth = this.doc.getTextWidth(statusText) + 6;
    const statusX = rightMargin - statusWidth;
    
    this.doc.rect(statusX, yPosition - 3, statusWidth, 8, 'F');
    this.doc.text(statusText, rightMargin - 3, yPosition + 1, { align: 'right' });
    
    // Reset text color
    this.doc.setTextColor(0, 0, 0);
  }

  private addClientInformation(client: Client): void {
    let yPosition = 80;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Bill To:', this.margin, yPosition);
    yPosition += 8;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(client.name, this.margin, yPosition);
    yPosition += 5;
    
    if (client.address.street) {
      this.doc.text(client.address.street, this.margin, yPosition);
      yPosition += 5;
    }
    
    const cityStateZip = [
      client.address.city,
      client.address.state,
      client.address.zipCode
    ].filter(Boolean).join(', ');
    
    if (cityStateZip) {
      this.doc.text(cityStateZip, this.margin, yPosition);
      yPosition += 5;
    }
    
    if (client.address.country) {
      this.doc.text(client.address.country, this.margin, yPosition);
      yPosition += 5;
    }
    
    if (client.email) {
      this.doc.text(client.email, this.margin, yPosition);
      yPosition += 5;
    }
    
    if (client.phone) {
      this.doc.text(client.phone, this.margin, yPosition);
    }
  }

  private addLineItemsTable(invoice: Invoice): void {
    let yPosition = 140;
    const tableWidth = this.pageWidth - (2 * this.margin);
    const colWidths = {
      description: tableWidth * 0.5,
      quantity: tableWidth * 0.15,
      rate: tableWidth * 0.175,
      amount: tableWidth * 0.175
    };

    // Table header
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, yPosition - 5, tableWidth, 10, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    
    let xPosition = this.margin + 2;
    this.doc.text('Description', xPosition, yPosition);
    
    xPosition += colWidths.description;
    this.doc.text('Qty', xPosition, yPosition, { align: 'center' });
    
    xPosition += colWidths.quantity;
    this.doc.text('Rate', xPosition, yPosition, { align: 'right' });
    
    xPosition += colWidths.rate;
    this.doc.text('Amount', xPosition, yPosition, { align: 'right' });
    
    yPosition += 10;

    // Table rows
    this.doc.setFont('helvetica', 'normal');
    
    invoice.lineItems.forEach((item, index) => {
      if (yPosition > this.pageHeight - 50) {
        this.doc.addPage();
        yPosition = this.margin;
      }

      // Alternate row background
      if (index % 2 === 1) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(this.margin, yPosition - 5, tableWidth, 10, 'F');
      }

      xPosition = this.margin + 2;
      this.doc.text(item.description, xPosition, yPosition);
      
      xPosition += colWidths.description;
      this.doc.text(item.quantity.toString(), xPosition, yPosition, { align: 'center' });
      
      xPosition += colWidths.quantity;
      this.doc.text(`$${item.rate.toFixed(2)}`, xPosition, yPosition, { align: 'right' });
      
      xPosition += colWidths.rate;
      this.doc.text(`$${item.amount.toFixed(2)}`, xPosition, yPosition, { align: 'right' });
      
      yPosition += 10;
    });

    // Table border
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(this.margin, 135, tableWidth, yPosition - 135);
  }

  private addTotals(invoice: Invoice): void {
    const rightMargin = this.pageWidth - this.margin;
    let yPosition = this.pageHeight - 80;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    // Subtotal
    this.doc.text('Subtotal:', rightMargin - 60, yPosition, { align: 'right' });
    this.doc.text(`$${invoice.subtotal.toFixed(2)}`, rightMargin, yPosition, { align: 'right' });
    yPosition += 8;

    // Tax
    if (invoice.taxRate > 0) {
      this.doc.text(`Tax (${invoice.taxRate}%):`, rightMargin - 60, yPosition, { align: 'right' });
      this.doc.text(`$${invoice.taxAmount.toFixed(2)}`, rightMargin, yPosition, { align: 'right' });
      yPosition += 8;
    }

    // Total
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('Total:', rightMargin - 60, yPosition, { align: 'right' });
    this.doc.text(`$${invoice.total.toFixed(2)}`, rightMargin, yPosition, { align: 'right' });
    yPosition += 10;

    // Payment status
    if (invoice.paidAmount > 0) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      this.doc.text('Paid:', rightMargin - 60, yPosition, { align: 'right' });
      this.doc.text(`$${invoice.paidAmount.toFixed(2)}`, rightMargin, yPosition, { align: 'right' });
      yPosition += 8;

      if (invoice.balance > 0) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Balance Due:', rightMargin - 60, yPosition, { align: 'right' });
        this.doc.text(`$${invoice.balance.toFixed(2)}`, rightMargin, yPosition, { align: 'right' });
      }
    }
  }

  private addNotes(notes: string): void {
    const yPosition = this.pageHeight - 40;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Notes:', this.margin, yPosition);

    this.doc.setFont('helvetica', 'normal');
    const splitNotes = this.doc.splitTextToSize(notes, this.pageWidth - (2 * this.margin));
    this.doc.text(splitNotes, this.margin, yPosition + 8);
  }

  private addFooter(companySettings: CompanySettings): void {
    const yPosition = this.pageHeight - 15;
    const centerX = this.pageWidth / 2;

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(128, 128, 128);

    const footerText = `Payment Terms: Net ${companySettings.paymentTerms} days`;
    this.doc.text(footerText, centerX, yPosition, { align: 'center' });
  }

  private getStatusColor(status: string): { r: number; g: number; b: number } {
    switch (status) {
      case 'paid':
        return { r: 34, g: 197, b: 94 }; // Green
      case 'sent':
        return { r: 59, g: 130, b: 246 }; // Blue
      case 'overdue':
        return { r: 239, g: 68, b: 68 }; // Red
      case 'cancelled':
        return { r: 107, g: 114, b: 128 }; // Gray
      default: // draft
        return { r: 245, g: 158, b: 11 }; // Yellow
    }
  }

  async generatePreviewHTML(options: PDFGenerationOptions): Promise<string> {
    const { invoice, client, companySettings } = options;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          .company-info h1 {
            margin: 0 0 10px 0;
            color: #333;
          }
          .company-info p {
            margin: 2px 0;
            color: #666;
          }
          .invoice-details {
            text-align: right;
          }
          .invoice-details h2 {
            margin: 0 0 15px 0;
            color: #333;
          }
          .invoice-details p {
            margin: 2px 0;
            color: #666;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
          }
          .status-paid { background-color: #22c55e; }
          .status-sent { background-color: #3b82f6; }
          .status-overdue { background-color: #ef4444; }
          .status-cancelled { background-color: #6b7280; }
          .status-draft { background-color: #f59e0b; }
          .bill-to {
            margin: 40px 0;
          }
          .bill-to h3 {
            margin: 0 0 10px 0;
            color: #333;
          }
          .bill-to p {
            margin: 2px 0;
            color: #666;
          }
          .line-items {
            margin: 40px 0;
          }
          .line-items table {
            width: 100%;
            border-collapse: collapse;
          }
          .line-items th {
            background: #f0f0f0;
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          .line-items td {
            padding: 12px;
            border-bottom: 1px solid #eee;
          }
          .line-items tr:nth-child(even) {
            background: #fafafa;
          }
          .totals {
            margin: 40px 0;
            text-align: right;
          }
          .totals table {
            margin-left: auto;
            min-width: 300px;
          }
          .totals td {
            padding: 8px 12px;
          }
          .totals .total-row {
            font-weight: bold;
            font-size: 16px;
            border-top: 2px solid #333;
          }
          .notes {
            margin: 40px 0;
          }
          .notes h3 {
            margin: 0 0 10px 0;
            color: #333;
          }
          .footer {
            margin-top: 60px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-info">
              <h1>${companySettings.name}</h1>
              <p>${companySettings.address.street}</p>
              <p>${[companySettings.address.city, companySettings.address.state, companySettings.address.zipCode].filter(Boolean).join(', ')}</p>
              <p>${companySettings.address.country}</p>
              <p>Email: ${companySettings.email}</p>
              ${companySettings.phone ? `<p>Phone: ${companySettings.phone}</p>` : ''}
            </div>
            <div class="invoice-details">
              <h2>INVOICE</h2>
              <p>Invoice #: ${invoice.invoiceNumber}</p>
              <p>Issue Date: ${format(invoice.issueDate, 'MMM dd, yyyy')}</p>
              <p>Due Date: ${format(invoice.dueDate, 'MMM dd, yyyy')}</p>
              <p><span class="status-badge status-${invoice.status}">${invoice.status}</span></p>
            </div>
          </div>

          <div class="bill-to">
            <h3>Bill To:</h3>
            <p><strong>${client.name}</strong></p>
            <p>${client.address.street}</p>
            <p>${[client.address.city, client.address.state, client.address.zipCode].filter(Boolean).join(', ')}</p>
            <p>${client.address.country}</p>
            <p>${client.email}</p>
            ${client.phone ? `<p>${client.phone}</p>` : ''}
          </div>

          <div class="line-items">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Rate</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.lineItems.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">$${item.rate.toFixed(2)}</td>
                    <td style="text-align: right;">$${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">$${invoice.subtotal.toFixed(2)}</td>
              </tr>
              ${invoice.taxRate > 0 ? `
                <tr>
                  <td>Tax (${invoice.taxRate}%):</td>
                  <td style="text-align: right;">$${invoice.taxAmount.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td>Total:</td>
                <td style="text-align: right;">$${invoice.total.toFixed(2)}</td>
              </tr>
              ${invoice.paidAmount > 0 ? `
                <tr>
                  <td>Paid:</td>
                  <td style="text-align: right;">$${invoice.paidAmount.toFixed(2)}</td>
                </tr>
                ${invoice.balance > 0 ? `
                  <tr>
                    <td><strong>Balance Due:</strong></td>
                    <td style="text-align: right;"><strong>$${invoice.balance.toFixed(2)}</strong></td>
                  </tr>
                ` : ''}
              ` : ''}
            </table>
          </div>

          ${invoice.notes ? `
            <div class="notes">
              <h3>Notes:</h3>
              <p>${invoice.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Payment Terms: Net ${companySettings.paymentTerms} days</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}