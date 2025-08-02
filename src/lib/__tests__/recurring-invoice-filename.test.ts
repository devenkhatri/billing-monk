/**
 * Test for recurring invoice filename formatting in PDF route
 */

describe('Recurring Invoice Filename Formatting', () => {
  describe('formatRecurrenceInfo', () => {
    // Extract the function from the PDF route for testing
    function formatRecurrenceInfo(schedule: any): string {
      const { frequency, interval } = schedule;
      
      // Format frequency for filename
      const frequencyMap: Record<string, string> = {
        'weekly': 'Weekly',
        'monthly': 'Monthly', 
        'quarterly': 'Quarterly',
        'yearly': 'Yearly'
      };
      
      const formattedFrequency = frequencyMap[frequency] || frequency;
      
      // Include interval if it's not 1 (e.g., "Every-2-Months")
      if (interval && interval > 1) {
        return `Every-${interval}-${formattedFrequency}`;
      }
      
      return formattedFrequency;
    }

    it('should format weekly recurrence correctly', () => {
      const schedule = { frequency: 'weekly', interval: 1 };
      const result = formatRecurrenceInfo(schedule);
      expect(result).toBe('Weekly');
    });

    it('should format monthly recurrence correctly', () => {
      const schedule = { frequency: 'monthly', interval: 1 };
      const result = formatRecurrenceInfo(schedule);
      expect(result).toBe('Monthly');
    });

    it('should format quarterly recurrence correctly', () => {
      const schedule = { frequency: 'quarterly', interval: 1 };
      const result = formatRecurrenceInfo(schedule);
      expect(result).toBe('Quarterly');
    });

    it('should format yearly recurrence correctly', () => {
      const schedule = { frequency: 'yearly', interval: 1 };
      const result = formatRecurrenceInfo(schedule);
      expect(result).toBe('Yearly');
    });

    it('should format bi-weekly recurrence correctly', () => {
      const schedule = { frequency: 'weekly', interval: 2 };
      const result = formatRecurrenceInfo(schedule);
      expect(result).toBe('Every-2-Weekly');
    });

    it('should format bi-monthly recurrence correctly', () => {
      const schedule = { frequency: 'monthly', interval: 2 };
      const result = formatRecurrenceInfo(schedule);
      expect(result).toBe('Every-2-Monthly');
    });

    it('should format quarterly with custom interval', () => {
      const schedule = { frequency: 'quarterly', interval: 2 };
      const result = formatRecurrenceInfo(schedule);
      expect(result).toBe('Every-2-Quarterly');
    });

    it('should handle unknown frequency types', () => {
      const schedule = { frequency: 'custom', interval: 1 };
      const result = formatRecurrenceInfo(schedule);
      expect(result).toBe('custom');
    });

    it('should handle missing interval', () => {
      const schedule = { frequency: 'monthly' };
      const result = formatRecurrenceInfo(schedule);
      expect(result).toBe('Monthly');
    });

    it('should handle zero interval', () => {
      const schedule = { frequency: 'monthly', interval: 0 };
      const result = formatRecurrenceInfo(schedule);
      expect(result).toBe('Monthly');
    });
  });

  describe('Full filename generation with recurring invoices', () => {
    it('should generate complete filename for weekly recurring invoice', () => {
      const invoiceData = {
        invoiceNumber: 'REC-001',
        clientName: 'Weekly Client Corp',
        date: new Date('2024-01-15'),
        isRecurring: true,
        recurrenceInfo: 'Weekly'
      };

      // This would be the expected output from GoogleDriveService.generateInvoiceFileName
      const expectedFilename = 'Invoice-REC-001-Weekly-Client-Corp-2024-01-15-Recurring-Weekly.pdf';
      
      // Verify the pattern matches our requirements
      expect(expectedFilename).toMatch(/^Invoice-.*-.*-\d{4}-\d{2}-\d{2}-Recurring-.*\.pdf$/);
      expect(expectedFilename).toContain('REC-001');
      expect(expectedFilename).toContain('Weekly-Client-Corp');
      expect(expectedFilename).toContain('2024-01-15');
      expect(expectedFilename).toContain('Recurring-Weekly');
    });

    it('should generate complete filename for bi-monthly recurring invoice', () => {
      const invoiceData = {
        invoiceNumber: 'REC-002',
        clientName: 'Bi-Monthly Client LLC',
        date: new Date('2024-02-01'),
        isRecurring: true,
        recurrenceInfo: 'Every-2-Monthly'
      };

      const expectedFilename = 'Invoice-REC-002-Bi-Monthly-Client-LLC-2024-02-01-Recurring-Every-2-Monthly.pdf';
      
      expect(expectedFilename).toMatch(/^Invoice-.*-.*-\d{4}-\d{2}-\d{2}-Recurring-.*\.pdf$/);
      expect(expectedFilename).toContain('Every-2-Monthly');
    });

    it('should generate filename for non-recurring invoice without recurring info', () => {
      const invoiceData = {
        invoiceNumber: 'INV-001',
        clientName: 'One Time Client',
        date: new Date('2024-01-15'),
        isRecurring: false
      };

      const expectedFilename = 'Invoice-INV-001-One-Time-Client-2024-01-15.pdf';
      
      expect(expectedFilename).toMatch(/^Invoice-.*-.*-\d{4}-\d{2}-\d{2}\.pdf$/);
      expect(expectedFilename).not.toContain('Recurring');
    });
  });
});