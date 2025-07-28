import { google, sheets_v4 } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { Client, CreateClientData, Invoice, CreateInvoiceData, LineItem, InvoiceStatus, Payment, CreatePaymentData } from '@/types';
import { generateId } from './utils';

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;

  constructor(accessToken: string, spreadsheetId: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = spreadsheetId;
  }

  static async getAuthenticatedService(): Promise<GoogleSheetsService> {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      throw new Error('No valid session or access token found');
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error('Google Sheets Spreadsheet ID not configured');
    }

    return new GoogleSheetsService(session.accessToken, spreadsheetId);
  }

  async getClients(): Promise<Client[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Clients!A2:K'
      });

      const rows = response.data.values || [];
      return rows.map(row => this.rowToClient(row));
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  }

  async createClient(clientData: CreateClientData): Promise<Client> {
    const client: Client = {
      id: this.generateId(),
      ...clientData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Clients!A:K',
      valueInputOption: 'RAW',
      requestBody: {
        values: [this.clientToRow(client)]
      }
    });

    return client;
  }

  async getClient(id: string): Promise<Client | null> {
    try {
      const clients = await this.getClients();
      return clients.find(client => client.id === id) || null;
    } catch (error) {
      console.error('Error getting client:', error);
      return null;
    }
  }

  async updateClient(id: string, updates: Partial<CreateClientData>): Promise<Client | null> {
    try {
      // Get all clients to find the row index
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Clients!A2:K'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        return null; // Client not found
      }

      // Get the existing client data
      const existingRow = rows[rowIndex];
      if (!existingRow) {
        return null;
      }
      const existingClient = this.rowToClient(existingRow);
      
      // Merge updates with existing data
      const updatedClient: Client = {
        ...existingClient,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date()
      };

      // Update the row in Google Sheets (row index + 2 because we start from A2)
      const sheetRowIndex = rowIndex + 2;
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Clients!A${sheetRowIndex}:K${sheetRowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [this.clientToRow(updatedClient)]
        }
      });

      return updatedClient;
    } catch (error) {
      console.error('Error updating client:', error);
      return null;
    }
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      // Get all clients to find the row index
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Clients!A2:K'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        return false; // Client not found
      }

      // Delete the row (row index + 2 because we start from A2)
      const sheetRowIndex = rowIndex + 2;
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0, // Assuming Clients sheet is the first sheet
                dimension: 'ROWS',
                startIndex: sheetRowIndex - 1, // 0-based index
                endIndex: sheetRowIndex
              }
            }
          }]
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  }

  private parseDate(dateString: string): Date {
    if (!dateString || dateString.trim() === '') {
      return new Date();
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  private generateId(): string {
    return generateId();
  }

  private rowToClient(row: string[]): Client {
    return {
      id: row[0] || '',
      name: row[1] || '',
      email: row[2] || '',
      phone: row[3] && row[3].trim() !== '' ? row[3] : undefined,
      address: {
        street: row[4] || '',
        city: row[5] || '',
        state: row[6] || '',
        zipCode: row[7] || '',
        country: row[8] || ''
      },
      createdAt: this.parseDate(row[9] || ''),
      updatedAt: this.parseDate(row[10] || '')
    };
  }

  private clientToRow(client: Client): string[] {
    return [
      client.id,
      client.name,
      client.email,
      client.phone || '',
      client.address.street,
      client.address.city,
      client.address.state,
      client.address.zipCode,
      client.address.country,
      client.createdAt.toISOString(),
      client.updatedAt.toISOString()
    ];
  }

  // Invoice methods
  async getInvoices(): Promise<Invoice[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Invoices!A2:S'
      });

      const rows = response.data.values || [];
      const invoices = await Promise.all(rows.map(row => this.rowToInvoice(row)));
      return invoices;
    } catch (error) {
      console.error('Error getting invoices:', error);
      return [];
    }
  }

  async createInvoice(invoiceData: CreateInvoiceData): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber();
    const subtotal = invoiceData.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (invoiceData.taxRate / 100);
    const total = subtotal + taxAmount;

    const invoice: Invoice = {
      id: this.generateId(),
      invoiceNumber,
      ...invoiceData,
      subtotal,
      taxAmount,
      total,
      paidAmount: 0,
      balance: total,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save invoice header
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Invoices!A:S',
      valueInputOption: 'RAW',
      requestBody: {
        values: [this.invoiceToRow(invoice)]
      }
    });

    // Save line items
    if (invoice.lineItems.length > 0) {
      const lineItemRows = invoice.lineItems.map(item => this.lineItemToRow(invoice.id, item));
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'LineItems!A:F',
        valueInputOption: 'RAW',
        requestBody: {
          values: lineItemRows
        }
      });
    }

    return invoice;
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    try {
      const invoices = await this.getInvoices();
      return invoices.find(invoice => invoice.id === id) || null;
    } catch (error) {
      console.error('Error getting invoice:', error);
      return null;
    }
  }

  async updateInvoice(id: string, updates: Partial<CreateInvoiceData>): Promise<Invoice | null> {
    try {
      // Get all invoices to find the row index
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Invoices!A2:S'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        return null; // Invoice not found
      }

      // Get the existing invoice data
      const existingRow = rows[rowIndex];
      if (!existingRow) {
        return null;
      }
      const existingInvoice = await this.rowToInvoice(existingRow);
      
      // Merge updates with existing data
      const updatedInvoiceData = {
        ...existingInvoice,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date()
      };

      // Handle status-specific logic
      if (updates.status === 'paid' && existingInvoice.status !== 'paid') {
        // When marking as paid, set paidAmount to total and balance to 0
        updatedInvoiceData.paidAmount = existingInvoice.total;
        updatedInvoiceData.balance = 0;
      }

      // Recalculate amounts if line items changed
      if (updates.lineItems) {
        const subtotal = updates.lineItems.reduce((sum, item) => sum + item.amount, 0);
        const taxAmount = subtotal * ((updates.taxRate ?? existingInvoice.taxRate) / 100);
        const total = subtotal + taxAmount;
        
        updatedInvoiceData.subtotal = subtotal;
        updatedInvoiceData.taxAmount = taxAmount;
        updatedInvoiceData.total = total;
        updatedInvoiceData.balance = total - updatedInvoiceData.paidAmount;
      }

      // Update the row in Google Sheets (row index + 2 because we start from A2)
      const sheetRowIndex = rowIndex + 2;
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Invoices!A${sheetRowIndex}:S${sheetRowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [this.invoiceToRow(updatedInvoiceData)]
        }
      });

      // Update line items if they changed
      if (updates.lineItems) {
        // Delete existing line items
        await this.deleteLineItems(id);
        
        // Add new line items
        if (updates.lineItems.length > 0) {
          const lineItemRows = updates.lineItems.map(item => this.lineItemToRow(id, item));
          await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: 'LineItems!A:F',
            valueInputOption: 'RAW',
            requestBody: {
              values: lineItemRows
            }
          });
        }
      }

      return updatedInvoiceData;
    } catch (error) {
      console.error('Error updating invoice:', error);
      return null;
    }
  }

  async deleteInvoice(id: string): Promise<boolean> {
    try {
      // Delete line items first
      await this.deleteLineItems(id);

      // Get all invoices to find the row index
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Invoices!A2:S'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        return false; // Invoice not found
      }

      // Delete the row (row index + 2 because we start from A2)
      const sheetRowIndex = rowIndex + 2;
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 1, // Assuming Invoices sheet is the second sheet
                dimension: 'ROWS',
                startIndex: sheetRowIndex - 1, // 0-based index
                endIndex: sheetRowIndex
              }
            }
          }]
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  private async deleteLineItems(invoiceId: string): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'LineItems!A2:F'
      });

      const rows = response.data.values || [];
      const rowsToDelete: number[] = [];

      // Find all rows that belong to this invoice
      rows.forEach((row, index) => {
        if (row && row[1] === invoiceId) { // Column B contains invoiceId
          rowsToDelete.push(index + 2); // +2 because we start from A2
        }
      });

      // Delete rows in reverse order to maintain correct indices
      for (const rowIndex of rowsToDelete.reverse()) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: 2, // Assuming LineItems sheet is the third sheet
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1, // 0-based index
                  endIndex: rowIndex
                }
              }
            }]
          }
        });
      }
    } catch (error) {
      console.error('Error deleting line items:', error);
    }
  }

  private async getLineItems(invoiceId: string): Promise<LineItem[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'LineItems!A2:F'
      });

      const rows = response.data.values || [];
      return rows
        .filter(row => row && row[1] === invoiceId) // Column B contains invoiceId
        .map(row => this.rowToLineItem(row));
    } catch (error) {
      console.error('Error getting line items:', error);
      return [];
    }
  }

  private async generateInvoiceNumber(): Promise<string> {
    try {
      const invoices = await this.getInvoices();
      const currentYear = new Date().getFullYear();
      const yearPrefix = currentYear.toString();
      
      // Find the highest invoice number for the current year
      const yearInvoices = invoices.filter(invoice => 
        invoice.invoiceNumber.startsWith(yearPrefix)
      );
      
      let maxNumber = 0;
      yearInvoices.forEach(invoice => {
        const numberPart = invoice.invoiceNumber.replace(`${yearPrefix}-`, '');
        const num = parseInt(numberPart, 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      });
      
      const nextNumber = maxNumber + 1;
      return `${yearPrefix}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number
      return `${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    }
  }

  private async rowToInvoice(row: string[]): Promise<Invoice> {
    const lineItems = await this.getLineItems(row[0] || '');
    
    return {
      id: row[0] || '',
      invoiceNumber: row[1] || '',
      clientId: row[2] || '',
      templateId: row[3] && row[3].trim() !== '' ? row[3] : undefined,
      status: (row[4] as InvoiceStatus) || 'draft',
      issueDate: this.parseDate(row[5] || ''),
      dueDate: this.parseDate(row[6] || ''),
      lineItems,
      subtotal: parseFloat(row[7] || '0'),
      taxRate: parseFloat(row[8] || '0'),
      taxAmount: parseFloat(row[9] || '0'),
      total: parseFloat(row[10] || '0'),
      paidAmount: parseFloat(row[11] || '0'),
      balance: parseFloat(row[12] || '0'),
      notes: row[13] && row[13].trim() !== '' ? row[13] : undefined,
      isRecurring: row[14] === 'true',
      sentDate: row[15] && row[15].trim() !== '' ? this.parseDate(row[15]) : undefined,
      createdAt: this.parseDate(row[16] || ''),
      updatedAt: this.parseDate(row[17] || '')
    };
  }

  private invoiceToRow(invoice: Invoice): string[] {
    return [
      invoice.id,
      invoice.invoiceNumber,
      invoice.clientId,
      invoice.templateId || '',
      invoice.status,
      invoice.issueDate.toISOString(),
      invoice.dueDate.toISOString(),
      invoice.subtotal.toString(),
      invoice.taxRate.toString(),
      invoice.taxAmount.toString(),
      invoice.total.toString(),
      invoice.paidAmount.toString(),
      invoice.balance.toString(),
      invoice.notes || '',
      invoice.isRecurring.toString(),
      invoice.sentDate?.toISOString() || '',
      invoice.createdAt.toISOString(),
      invoice.updatedAt.toISOString()
    ];
  }

  private rowToLineItem(row: string[]): LineItem {
    const quantity = parseFloat(row[3] || '0');
    const rate = parseFloat(row[4] || '0');
    
    return {
      id: row[0] || '',
      description: row[2] || '',
      quantity,
      rate,
      amount: quantity * rate
    };
  }

  private lineItemToRow(invoiceId: string, item: LineItem): string[] {
    return [
      item.id,
      invoiceId,
      item.description,
      item.quantity.toString(),
      item.rate.toString(),
      item.amount.toString()
    ];
  }

  // Payment methods
  async getPayments(invoiceId?: string): Promise<Payment[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Payments!A2:G'
      });

      const rows = response.data.values || [];
      const payments = rows.map(row => this.rowToPayment(row));
      
      if (invoiceId) {
        return payments.filter(payment => payment.invoiceId === invoiceId);
      }
      
      return payments;
    } catch (error) {
      console.error('Error getting payments:', error);
      return [];
    }
  }

  async createPayment(paymentData: CreatePaymentData): Promise<Payment> {
    const payment: Payment = {
      id: this.generateId(),
      ...paymentData,
      createdAt: new Date()
    };

    // Save payment
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Payments!A:G',
      valueInputOption: 'RAW',
      requestBody: {
        values: [this.paymentToRow(payment)]
      }
    });

    // Update invoice paid amount and balance
    await this.updateInvoicePaymentStatus(payment.invoiceId, payment.amount);

    return payment;
  }

  async getPayment(id: string): Promise<Payment | null> {
    try {
      const payments = await this.getPayments();
      return payments.find(payment => payment.id === id) || null;
    } catch (error) {
      console.error('Error getting payment:', error);
      return null;
    }
  }

  async deletePayment(id: string): Promise<boolean> {
    try {
      // Get the payment first to know which invoice to update
      const payment = await this.getPayment(id);
      if (!payment) {
        return false;
      }

      // Get all payments to find the row index
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Payments!A2:G'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        return false; // Payment not found
      }

      // Delete the row (row index + 2 because we start from A2)
      const sheetRowIndex = rowIndex + 2;
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 3, // Assuming Payments sheet is the fourth sheet
                dimension: 'ROWS',
                startIndex: sheetRowIndex - 1, // 0-based index
                endIndex: sheetRowIndex
              }
            }
          }]
        }
      });

      // Update invoice paid amount and balance (subtract the deleted payment)
      await this.updateInvoicePaymentStatus(payment.invoiceId, -payment.amount);

      return true;
    } catch (error) {
      console.error('Error deleting payment:', error);
      return false;
    }
  }

  private async updateInvoicePaymentStatus(invoiceId: string, paymentAmount: number): Promise<void> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) {
        return;
      }

      const newPaidAmount = Math.max(0, invoice.paidAmount + paymentAmount);
      const newBalance = invoice.total - newPaidAmount;
      
      // Determine new status
      let newStatus: InvoiceStatus = invoice.status;
      if (newBalance <= 0) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0 && invoice.status === 'draft') {
        newStatus = 'sent'; // Assume invoice was sent if payment received
      } else if (newBalance > 0 && new Date() > invoice.dueDate) {
        newStatus = 'overdue';
      }

      // Update the invoice
      await this.updateInvoice(invoiceId, {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating invoice payment status:', error);
    }
  }

  private rowToPayment(row: string[]): Payment {
    return {
      id: row[0] || '',
      invoiceId: row[1] || '',
      amount: parseFloat(row[2] || '0'),
      paymentDate: this.parseDate(row[3] || ''),
      paymentMethod: (row[4] as any) || 'other',
      notes: row[5] && row[5].trim() !== '' ? row[5] : undefined,
      createdAt: this.parseDate(row[6] || '')
    };
  }

  private paymentToRow(payment: Payment): string[] {
    return [
      payment.id,
      payment.invoiceId,
      payment.amount.toString(),
      payment.paymentDate.toISOString(),
      payment.paymentMethod,
      payment.notes || '',
      payment.createdAt.toISOString()
    ];
  }
}