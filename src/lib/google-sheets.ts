import { google, sheets_v4 } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { Client, CreateClientData } from '@/types';
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
}