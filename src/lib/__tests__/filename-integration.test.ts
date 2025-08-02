/**
 * Integration test for filename generation with Google Drive service
 */

import { GoogleDriveService, InvoiceData } from '../google-drive';

// Mock the dependencies
jest.mock('googleapis');
jest.mock('../auth');
jest.mock('next-auth');

describe('Filename Generation Integration', () => {
  let service: GoogleDriveService;

  beforeEach(() => {
    service = new GoogleDriveService('mock-token');
  });

  describe('End-to-end filename generation scenarios', () => {
    it('should handle complete invoice data for regular invoice', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-2024-001',
        clientName: 'Acme Corporation & Associates',
        date: new Date('2024-01-15T10:30:00Z'),
        isRecurring: false
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      expect(filename).toBe('Invoice-INV-2024-001-Acme-Corporation-Associates-2024-01-15.pdf');
    });

    it('should handle complete invoice data for weekly recurring invoice', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'REC-W-001',
        clientName: 'Weekly Service Client',
        date: new Date('2024-01-15T10:30:00Z'),
        isRecurring: true,
        recurrenceInfo: 'Weekly'
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      expect(filename).toBe('Invoice-REC-W-001-Weekly-Service-Client-2024-01-15-Recurring-Weekly.pdf');
    });

    it('should handle complete invoice data for bi-monthly recurring invoice', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'REC-BM-002',
        clientName: 'Bi-Monthly Consulting LLC',
        date: new Date('2024-02-01T14:45:00Z'),
        isRecurring: true,
        recurrenceInfo: 'Every-2-Monthly'
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      expect(filename).toBe('Invoice-REC-BM-002-Bi-Monthly-Consulting-LLC-2024-02-01-Recurring-Every-2-Monthly.pdf');
    });

    it('should handle edge cases with special characters in all fields', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV/2024\\001',
        clientName: 'Smith & Jones: "The Best" Company <LLC>',
        date: new Date('2024-12-31T23:59:59Z'),
        isRecurring: true,
        recurrenceInfo: 'Every-3-Monthly'
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      expect(filename).toBe('Invoice-INV2024001-Smith-Jones-The-Best-Company-LLC-2024-12-31-Recurring-Every-3-Monthly.pdf');
    });

    it('should handle very long names by truncating appropriately', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'VERY-LONG-INVOICE-NUMBER-2024-001',
        clientName: 'This is an extremely long client name that should be truncated to prevent filesystem issues',
        date: new Date('2024-06-15T12:00:00Z'),
        isRecurring: true,
        recurrenceInfo: 'Quarterly-With-Very-Long-Description'
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      // Verify the filename is reasonable length and properly formatted
      expect(filename.length).toBeLessThan(200);
      expect(filename).toMatch(/^Invoice-.*-.*-2024-06-15-Recurring-.*\.pdf$/);
      expect(filename).toContain('VERY-LONG-INVOICE-NUMBER-2024-001');
    });

    it('should handle recurring invoice with empty recurrence info gracefully', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-003',
        clientName: 'Test Client',
        date: new Date('2024-03-15T09:00:00Z'),
        isRecurring: true,
        recurrenceInfo: ''
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      // Should not include recurring info if it's empty
      expect(filename).toBe('Invoice-INV-003-Test-Client-2024-03-15.pdf');
      expect(filename).not.toContain('Recurring');
    });

    it('should handle undefined recurrence info for recurring invoice', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-004',
        clientName: 'Another Test Client',
        date: new Date('2024-04-15T16:30:00Z'),
        isRecurring: true,
        recurrenceInfo: undefined
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      // Should not include recurring info if it's undefined
      expect(filename).toBe('Invoice-INV-004-Another-Test-Client-2024-04-15.pdf');
      expect(filename).not.toContain('Recurring');
    });
  });

  describe('Filename validation against requirements', () => {
    it('should meet requirement 6.1: standardized format', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-001',
        clientName: 'Test Client',
        date: new Date('2024-01-15'),
        isRecurring: false
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      // Requirement 6.1: Format should be "Invoice-{invoice_number}-{client_name}-{date}.pdf"
      expect(filename).toMatch(/^Invoice-.+-.*-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should meet requirement 6.2: sanitize invalid characters', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV<>:"/\\|?*001',
        clientName: 'Client<>:"/\\|?*Name',
        date: new Date('2024-01-15'),
        isRecurring: false
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      // Requirement 6.2: Should not contain invalid filesystem characters
      expect(filename).not.toMatch(/[<>:"/\\|?*]/);
      expect(filename).toBe('Invoice-INV001-ClientName-2024-01-15.pdf');
    });

    it('should meet requirement 6.4: include recurrence information', () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: 'REC-001',
        clientName: 'Recurring Client',
        date: new Date('2024-01-15'),
        isRecurring: true,
        recurrenceInfo: 'Monthly'
      };

      const filename = (service as any).generateInvoiceFileName(invoiceData);
      
      // Requirement 6.4: Should include recurrence information for recurring invoices
      expect(filename).toContain('Recurring');
      expect(filename).toContain('Monthly');
      expect(filename).toBe('Invoice-REC-001-Recurring-Client-2024-01-15-Recurring-Monthly.pdf');
    });

    it('should handle filename conflicts with timestamp appending', async () => {
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

      // Requirement 6.3: Should append timestamp to avoid conflicts
      expect(result).toMatch(/^Invoice-001-Client-2024-01-15-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.pdf$/);
    });
  });

  describe('Real-world scenarios', () => {
    const realWorldScenarios = [
      {
        name: 'Consulting company with monthly retainer',
        data: {
          invoiceNumber: 'CONS-2024-001',
          clientName: 'TechStart Inc.',
          date: new Date('2024-01-01'),
          isRecurring: true,
          recurrenceInfo: 'Monthly'
        },
        expected: 'Invoice-CONS-2024-001-TechStart-Inc-2024-01-01-Recurring-Monthly.pdf'
      },
      {
        name: 'Freelancer with project-based invoice',
        data: {
          invoiceNumber: 'PROJ-WEB-001',
          clientName: 'Local Restaurant & Bar',
          date: new Date('2024-02-15'),
          isRecurring: false
        },
        expected: 'Invoice-PROJ-WEB-001-Local-Restaurant-Bar-2024-02-15.pdf'
      },
      {
        name: 'SaaS company with quarterly billing',
        data: {
          invoiceNumber: 'SAAS-Q1-2024',
          clientName: 'Enterprise Corp (Global)',
          date: new Date('2024-03-31'),
          isRecurring: true,
          recurrenceInfo: 'Quarterly'
        },
        expected: 'Invoice-SAAS-Q1-2024-Enterprise-Corp-Global-2024-03-31-Recurring-Quarterly.pdf'
      },
      {
        name: 'Service provider with bi-weekly billing',
        data: {
          invoiceNumber: 'SVC-BW-001',
          clientName: 'Manufacturing Co.',
          date: new Date('2024-04-15'),
          isRecurring: true,
          recurrenceInfo: 'Every-2-Weekly'
        },
        expected: 'Invoice-SVC-BW-001-Manufacturing-Co-2024-04-15-Recurring-Every-2-Weekly.pdf'
      }
    ];

    realWorldScenarios.forEach(scenario => {
      it(`should handle ${scenario.name}`, () => {
        const filename = (service as any).generateInvoiceFileName(scenario.data);
        expect(filename).toBe(scenario.expected);
      });
    });
  });
});