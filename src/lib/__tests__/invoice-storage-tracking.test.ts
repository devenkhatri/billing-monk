import { GoogleSheetsService } from '../google-sheets';
import { InvoiceStorageStatus } from '@/types';

// Mock the Google Sheets API
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn()
      })),
      GoogleAuth: jest.fn().mockImplementation(() => ({
        getClient: jest.fn().mockResolvedValue({})
      }))
    },
    sheets: jest.fn().mockImplementation(() => ({
      spreadsheets: {
        get: jest.fn(),
        values: {
          get: jest.fn(),
          append: jest.fn(),
          update: jest.fn()
        },
        batchUpdate: jest.fn()
      }
    }))
  }
}));

describe('Invoice Storage Status Tracking', () => {
  let service: GoogleSheetsService;
  let mockSheets: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create service instance
    service = new GoogleSheetsService('mock-token', 'mock-spreadsheet-id');
    
    // Get mock sheets instance
    mockSheets = (service as any).sheets;
  });

  describe('createInvoiceStorageStatus', () => {
    it('should create a new invoice storage status', async () => {
      const mockStatus: Omit<InvoiceStorageStatus, 'retryCount'> = {
        invoiceId: 'inv-123',
        status: 'pending'
      };

      mockSheets.spreadsheets.values.append.mockResolvedValue({});

      const result = await service.createInvoiceStorageStatus(mockStatus);

      expect(result).toEqual({
        ...mockStatus,
        retryCount: 0
      });

      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledWith({
        spreadsheetId: 'mock-spreadsheet-id',
        range: 'InvoiceStorage!A:I',
        valueInputOption: 'RAW',
        requestBody: {
          values: [expect.arrayContaining(['inv-123', '', 'pending'])]
        }
      });
    });

    it('should create status with all fields populated', async () => {
      const now = new Date();
      const mockStatus: Omit<InvoiceStorageStatus, 'retryCount'> = {
        invoiceId: 'inv-456',
        driveFileId: 'drive-file-123',
        status: 'stored',
        uploadedAt: now,
        lastAttempt: now,
        errorMessage: undefined
      };

      mockSheets.spreadsheets.values.append.mockResolvedValue({});

      const result = await service.createInvoiceStorageStatus(mockStatus);

      expect(result).toEqual({
        ...mockStatus,
        retryCount: 0
      });
    });
  });

  describe('getInvoiceStorageStatus', () => {
    it('should return null when status not found', async () => {
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: [] }
      });

      const result = await service.getInvoiceStorageStatus('non-existent');

      expect(result).toBeNull();
    });

    it('should return status when found', async () => {
      const mockRow = [
        'inv-123',
        'drive-file-123',
        'stored',
        '2024-01-01T00:00:00.000Z',
        '2024-01-01T00:00:00.000Z',
        '2',
        'Some error',
        '2024-01-01T00:00:00.000Z',
        '2024-01-01T00:00:00.000Z'
      ];

      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: [mockRow] }
      });

      const result = await service.getInvoiceStorageStatus('inv-123');

      expect(result).toEqual({
        invoiceId: 'inv-123',
        driveFileId: 'drive-file-123',
        status: 'stored',
        uploadedAt: new Date('2024-01-01T00:00:00.000Z'),
        lastAttempt: new Date('2024-01-01T00:00:00.000Z'),
        retryCount: 2,
        errorMessage: 'Some error'
      });
    });
  });

  describe('updateInvoiceStorageStatus', () => {
    it('should update existing status', async () => {
      const existingRow = [
        'inv-123',
        '',
        'pending',
        '',
        '',
        '0',
        '',
        '2024-01-01T00:00:00.000Z',
        '2024-01-01T00:00:00.000Z'
      ];

      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: [existingRow] }
      });

      mockSheets.spreadsheets.values.update.mockResolvedValue({});

      const updates = {
        status: 'stored' as const,
        driveFileId: 'drive-file-123',
        uploadedAt: new Date('2024-01-02T00:00:00.000Z')
      };

      const result = await service.updateInvoiceStorageStatus('inv-123', updates);

      expect(result).toEqual({
        invoiceId: 'inv-123',
        driveFileId: 'drive-file-123',
        status: 'stored',
        uploadedAt: new Date('2024-01-02T00:00:00.000Z'),
        lastAttempt: undefined,
        retryCount: 0,
        errorMessage: undefined
      });

      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: 'mock-spreadsheet-id',
        range: 'InvoiceStorage!A2:I2',
        valueInputOption: 'RAW',
        requestBody: {
          values: [expect.arrayContaining(['inv-123', 'drive-file-123', 'stored'])]
        }
      });
    });
  });

  describe('incrementRetryCount', () => {
    it('should increment retry count and update last attempt', async () => {
      const existingRow = [
        'inv-123',
        '',
        'pending',
        '',
        '',
        '1',
        'Network error',
        '2024-01-01T00:00:00.000Z',
        '2024-01-01T00:00:00.000Z'
      ];

      // Mock getInvoiceStorageStatus call
      mockSheets.spreadsheets.values.get
        .mockResolvedValueOnce({
          data: { values: [existingRow] }
        })
        // Mock updateInvoiceStorageStatus call
        .mockResolvedValueOnce({
          data: { values: [existingRow] }
        });

      mockSheets.spreadsheets.values.update.mockResolvedValue({});

      const result = await service.incrementRetryCount('inv-123');

      expect(result).toEqual({
        invoiceId: 'inv-123',
        driveFileId: undefined,
        status: 'pending',
        uploadedAt: undefined,
        lastAttempt: expect.any(Date),
        retryCount: 2,
        errorMessage: 'Network error'
      });
    });

    it('should return null when status not found', async () => {
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: [] }
      });

      const result = await service.incrementRetryCount('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getInvoiceStorageStatusesByStatus', () => {
    it('should filter statuses by status type', async () => {
      const mockRows = [
        ['inv-1', '', 'pending', '', '', '0', '', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'],
        ['inv-2', 'file-2', 'stored', '2024-01-01T00:00:00.000Z', '', '0', '', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'],
        ['inv-3', '', 'failed', '', '2024-01-01T00:00:00.000Z', '3', 'Upload failed', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z']
      ];

      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockRows }
      });

      const result = await service.getInvoiceStorageStatusesByStatus('pending');

      expect(result).toHaveLength(1);
      expect(result[0].invoiceId).toBe('inv-1');
      expect(result[0].status).toBe('pending');
    });
  });
});