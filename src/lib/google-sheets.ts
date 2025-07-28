import { google, sheets_v4 } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { Client, CreateClientData, Invoice, CreateInvoiceData, UpdateInvoiceData, LineItem, InvoiceStatus, Payment, CreatePaymentData, CompanySettings, PaymentMethod, Template, CreateTemplateData, UpdateTemplateData } from '@/types';
import { generateId } from './utils';

// Error types for better error handling
export class GoogleSheetsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'GoogleSheetsError';
  }
}

export class AuthenticationError extends GoogleSheetsError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401, false);
  }
}

export class RateLimitError extends GoogleSheetsError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429, true);
  }
}

export class NetworkError extends GoogleSheetsError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 500, true);
  }
}

export class ValidationError extends GoogleSheetsError {
  constructor(message: string = 'Data validation failed') {
    super(message, 'VALIDATION_ERROR', 400, false);
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;
  private retryConfig: RetryConfig;

  constructor(accessToken: string, spreadsheetId: string, retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = spreadsheetId;
    this.retryConfig = retryConfig;
  }

  /**
   * Executes a Google Sheets operation with retry logic and error handling
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryable: boolean = true
  ): Promise<T> {
    let lastError: Error;
    let attempt = 0;

    while (attempt <= this.retryConfig.maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        attempt++;

        // Parse Google Sheets API errors
        const parsedError = this.parseGoogleSheetsError(error, operationName);
        
        // Don't retry if error is not retryable or we've exceeded max retries
        if (!retryable || !parsedError.retryable || attempt > this.retryConfig.maxRetries) {
          throw parsedError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelay
        );

        console.warn(`${operationName} failed (attempt ${attempt}/${this.retryConfig.maxRetries + 1}), retrying in ${delay}ms:`, parsedError.message);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but just in case
    throw this.parseGoogleSheetsError(lastError!, operationName);
  }

  /**
   * Parses Google Sheets API errors into our custom error types
   */
  private parseGoogleSheetsError(error: any, operationName: string): GoogleSheetsError {
    const message = error?.message || 'Unknown error occurred';
    const statusCode = error?.response?.status || error?.status;

    // Authentication errors
    if (statusCode === 401 || message.includes('unauthorized') || message.includes('invalid_grant')) {
      return new AuthenticationError(`Authentication failed during ${operationName}: ${message}`);
    }

    // Rate limiting errors
    if (statusCode === 429 || message.includes('rate limit') || message.includes('quota exceeded')) {
      return new RateLimitError(`Rate limit exceeded during ${operationName}: ${message}`);
    }

    // Network/connectivity errors
    if (statusCode >= 500 || message.includes('network') || message.includes('timeout') || error.code === 'ENOTFOUND') {
      return new NetworkError(`Network error during ${operationName}: ${message}`);
    }

    // Validation errors
    if (statusCode === 400 || message.includes('invalid') || message.includes('bad request')) {
      return new ValidationError(`Validation error during ${operationName}: ${message}`);
    }

    // Generic error with retry capability for unknown errors
    return new GoogleSheetsError(
      `Error during ${operationName}: ${message}`,
      'UNKNOWN_ERROR',
      statusCode,
      statusCode >= 500 // Retry server errors
    );
  }

  static async getAuthenticatedService(): Promise<GoogleSheetsService> {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      throw new AuthenticationError('No valid session or access token found');
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new ValidationError('Google Sheets Spreadsheet ID not configured');
    }

    return new GoogleSheetsService(session.accessToken, spreadsheetId);
  }

  async getClients(): Promise<Client[]> {
    return this.executeWithRetry(async () => {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Clients!A2:K'
      });

      const rows = response.data.values || [];
      return rows.map(row => this.rowToClient(row));
    }, 'getClients');
  }

  async createClient(clientData: CreateClientData): Promise<Client> {
    return this.executeWithRetry(async () => {
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
    }, 'createClient');
  }

  async getClient(id: string): Promise<Client | null> {
    return this.executeWithRetry(async () => {
      const clients = await this.getClients();
      return clients.find(client => client.id === id) || null;
    }, 'getClient');
  }

  async updateClient(id: string, updates: Partial<CreateClientData>): Promise<Client | null> {
    return this.executeWithRetry(async () => {
      // Get all clients to find the row index
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Clients!A2:K'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        throw new ValidationError(`Client with ID ${id} not found`);
      }

      // Get the existing client data
      const existingRow = rows[rowIndex];
      if (!existingRow) {
        throw new ValidationError(`Client data is corrupted for ID ${id}`);
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
    }, 'updateClient');
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
        range: 'Invoices!A2:T'
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

    // Handle recurring schedule
    let recurringSchedule: Invoice['recurringSchedule'] = undefined;
    if (invoiceData.isRecurring && invoiceData.recurringSchedule) {
      const nextInvoiceDate = this.calculateNextInvoiceDate(
        invoiceData.recurringSchedule.startDate,
        invoiceData.recurringSchedule.frequency,
        invoiceData.recurringSchedule.interval
      );
      
      recurringSchedule = {
        ...invoiceData.recurringSchedule,
        nextInvoiceDate,
        isActive: true
      };
    }

    const invoice: Invoice = {
      id: this.generateId(),
      invoiceNumber,
      ...invoiceData,
      recurringSchedule,
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
      range: 'Invoices!A:T',
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

  async updateInvoice(id: string, updates: UpdateInvoiceData): Promise<Invoice | null> {
    try {
      // Get all invoices to find the row index
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Invoices!A2:T'
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
        range: `Invoices!A${sheetRowIndex}:T${sheetRowIndex}`,
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
        range: 'Invoices!A2:T'
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
    
    // Parse recurring schedule if present
    let recurringSchedule: Invoice['recurringSchedule'] = undefined;
    if (row[14] === 'true' && row[15]) {
      try {
        const scheduleData = JSON.parse(row[15]);
        recurringSchedule = {
          frequency: scheduleData.frequency,
          interval: scheduleData.interval,
          startDate: new Date(scheduleData.startDate),
          endDate: scheduleData.endDate ? new Date(scheduleData.endDate) : undefined,
          nextInvoiceDate: new Date(scheduleData.nextInvoiceDate),
          isActive: scheduleData.isActive
        };
      } catch (error) {
        console.error('Error parsing recurring schedule:', error);
      }
    }
    
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
      recurringSchedule,
      sentDate: row[16] && row[16].trim() !== '' ? this.parseDate(row[16]) : undefined,
      createdAt: this.parseDate(row[17] || ''),
      updatedAt: this.parseDate(row[18] || '')
    };
  }

  private invoiceToRow(invoice: Invoice): string[] {
    // Serialize recurring schedule if present
    let recurringScheduleJson = '';
    if (invoice.isRecurring && invoice.recurringSchedule) {
      recurringScheduleJson = JSON.stringify({
        frequency: invoice.recurringSchedule.frequency,
        interval: invoice.recurringSchedule.interval,
        startDate: invoice.recurringSchedule.startDate.toISOString(),
        endDate: invoice.recurringSchedule.endDate?.toISOString(),
        nextInvoiceDate: invoice.recurringSchedule.nextInvoiceDate.toISOString(),
        isActive: invoice.recurringSchedule.isActive
      });
    }
    
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
      recurringScheduleJson,
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
      paymentMethod: (row[4] as PaymentMethod) || 'other',
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

  // Company Settings methods
  async getCompanySettings(): Promise<CompanySettings | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Settings!A2:B'
      });

      const rows = response.data.values || [];
      const settingsMap = new Map<string, string>();
      
      rows.forEach(row => {
        if (row[0] && row[1]) {
          settingsMap.set(row[0], row[1]);
        }
      });

      if (settingsMap.size === 0) {
        return this.getDefaultCompanySettings();
      }

      return {
        name: settingsMap.get('company_name') || 'Your Company',
        email: settingsMap.get('company_email') || '',
        phone: settingsMap.get('company_phone') || undefined,
        address: {
          street: settingsMap.get('company_street') || '',
          city: settingsMap.get('company_city') || '',
          state: settingsMap.get('company_state') || '',
          zipCode: settingsMap.get('company_zip') || '',
          country: settingsMap.get('company_country') || ''
        },
        logo: settingsMap.get('company_logo') || undefined,
        taxRate: parseFloat(settingsMap.get('tax_rate') || '0'),
        paymentTerms: parseInt(settingsMap.get('payment_terms') || '30'),
        invoiceTemplate: settingsMap.get('invoice_template') || 'default',
        currency: settingsMap.get('currency') || 'USD',
        dateFormat: settingsMap.get('date_format') || 'MM/dd/yyyy',
        timeZone: settingsMap.get('time_zone') || 'America/New_York'
      };
    } catch (error) {
      console.error('Error getting company settings:', error);
      return this.getDefaultCompanySettings();
    }
  }

  async updateCompanySettings(settings: CompanySettings): Promise<CompanySettings> {
    try {
      const settingsData = [
        ['company_name', settings.name],
        ['company_email', settings.email],
        ['company_phone', settings.phone || ''],
        ['company_street', settings.address.street],
        ['company_city', settings.address.city],
        ['company_state', settings.address.state],
        ['company_zip', settings.address.zipCode],
        ['company_country', settings.address.country],
        ['company_logo', settings.logo || ''],
        ['tax_rate', settings.taxRate.toString()],
        ['payment_terms', settings.paymentTerms.toString()],
        ['invoice_template', settings.invoiceTemplate],
        ['currency', settings.currency],
        ['date_format', settings.dateFormat],
        ['time_zone', settings.timeZone]
      ];

      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'Settings!A2:B'
      });

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Settings!A2:B',
        valueInputOption: 'RAW',
        requestBody: {
          values: settingsData
        }
      });

      return settings;
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  }

  private getDefaultCompanySettings(): CompanySettings {
    return {
      name: 'Your Company',
      email: '',
      phone: undefined,
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      logo: undefined,
      taxRate: 0,
      paymentTerms: 30,
      invoiceTemplate: 'default',
      currency: 'USD',
      dateFormat: 'MM/dd/yyyy',
      timeZone: 'America/New_York'
    };
  }

  private calculateNextInvoiceDate(startDate: Date, frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly', interval: number): Date {
    const nextDate = new Date(startDate);
    
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 * interval));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + (3 * interval));
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
    }
    
    return nextDate;
  }

  // Recurring invoice methods
  async getRecurringInvoices(): Promise<Invoice[]> {
    try {
      const allInvoices = await this.getInvoices();
      return allInvoices.filter(invoice => 
        invoice.isRecurring && 
        invoice.recurringSchedule?.isActive
      );
    } catch (error) {
      console.error('Error getting recurring invoices:', error);
      return [];
    }
  }

  async getRecurringInvoicesDue(): Promise<Invoice[]> {
    try {
      const recurringInvoices = await this.getRecurringInvoices();
      const now = new Date();
      
      return recurringInvoices.filter(invoice => {
        if (!invoice.recurringSchedule) return false;
        
        const nextDate = invoice.recurringSchedule.nextInvoiceDate;
        const endDate = invoice.recurringSchedule.endDate;
        
        // Check if it's time to generate the next invoice
        const isDue = nextDate <= now;
        
        // Check if the recurring schedule hasn't ended
        const hasNotEnded = !endDate || endDate > now;
        
        return isDue && hasNotEnded;
      });
    } catch (error) {
      console.error('Error getting due recurring invoices:', error);
      return [];
    }
  }

  async generateRecurringInvoice(templateInvoice: Invoice): Promise<Invoice | null> {
    try {
      if (!templateInvoice.isRecurring || !templateInvoice.recurringSchedule) {
        return null;
      }

      // Calculate the next invoice date after this one
      const nextInvoiceDate = this.calculateNextInvoiceDate(
        templateInvoice.recurringSchedule.nextInvoiceDate,
        templateInvoice.recurringSchedule.frequency,
        templateInvoice.recurringSchedule.interval
      );

      // Create new invoice based on template
      const newInvoiceData: CreateInvoiceData = {
        clientId: templateInvoice.clientId,
        templateId: templateInvoice.templateId,
        status: 'draft',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        lineItems: templateInvoice.lineItems.map(item => ({
          id: this.generateId(),
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        })),
        subtotal: 0, // Will be calculated in service
        taxRate: templateInvoice.taxRate,
        taxAmount: 0, // Will be calculated in service
        total: 0, // Will be calculated in service
        notes: templateInvoice.notes,
        isRecurring: false // Generated invoices are not recurring themselves
      };

      const newInvoice = await this.createInvoice(newInvoiceData);

      // Update the template invoice's next invoice date
      await this.updateInvoice(templateInvoice.id, {
        recurringSchedule: {
          ...templateInvoice.recurringSchedule,
          nextInvoiceDate
        }
      });

      return newInvoice;
    } catch (error) {
      console.error('Error generating recurring invoice:', error);
      return null;
    }
  }

  async toggleRecurringInvoice(id: string, isActive: boolean): Promise<Invoice | null> {
    try {
      const invoice = await this.getInvoice(id);
      if (!invoice || !invoice.isRecurring || !invoice.recurringSchedule) {
        return null;
      }

      return await this.updateInvoice(id, {
        recurringSchedule: {
          ...invoice.recurringSchedule,
          isActive
        }
      });
    } catch (error) {
      console.error('Error toggling recurring invoice:', error);
      return null;
    }
  }

  // Template methods
  async getTemplates(): Promise<Template[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Templates!A2:I'
      });

      const rows = response.data.values || [];
      const templates = await Promise.all(rows.map(row => this.rowToTemplate(row)));
      return templates;
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  async createTemplate(templateData: CreateTemplateData): Promise<Template> {
    const template: Template = {
      id: this.generateId(),
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save template header
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Templates!A:I',
      valueInputOption: 'RAW',
      requestBody: {
        values: [this.templateToRow(template)]
      }
    });

    // Save template line items
    if (template.lineItems.length > 0) {
      const lineItemRows = template.lineItems.map(item => this.templateLineItemToRow(template.id, item));
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'TemplateLineItems!A:F',
        valueInputOption: 'RAW',
        requestBody: {
          values: lineItemRows
        }
      });
    }

    return template;
  }

  async getTemplate(id: string): Promise<Template | null> {
    try {
      const templates = await this.getTemplates();
      return templates.find(template => template.id === id) || null;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }

  async updateTemplate(id: string, updates: UpdateTemplateData): Promise<Template | null> {
    try {
      // Get all templates to find the row index
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Templates!A2:I'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        return null; // Template not found
      }

      // Get the existing template data
      const existingRow = rows[rowIndex];
      if (!existingRow) {
        return null;
      }
      const existingTemplate = await this.rowToTemplate(existingRow);
      
      // Merge updates with existing data
      const updatedTemplate = {
        ...existingTemplate,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date()
      };

      // Update the row in Google Sheets (row index + 2 because we start from A2)
      const sheetRowIndex = rowIndex + 2;
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Templates!A${sheetRowIndex}:I${sheetRowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [this.templateToRow(updatedTemplate)]
        }
      });

      // Update line items if they changed
      if (updates.lineItems) {
        // Delete existing line items
        await this.deleteTemplateLineItems(id);
        
        // Add new line items
        if (updates.lineItems.length > 0) {
          const lineItemRows = updates.lineItems.map(item => this.templateLineItemToRow(id, item));
          await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: 'TemplateLineItems!A:F',
            valueInputOption: 'RAW',
            requestBody: {
              values: lineItemRows
            }
          });
        }
      }

      return updatedTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      return null;
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    try {
      // Delete template line items first
      await this.deleteTemplateLineItems(id);

      // Get all templates to find the row index
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Templates!A2:I'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        return false; // Template not found
      }

      // Delete the row (row index + 2 because we start from A2)
      const sheetRowIndex = rowIndex + 2;
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 4, // Assuming Templates sheet is the fifth sheet
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
      console.error('Error deleting template:', error);
      return false;
    }
  }

  private async deleteTemplateLineItems(templateId: string): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'TemplateLineItems!A2:F'
      });

      const rows = response.data.values || [];
      const rowsToDelete: number[] = [];

      // Find all rows that belong to this template
      rows.forEach((row, index) => {
        if (row && row[1] === templateId) { // Column B contains templateId
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
                  sheetId: 5, // Assuming TemplateLineItems sheet is the sixth sheet
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
      console.error('Error deleting template line items:', error);
    }
  }

  private async getTemplateLineItems(templateId: string): Promise<Omit<LineItem, 'id'>[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'TemplateLineItems!A2:F'
      });

      const rows = response.data.values || [];
      return rows
        .filter(row => row && row[1] === templateId) // Column B contains templateId
        .map(row => this.rowToTemplateLineItem(row));
    } catch (error) {
      console.error('Error getting template line items:', error);
      return [];
    }
  }

  private async rowToTemplate(row: string[]): Promise<Template> {
    const lineItems = await this.getTemplateLineItems(row[0] || '');
    
    return {
      id: row[0] || '',
      name: row[1] || '',
      description: row[2] && row[2].trim() !== '' ? row[2] : undefined,
      lineItems,
      taxRate: parseFloat(row[3] || '0'),
      notes: row[4] && row[4].trim() !== '' ? row[4] : undefined,
      isActive: row[5] === 'true',
      createdAt: this.parseDate(row[6] || ''),
      updatedAt: this.parseDate(row[7] || '')
    };
  }

  private templateToRow(template: Template): string[] {
    return [
      template.id,
      template.name,
      template.description || '',
      template.taxRate.toString(),
      template.notes || '',
      template.isActive.toString(),
      template.createdAt.toISOString(),
      template.updatedAt.toISOString()
    ];
  }

  private rowToTemplateLineItem(row: string[]): Omit<LineItem, 'id'> {
    const quantity = parseFloat(row[3] || '0');
    const rate = parseFloat(row[4] || '0');
    
    return {
      description: row[2] || '',
      quantity,
      rate,
      amount: quantity * rate
    };
  }

  private templateLineItemToRow(templateId: string, item: Omit<LineItem, 'id'>): string[] {
    return [
      this.generateId(),
      templateId,
      item.description,
      item.quantity.toString(),
      item.rate.toString(),
      item.amount.toString()
    ];
  }
}