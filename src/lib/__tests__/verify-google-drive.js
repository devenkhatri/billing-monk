// Simple verification script for Google Drive functionality
// This tests the filename generation logic without requiring a full test framework

// Mock the GoogleDriveService class methods we want to test
class MockGoogleDriveService {
  generateInvoiceFileName(invoiceData) {
    const { invoiceNumber, clientName, date, isRecurring, recurrenceInfo } = invoiceData;
    
    // Format date as YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];
    
    // Clean client name for filename use
    const cleanClientName = clientName
      .replace(/[<>:"/\\|?*&]/g, '') // Remove invalid chars including &
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .trim();
    
    // Base filename format
    let filename = `Invoice-${invoiceNumber}-${cleanClientName}-${formattedDate}`;
    
    // Add recurring information if applicable
    if (isRecurring && recurrenceInfo) {
      filename += `-${recurrenceInfo}`;
    }
    
    return `${filename}.pdf`;
  }

  sanitizeFileName(fileName) {
    return fileName
      .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars with dash
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 255); // Limit length
  }
}

// Test cases
const service = new MockGoogleDriveService();

console.log('Testing filename generation...\n');

// Test 1: Regular invoice
const test1 = {
  invoiceNumber: 'INV-001',
  clientName: 'Test Client',
  date: new Date('2024-01-15')
};
const result1 = service.generateInvoiceFileName(test1);
console.log('Test 1 - Regular invoice:');
console.log('Expected: Invoice-INV-001-Test-Client-2024-01-15.pdf');
console.log('Actual:  ', result1);
console.log('✓ Pass:', result1 === 'Invoice-INV-001-Test-Client-2024-01-15.pdf');
console.log();

// Test 2: Recurring invoice
const test2 = {
  invoiceNumber: 'INV-002',
  clientName: 'Recurring Client',
  date: new Date('2024-02-01'),
  isRecurring: true,
  recurrenceInfo: 'Monthly'
};
const result2 = service.generateInvoiceFileName(test2);
console.log('Test 2 - Recurring invoice:');
console.log('Expected: Invoice-INV-002-Recurring-Client-2024-02-01-Monthly.pdf');
console.log('Actual:  ', result2);
console.log('✓ Pass:', result2 === 'Invoice-INV-002-Recurring-Client-2024-02-01-Monthly.pdf');
console.log();

// Test 3: Client name with special characters
const test3 = {
  invoiceNumber: 'INV-003',
  clientName: 'Client & Co. / Ltd.',
  date: new Date('2024-03-01')
};
const result3 = service.generateInvoiceFileName(test3);
console.log('Test 3 - Special characters in client name:');
console.log('Expected: Invoice-INV-003-Client-Co.-Ltd.-2024-03-01.pdf');
console.log('Actual:  ', result3);
console.log('✓ Pass:', result3 === 'Invoice-INV-003-Client-Co.-Ltd.-2024-03-01.pdf');
console.log();

// Test 4: Filename sanitization
const test4 = 'Test<>:"/\\|?*File.pdf';
const result4 = service.sanitizeFileName(test4);
console.log('Test 4 - Filename sanitization:');
console.log('Expected: Test---------File.pdf');
console.log('Actual:  ', result4);
console.log('✓ Pass:', result4 === 'Test---------File.pdf');
console.log();

// Test 5: Multiple spaces in client name
const test5 = {
  invoiceNumber: 'INV-004',
  clientName: 'Multi   Space   Client',
  date: new Date('2024-04-01')
};
const result5 = service.generateInvoiceFileName(test5);
console.log('Test 5 - Multiple spaces in client name:');
console.log('Expected: Invoice-INV-004-Multi-Space-Client-2024-04-01.pdf');
console.log('Actual:  ', result5);
console.log('✓ Pass:', result5 === 'Invoice-INV-004-Multi-Space-Client-2024-04-01.pdf');
console.log();

// Test 6: Long filename truncation
const longClientName = 'A'.repeat(300);
const test6 = `Invoice-${longClientName}.pdf`;
const result6 = service.sanitizeFileName(test6);
console.log('Test 6 - Long filename truncation:');
console.log('Expected length: 255');
console.log('Actual length:  ', result6.length);
console.log('✓ Pass:', result6.length === 255);
console.log();

console.log('All tests completed!');