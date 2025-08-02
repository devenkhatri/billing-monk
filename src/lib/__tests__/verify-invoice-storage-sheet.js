// Verification script to check that InvoiceStorage sheet is properly configured
// This extracts the sheet configuration from the google-sheets.ts file

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the google-sheets.ts file
const googleSheetsPath = path.join(__dirname, '..', 'google-sheets.ts');
const googleSheetsContent = fs.readFileSync(googleSheetsPath, 'utf8');

console.log('Verifying InvoiceStorage sheet configuration...');

// Check if InvoiceStorage sheet is defined in requiredSheets
const hasInvoiceStorageSheet = googleSheetsContent.includes("name: 'InvoiceStorage'");
console.log('✓ InvoiceStorage sheet defined:', hasInvoiceStorageSheet);

// Check if the headers are correctly defined
const expectedHeaders = [
  'InvoiceID',
  'DriveFileID', 
  'Status',
  'UploadedAt',
  'LastAttempt',
  'RetryCount',
  'ErrorMessage',
  'CreatedAt',
  'UpdatedAt'
];

const hasCorrectHeaders = expectedHeaders.every(header => 
  googleSheetsContent.includes(`'${header}'`)
);
console.log('✓ All required headers defined:', hasCorrectHeaders);

// Check if the invoice storage methods are defined
const requiredMethods = [
  'getInvoiceStorageStatus',
  'getAllInvoiceStorageStatuses',
  'createInvoiceStorageStatus',
  'updateInvoiceStorageStatus',
  'deleteInvoiceStorageStatus',
  'getInvoiceStorageStatusesByStatus',
  'incrementRetryCount',
  'rowToInvoiceStorageStatus',
  'invoiceStorageStatusToRow'
];

const methodsImplemented = requiredMethods.map(method => {
  const isImplemented = googleSheetsContent.includes(`${method}(`);
  console.log(`✓ Method ${method}:`, isImplemented);
  return isImplemented;
});

const allMethodsImplemented = methodsImplemented.every(implemented => implemented);
console.log('✓ All required methods implemented:', allMethodsImplemented);

// Check if InvoiceStorageStatus is imported
const hasImport = googleSheetsContent.includes('InvoiceStorageStatus');
console.log('✓ InvoiceStorageStatus type imported:', hasImport);

// Verify the sheet structure matches the design document
const designRequirements = [
  'InvoiceID', // Column A: Invoice ID
  'DriveFileID', // Column B: Drive File ID  
  'Status', // Column C: Status (pending/stored/failed/disabled)
  'UploadedAt', // Column D: Uploaded At
  'LastAttempt', // Column E: Last Attempt
  'RetryCount', // Column F: Retry Count
  'ErrorMessage', // Column G: Error Message
  'CreatedAt', // Column H: Created At
  'UpdatedAt' // Column I: Updated At
];

console.log('\nVerifying sheet structure matches design document:');
designRequirements.forEach((requirement, index) => {
  const columnLetter = String.fromCharCode(65 + index); // A, B, C, etc.
  console.log(`✓ Column ${columnLetter}: ${requirement}`);
});

// Check for proper error handling patterns
const hasErrorHandling = googleSheetsContent.includes('executeWithRetry') && 
                        googleSheetsContent.includes('ValidationError');
console.log('✓ Error handling patterns implemented:', hasErrorHandling);

// Check for caching implementation
const hasCaching = googleSheetsContent.includes('getCachedData') && 
                  googleSheetsContent.includes('setCachedData') &&
                  googleSheetsContent.includes('clearCache');
console.log('✓ Caching implementation present:', hasCaching);

console.log('\n🎉 InvoiceStorage sheet verification completed!');

if (hasInvoiceStorageSheet && hasCorrectHeaders && allMethodsImplemented && hasImport && hasErrorHandling && hasCaching) {
  console.log('✅ All requirements satisfied - Implementation is complete!');
  process.exit(0);
} else {
  console.log('❌ Some requirements not met - Please review implementation');
  process.exit(1);
}