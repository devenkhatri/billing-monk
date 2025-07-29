import { google, sheets_v4 } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { Client, CreateClientData, Invoice, CreateInvoiceData, UpdateInvoiceData, LineItem, InvoiceStatus, Payment, CreatePaymentData, CompanySettings, PaymentMethod, Template, CreateTemplateData, UpdateTemplateData, Project, CreateProjectData, UpdateProjectData, Task, CreateTaskData, UpdateTaskData, TimeEntry, CreateTimeEntryData, UpdateTimeEntryData, ProjectStatus, TaskStatus, TaskPriority } from '@/types';
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
   * Creates a GoogleSheetsService instance using service account credentials
   * This is used for server-side operations that don't require user authentication
   */
  static async getAuthenticatedService(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG): Promise<GoogleSheetsService> {
    try {
      // Get required environment variables
      const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
      const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
      const projectId = process.env.GOOGLE_SHEETS_PROJECT_ID;
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

      if (!privateKey || !clientEmail || !projectId || !spreadsheetId) {
        throw new AuthenticationError(
          'Missing required Google Sheets service account credentials. Please check your environment variables.'
        );
      }

      // Create service account auth
      const auth = new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: projectId,
          private_key: privateKey.replace(/\\n/g, '\n'),
          client_email: clientEmail,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const authClient = await auth.getClient();
      const sheets = google.sheets({ version: 'v4', auth: authClient });

      // Create a new instance with service account auth
      const service = Object.create(GoogleSheetsService.prototype);
      service.sheets = sheets;
      service.spreadsheetId = spreadsheetId;
      service.retryConfig = retryConfig;

      return service;
    } catch (error) {
      console.error('Failed to create authenticated Google Sheets service:', error);
      throw new AuthenticationError(
        `Failed to authenticate with Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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

  static async getAuthenticatedServiceWithUserToken(): Promise<GoogleSheetsService> {
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
      taxRate: 18,
      paymentTerms: 30,
      invoiceTemplate: 'default',
      currency: 'INR',
      dateFormat: 'dd/MM/yyyy',
      timeZone: 'Asia/Kolkata'
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
      // Ensure template sheets exist before reading
      await this.ensureTemplateSheets();
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Templates!A2:H'
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
    return this.executeWithRetry(async () => {
      // Ensure template sheets exist before creating template
      await this.ensureTemplateSheets();
      
      const template: Template = {
        id: this.generateId(),
        ...templateData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save template header
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Templates!A:H',
        valueInputOption: 'RAW',
        requestBody: {
          values: [this.templateToRow(template)]
        }
      });

      // Save template line items
      if (template.lineItems.length > 0) {
        console.log('Saving template line items:', template.lineItems);
        const lineItemRows = template.lineItems.map(item => this.templateLineItemToRow(template.id, item));
        console.log('Line item rows to save:', lineItemRows);
        
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'TemplateLineItems!A:F',
          valueInputOption: 'RAW',
          requestBody: {
            values: lineItemRows
          }
        });
        console.log('Template line items saved successfully');
      } else {
        console.log('No line items to save for template');
      }

      return template;
    }, 'createTemplate');
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
      // Ensure template sheets exist before updating
      await this.ensureTemplateSheets();
      
      // Get all templates to find the row index
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Templates!A2:H'
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
        range: `Templates!A${sheetRowIndex}:H${sheetRowIndex}`,
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
      // Ensure template sheets exist before deleting
      await this.ensureTemplateSheets();
      
      // Delete template line items first
      await this.deleteTemplateLineItems(id);

      // Get all templates to find the row index
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Templates!A2:H'
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
    // Calculate amount if not provided (for template line items from forms)
    const amount = item.amount ?? (item.quantity * item.rate);
    
    return [
      this.generateId(),
      templateId,
      item.description,
      item.quantity.toString(),
      item.rate.toString(),
      amount.toString()
    ];
  }

  /**
   * Ensure template sheets exist and have correct headers
   */
  private async ensureTemplateSheets(): Promise<void> {
    try {
      // Get current spreadsheet info
      const spreadsheetInfo = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const existingSheets = spreadsheetInfo.data.sheets?.map(sheet => sheet.properties?.title) || [];
      
      // Define template sheets
      const templateSheets = [
        {
          name: 'Templates',
          headers: ['ID', 'Name', 'Description', 'TaxRate', 'Notes', 'IsActive', 'CreatedAt', 'UpdatedAt']
        },
        {
          name: 'TemplateLineItems',
          headers: ['ID', 'TemplateID', 'Description', 'Quantity', 'Rate', 'Amount']
        }
      ];

      // Create missing template sheets
      const sheetsToCreate = templateSheets.filter(sheet => !existingSheets.includes(sheet.name));
      
      if (sheetsToCreate.length > 0) {
        const requests = sheetsToCreate.map(sheet => ({
          addSheet: {
            properties: {
              title: sheet.name
            }
          }
        }));

        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests
          }
        });

        console.log(`Created template sheets: ${sheetsToCreate.map(s => s.name).join(', ')}`);
      }

      // Add headers to template sheets
      for (const sheet of templateSheets) {
        try {
          // Check if headers already exist
          const existingData = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${sheet.name}!A1:Z1`
          });

          // If no data or headers don't match, add/update headers
          if (!existingData.data.values || existingData.data.values.length === 0 || 
              !this.arraysEqual(existingData.data.values[0], sheet.headers)) {
            
            await this.sheets.spreadsheets.values.update({
              spreadsheetId: this.spreadsheetId,
              range: `${sheet.name}!A1:${this.getColumnLetter(sheet.headers.length)}1`,
              valueInputOption: 'RAW',
              requestBody: {
                values: [sheet.headers]
              }
            });

            console.log(`Updated headers for ${sheet.name} sheet`);
          }
        } catch (error) {
          console.error(`Error setting up ${sheet.name} sheet:`, error);
        }
      }
    } catch (error) {
      console.error('Error ensuring template sheets:', error);
      throw error;
    }
  }

  // Project methods
  async getProjects(): Promise<Project[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Projects!A2:L'
      });

      const rows = response.data.values || [];
      const projects = rows.map(row => this.rowToProject(row));
      return projects;
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }

  async createProject(projectData: CreateProjectData): Promise<Project> {
    return this.executeWithRetry(async () => {
      const project: Project = {
        id: this.generateId(),
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Projects!A:L',
        valueInputOption: 'RAW',
        requestBody: {
          values: [this.projectToRow(project)]
        }
      });

      return project;
    }, 'createProject');
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      const projects = await this.getProjects();
      return projects.find(project => project.id === id) || null;
    } catch (error) {
      console.error('Error getting project:', error);
      return null;
    }
  }

  async updateProject(id: string, updates: UpdateProjectData): Promise<Project | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Projects!A2:L'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        return null;
      }

      const existingRow = rows[rowIndex];
      const existingProject = this.rowToProject(existingRow);
      
      const updatedProjectData: Project = {
        ...existingProject,
        ...updates,
        updatedAt: new Date()
      };

      const sheetRowIndex = rowIndex + 2;
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Projects!A${sheetRowIndex}:L${sheetRowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [this.projectToRow(updatedProjectData)]
        }
      });

      return updatedProjectData;
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      // Delete all tasks in the project first
      const tasks = await this.getTasksByProject(id);
      for (const task of tasks) {
        await this.deleteTask(task.id);
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Projects!A2:L'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        return false;
      }

      const sheetRowIndex = rowIndex + 2;
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 8, // Projects sheet
                dimension: 'ROWS',
                startIndex: sheetRowIndex - 1,
                endIndex: sheetRowIndex
              }
            }
          }]
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Tasks!A2:O'
      });

      const rows = response.data.values || [];
      const tasks = rows.map(row => this.rowToTask(row));
      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    try {
      const tasks = await this.getTasks();
      return tasks.filter(task => task.projectId === projectId);
    } catch (error) {
      console.error('Error getting tasks by project:', error);
      return [];
    }
  }

  async createTask(taskData: CreateTaskData): Promise<Task> {
    return this.executeWithRetry(async () => {
      const task: Task = {
        id: this.generateId(),
        ...taskData,
        actualHours: 0,
        billableHours: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Tasks!A:O',
        valueInputOption: 'RAW',
        requestBody: {
          values: [this.taskToRow(task)]
        }
      });

      return task;
    }, 'createTask');
  }

  async getTask(id: string): Promise<Task | null> {
    try {
      const tasks = await this.getTasks();
      return tasks.find(task => task.id === id) || null;
    } catch (error) {
      console.error('Error getting task:', error);
      return null;
    }
  }

  async updateTask(id: string, updates: UpdateTaskData): Promise<Task | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Tasks!A2:O'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        return null;
      }

      const existingRow = rows[rowIndex];
      const existingTask = this.rowToTask(existingRow);
      
      const updatedTaskData: Task = {
        ...existingTask,
        ...updates,
        updatedAt: new Date()
      };

      const sheetRowIndex = rowIndex + 2;
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Tasks!A${sheetRowIndex}:O${sheetRowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [this.taskToRow(updatedTaskData)]
        }
      });

      return updatedTaskData;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      // Delete all time entries for this task first
      const timeEntries = await this.getTimeEntriesByTask(id);
      for (const entry of timeEntries) {
        await this.deleteTimeEntry(entry.id);
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Tasks!A2:O'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        return false;
      }

      const sheetRowIndex = rowIndex + 2;
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 9, // Tasks sheet
                dimension: 'ROWS',
                startIndex: sheetRowIndex - 1,
                endIndex: sheetRowIndex
              }
            }
          }]
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  // Time Entry methods
  async getTimeEntries(): Promise<TimeEntry[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'TimeEntries!A2:K'
      });

      const rows = response.data.values || [];
      const timeEntries = rows.map(row => this.rowToTimeEntry(row));
      return timeEntries;
    } catch (error) {
      console.error('Error getting time entries:', error);
      return [];
    }
  }

  async getTimeEntriesByTask(taskId: string): Promise<TimeEntry[]> {
    try {
      const timeEntries = await this.getTimeEntries();
      return timeEntries.filter(entry => entry.taskId === taskId);
    } catch (error) {
      console.error('Error getting time entries by task:', error);
      return [];
    }
  }

  async createTimeEntry(timeEntryData: CreateTimeEntryData): Promise<TimeEntry> {
    return this.executeWithRetry(async () => {
      const timeEntry: TimeEntry = {
        id: this.generateId(),
        ...timeEntryData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'TimeEntries!A:K',
        valueInputOption: 'RAW',
        requestBody: {
          values: [this.timeEntryToRow(timeEntry)]
        }
      });

      // Update task hours
      await this.updateTaskHours(timeEntryData.taskId);

      return timeEntry;
    }, 'createTimeEntry');
  }

  async updateTimeEntry(id: string, updates: UpdateTimeEntryData): Promise<TimeEntry | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'TimeEntries!A2:K'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        return null;
      }

      const existingRow = rows[rowIndex];
      const existingTimeEntry = this.rowToTimeEntry(existingRow);
      
      const updatedTimeEntryData: TimeEntry = {
        ...existingTimeEntry,
        ...updates,
        updatedAt: new Date()
      };

      const sheetRowIndex = rowIndex + 2;
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `TimeEntries!A${sheetRowIndex}:K${sheetRowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [this.timeEntryToRow(updatedTimeEntryData)]
        }
      });

      // Update task hours
      await this.updateTaskHours(updatedTimeEntryData.taskId);

      return updatedTimeEntryData;
    } catch (error) {
      console.error('Error updating time entry:', error);
      return null;
    }
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'TimeEntries!A2:K'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row && row[0] === id);

      if (rowIndex === -1) {
        return false;
      }

      const existingRow = rows[rowIndex];
      const existingTimeEntry = this.rowToTimeEntry(existingRow);
      const taskId = existingTimeEntry.taskId;

      const sheetRowIndex = rowIndex + 2;
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 10, // TimeEntries sheet
                dimension: 'ROWS',
                startIndex: sheetRowIndex - 1,
                endIndex: sheetRowIndex
              }
            }
          }]
        }
      });

      // Update task hours
      await this.updateTaskHours(taskId);

      return true;
    } catch (error) {
      console.error('Error deleting time entry:', error);
      return false;
    }
  }

  // Helper methods for task management
  private async updateTaskHours(taskId: string): Promise<void> {
    try {
      const timeEntries = await this.getTimeEntriesByTask(taskId);
      const actualHours = timeEntries.reduce((total, entry) => total + (entry.duration / 60), 0);
      const billableHours = timeEntries
        .filter(entry => entry.isBillable)
        .reduce((total, entry) => total + (entry.duration / 60), 0);

      await this.updateTask(taskId, { actualHours, billableHours });
    } catch (error) {
      console.error('Error updating task hours:', error);
    }
  }

  // Row conversion methods for task management
  private rowToProject(row: string[]): Project {
    return {
      id: row[0] || '',
      name: row[1] || '',
      description: row[2] && row[2].trim() !== '' ? row[2] : undefined,
      clientId: row[3] || '',
      status: (row[4] as ProjectStatus) || 'planning',
      startDate: this.parseDate(row[5] || ''),
      endDate: row[6] && row[6].trim() !== '' ? this.parseDate(row[6]) : undefined,
      budget: row[7] && row[7].trim() !== '' ? parseFloat(row[7]) : undefined,
      hourlyRate: row[8] && row[8].trim() !== '' ? parseFloat(row[8]) : undefined,
      isActive: row[9] === 'true',
      createdAt: this.parseDate(row[10] || ''),
      updatedAt: this.parseDate(row[11] || '')
    };
  }

  private projectToRow(project: Project): string[] {
    return [
      project.id,
      project.name,
      project.description || '',
      project.clientId,
      project.status,
      project.startDate.toISOString(),
      project.endDate?.toISOString() || '',
      project.budget?.toString() || '',
      project.hourlyRate?.toString() || '',
      project.isActive.toString(),
      project.createdAt.toISOString(),
      project.updatedAt.toISOString()
    ];
  }

  private rowToTask(row: string[]): Task {
    return {
      id: row[0] || '',
      projectId: row[1] || '',
      title: row[2] || '',
      description: row[3] && row[3].trim() !== '' ? row[3] : undefined,
      status: (row[4] as TaskStatus) || 'todo',
      priority: (row[5] as TaskPriority) || 'medium',
      assignedTo: row[6] && row[6].trim() !== '' ? row[6] : undefined,
      dueDate: row[7] && row[7].trim() !== '' ? this.parseDate(row[7]) : undefined,
      estimatedHours: row[8] && row[8].trim() !== '' ? parseFloat(row[8]) : undefined,
      actualHours: parseFloat(row[9] || '0'),
      billableHours: parseFloat(row[10] || '0'),
      isBillable: row[11] === 'true',
      tags: row[12] && row[12].trim() !== '' ? JSON.parse(row[12]) : undefined,
      createdAt: this.parseDate(row[13] || ''),
      updatedAt: this.parseDate(row[14] || '')
    };
  }

  private taskToRow(task: Task): string[] {
    return [
      task.id,
      task.projectId,
      task.title,
      task.description || '',
      task.status,
      task.priority,
      task.assignedTo || '',
      task.dueDate?.toISOString() || '',
      task.estimatedHours?.toString() || '',
      task.actualHours.toString(),
      task.billableHours.toString(),
      task.isBillable.toString(),
      task.tags ? JSON.stringify(task.tags) : '',
      task.createdAt.toISOString(),
      task.updatedAt.toISOString()
    ];
  }

  private rowToTimeEntry(row: string[]): TimeEntry {
    return {
      id: row[0] || '',
      taskId: row[1] || '',
      projectId: row[2] || '',
      description: row[3] && row[3].trim() !== '' ? row[3] : undefined,
      startTime: this.parseDate(row[4] || ''),
      endTime: row[5] && row[5].trim() !== '' ? this.parseDate(row[5]) : undefined,
      duration: parseInt(row[6] || '0'),
      isBillable: row[7] === 'true',
      hourlyRate: row[8] && row[8].trim() !== '' ? parseFloat(row[8]) : undefined,
      createdAt: this.parseDate(row[9] || ''),
      updatedAt: this.parseDate(row[10] || '')
    };
  }

  private timeEntryToRow(timeEntry: TimeEntry): string[] {
    return [
      timeEntry.id,
      timeEntry.taskId,
      timeEntry.projectId,
      timeEntry.description || '',
      timeEntry.startTime.toISOString(),
      timeEntry.endTime?.toISOString() || '',
      timeEntry.duration.toString(),
      timeEntry.isBillable.toString(),
      timeEntry.hourlyRate?.toString() || '',
      timeEntry.createdAt.toISOString(),
      timeEntry.updatedAt.toISOString()
    ];
  }

  /**
   * Initialize the Google Sheets structure with all required sheets and headers
   */
  async initializeSheets(): Promise<void> {
    try {
      // Get current spreadsheet info
      const spreadsheetInfo = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const existingSheets = spreadsheetInfo.data.sheets?.map(sheet => sheet.properties?.title) || [];
      
      // Define required sheets with their headers
      const requiredSheets = [
        {
          name: 'Clients',
          headers: ['ID', 'Name', 'Email', 'Phone', 'Street', 'City', 'State', 'ZipCode', 'Country', 'CreatedAt', 'UpdatedAt']
        },
        {
          name: 'Invoices',
          headers: ['ID', 'InvoiceNumber', 'ClientID', 'TemplateID', 'Status', 'IssueDate', 'DueDate', 'Subtotal', 'TaxRate', 'TaxAmount', 'Total', 'PaidAmount', 'Balance', 'Notes', 'CreatedAt', 'UpdatedAt']
        },
        {
          name: 'LineItems',
          headers: ['ID', 'InvoiceID', 'Description', 'Quantity', 'Rate', 'Amount']
        },
        {
          name: 'Payments',
          headers: ['ID', 'InvoiceID', 'Amount', 'PaymentDate', 'PaymentMethod', 'Notes', 'CreatedAt']
        },
        {
          name: 'Settings',
          headers: ['Key', 'Value', 'UpdatedAt']
        },
        {
          name: 'Templates',
          headers: ['ID', 'Name', 'Description', 'TaxRate', 'Notes', 'IsActive', 'CreatedAt', 'UpdatedAt']
        },
        {
          name: 'TemplateLineItems',
          headers: ['ID', 'TemplateID', 'Description', 'Quantity', 'Rate', 'Amount']
        },
        {
          name: 'Projects',
          headers: ['ID', 'Name', 'Description', 'ClientID', 'Status', 'StartDate', 'EndDate', 'Budget', 'HourlyRate', 'IsActive', 'CreatedAt', 'UpdatedAt']
        },
        {
          name: 'Tasks',
          headers: ['ID', 'ProjectID', 'Title', 'Description', 'Status', 'Priority', 'AssignedTo', 'DueDate', 'EstimatedHours', 'ActualHours', 'BillableHours', 'IsBillable', 'Tags', 'CreatedAt', 'UpdatedAt']
        },
        {
          name: 'TimeEntries',
          headers: ['ID', 'TaskID', 'ProjectID', 'Description', 'StartTime', 'EndTime', 'Duration', 'IsBillable', 'HourlyRate', 'CreatedAt', 'UpdatedAt']
        }
      ];

      // Create missing sheets
      const sheetsToCreate = requiredSheets.filter(sheet => !existingSheets.includes(sheet.name));
      
      if (sheetsToCreate.length > 0) {
        const requests = sheetsToCreate.map(sheet => ({
          addSheet: {
            properties: {
              title: sheet.name
            }
          }
        }));

        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests
          }
        });

        console.log(`Created sheets: ${sheetsToCreate.map(s => s.name).join(', ')}`);
      }

      // Add headers to all sheets
      for (const sheet of requiredSheets) {
        try {
          // Check if headers already exist
          const existingData = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${sheet.name}!A1:Z1`
          });

          // If no data or headers don't match, add/update headers
          if (!existingData.data.values || existingData.data.values.length === 0 || 
              !this.arraysEqual(existingData.data.values[0], sheet.headers)) {
            
            await this.sheets.spreadsheets.values.update({
              spreadsheetId: this.spreadsheetId,
              range: `${sheet.name}!A1:${this.getColumnLetter(sheet.headers.length)}1`,
              valueInputOption: 'RAW',
              requestBody: {
                values: [sheet.headers]
              }
            });

            console.log(`Updated headers for sheet: ${sheet.name}`);
          }
        } catch (error) {
          console.warn(`Could not update headers for sheet ${sheet.name}:`, error);
        }
      }

      // Add some default settings if Settings sheet is empty
      try {
        const settingsData = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'Settings!A2:B'
        });

        if (!settingsData.data.values || settingsData.data.values.length === 0) {
          const defaultSettings = [
            ['company_name', 'Your Company Name'],
            ['company_email', 'contact@yourcompany.com'],
            ['tax_rate', '0.10'],
            ['currency', 'USD'],
            ['invoice_prefix', 'INV'],
            ['payment_terms', '30']
          ];

          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: 'Settings!A2:B7',
            valueInputOption: 'RAW',
            requestBody: {
              values: defaultSettings
            }
          });

          console.log('Added default settings');
        }
      } catch (error) {
        console.warn('Could not add default settings:', error);
      }

    } catch (error) {
      console.error('Failed to initialize sheets:', error);
      throw new GoogleSheetsError(
        `Failed to initialize Google Sheets structure: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SHEET_INITIALIZATION_ERROR',
        500,
        false
      );
    }
  }

  /**
   * Helper method to compare two arrays for equality
   */
  private arraysEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  /**
   * Helper method to convert column number to letter (1 = A, 2 = B, etc.)
   */
  private getColumnLetter(columnNumber: number): string {
    let result = '';
    while (columnNumber > 0) {
      columnNumber--;
      result = String.fromCharCode(65 + (columnNumber % 26)) + result;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
  }

  /**
   * Get basic spreadsheet information including sheet names
   */
  async getSpreadsheetInfo(): Promise<any> {
    return this.executeWithRetry(async () => {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      return response.data;
    }, 'getSpreadsheetInfo');
  }
}