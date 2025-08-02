import { GoogleDriveService, InvoiceData } from '../google-drive';

// Mock the dependencies
jest.mock('googleapis');
jest.mock('../auth');
jest.mock('next-auth');

describe('GoogleDriveService - Filename Generation', () => {
  let service: GoogleDriveService;

  beforeEach(() => {
    // Create service instance with mock token
    service = new GoogleDriveService('mock-token');
  });

  describe('generateInvoiceFileName', () => {
    it('should generate standard filename format for regular invoices', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-001',
        clientName: 'Acme Corporation',
        date: new Date('2024-01-15'),
        isRecurring: false
      };

      // Access private method for testing
      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      expect(filename).toBe('Invoice-INV-001-Acme-Corporation-2024-01-15.pdf');
    });

    it('should handle client names with special characters', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-002',
        clientName: 'Smith & Jones LLC / Partners',
        date: new Date('2024-01-15'),
        isRecurring: false
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      expect(filename).toBe('Invoice-INV-002-Smith-Jones-LLC-Partners-2024-01-15.pdf');
    });

    it('should handle client names with multiple spaces', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-003',
        clientName: 'Big    Tech   Company',
        date: new Date('2024-01-15'),
        isRecurring: false
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      expect(filename).toBe('Invoice-INV-003-Big-Tech-Company-2024-01-15.pdf');
    });

    it('should generate filename with recurring information for recurring invoices', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-004',
        clientName: 'Monthly Client',
        date: new Date('2024-01-15'),
        isRecurring: true,
        recurrenceInfo: 'Monthly'
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      expect(filename).toBe('Invoice-INV-004-Monthly-Client-2024-01-15-Recurring-Monthly.pdf');
    });

    it('should handle complex recurring information', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-005',
        clientName: 'Quarterly Client',
        date: new Date('2024-01-15'),
        isRecurring: true,
        recurrenceInfo: 'Every-3-Monthly'
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      expect(filename).toBe('Invoice-INV-005-Quarterly-Client-2024-01-15-Recurring-Every-3-Monthly.pdf');
    });

    it('should handle invoice numbers with special characters', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV/2024-001',
        clientName: 'Test Client',
        date: new Date('2024-01-15'),
        isRecurring: false
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      expect(filename).toBe('Invoice-INV2024-001-Test-Client-2024-01-15.pdf');
    });

    it('should handle very long client names by truncating', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-006',
        clientName: 'This is a very long client name that exceeds the reasonable length limit for filenames',
        date: new Date('2024-01-15'),
        isRecurring: false
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      // Should be truncated to 50 characters for the client name component
      expect(filename).toBe('Invoice-INV-006-This-is-a-very-long-client-name-that-exceeds-the-r-2024-01-15.pdf');
      expect(filename.length).toBeLessThan(200); // Reasonable total length
    });

    it('should handle edge case with empty recurrence info', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-007',
        clientName: 'Test Client',
        date: new Date('2024-01-15'),
        isRecurring: true,
        recurrenceInfo: ''
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      // Should not include recurring info if it's empty
      expect(filename).toBe('Invoice-INV-007-Test-Client-2024-01-15.pdf');
    });

    it('should handle different date formats correctly', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-008',
        clientName: 'Date Test Client',
        date: new Date('2024-12-31T23:59:59.999Z'),
        isRecurring: false
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      expect(filename).toBe('Invoice-INV-008-Date-Test-Client-2024-12-31.pdf');
    });
  });

  describe('sanitizeFileNameComponent', () => {
    it('should remove invalid filesystem characters', () => {
      const component = 'Test<>:"/\\|?*&Component';
      const sanitized = (service as any).sanitizeFileNameComponent(component);
      
      expect(sanitized).toBe('TestComponent');
    });

    it('should replace spaces with dashes', () => {
      const component = 'Test Component Name';
      const sanitized = (service as any).sanitizeFileNameComponent(component);
      
      expect(sanitized).toBe('Test-Component-Name');
    });

    it('should handle multiple consecutive spaces', () => {
      const component = 'Test    Multiple   Spaces';
      const sanitized = (service as any).sanitizeFileNameComponent(component);
      
      expect(sanitized).toBe('Test-Multiple-Spaces');
    });

    it('should remove leading and trailing dashes', () => {
      const component = '---Test Component---';
      const sanitized = (service as any).sanitizeFileNameComponent(component);
      
      expect(sanitized).toBe('Test-Component');
    });

    it('should handle multiple consecutive dashes', () => {
      const component = 'Test---Component---Name';
      const sanitized = (service as any).sanitizeFileNameComponent(component);
      
      expect(sanitized).toBe('Test-Component-Name');
    });

    it('should truncate long components', () => {
      const component = 'This is a very long component name that should be truncated to prevent overly long filenames';
      const sanitized = (service as any).sanitizeFileNameComponent(component);
      
      expect(sanitized.length).toBeLessThanOrEqual(50);
      expect(sanitized).toBe('This-is-a-very-long-component-name-that-should-be');
    });

    it('should handle empty strings', () => {
      const component = '';
      const sanitized = (service as any).sanitizeFileNameComponent(component);
      
      expect(sanitized).toBe('');
    });

    it('should handle strings with only invalid characters', () => {
      const component = '<>:"/\\|?*&';
      const sanitized = (service as any).sanitizeFileNameComponent(component);
      
      expect(sanitized).toBe('');
    });
  });

  describe('handleFileNameConflict', () => {
    it('should append timestamp when file already exists', async () => {
      // Mock the drive.files.list method to simulate existing file
      const mockList = jest.fn().mockResolvedValue({
        data: {
          files: [{ id: 'existing-file-id', name: 'Invoice-001-Client-2024-01-15.pdf' }]
        }
      });

      (service as any).drive = {
        files: { list: mockList }
      };

      const result = await (service as any).handleFileNameConflict(
        'folder-id',
        'Invoice-001-Client-2024-01-15.pdf'
      );

      expect(result).toMatch(/^Invoice-001-Client-2024-01-15-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.pdf$/);
      expect(mockList).toHaveBeenCalledWith({
        q: "name='Invoice-001-Client-2024-01-15.pdf' and parents in 'folder-id' and trashed=false",
        fields: 'files(id,name)'
      });
    });

    it('should return original filename when no conflict exists', async () => {
      // Mock the drive.files.list method to simulate no existing files
      const mockList = jest.fn().mockResolvedValue({
        data: {
          files: []
        }
      });

      (service as any).drive = {
        files: { list: mockList }
      };

      const result = await (service as any).handleFileNameConflict(
        'folder-id',
        'Invoice-001-Client-2024-01-15.pdf'
      );

      expect(result).toBe('Invoice-001-Client-2024-01-15.pdf');
    });

    it('should handle API errors gracefully', async () => {
      // Mock the drive.files.list method to throw an error
      const mockList = jest.fn().mockRejectedValue(new Error('API Error'));

      (service as any).drive = {
        files: { list: mockList }
      };

      const result = await (service as any).handleFileNameConflict(
        'folder-id',
        'Invoice-001-Client-2024-01-15.pdf'
      );

      // Should return original filename when error occurs
      expect(result).toBe('Invoice-001-Client-2024-01-15.pdf');
    });
  });
});