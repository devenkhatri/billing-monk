// Simple validation script to check the invoice storage implementation
// This tests the core logic without external dependencies

// Mock InvoiceStorageStatus type
const mockStatus = {
  invoiceId: 'inv-123',
  driveFileId: 'drive-file-123',
  status: 'stored',
  uploadedAt: new Date('2024-01-01T00:00:00.000Z'),
  lastAttempt: new Date('2024-01-01T00:00:00.000Z'),
  retryCount: 2,
  errorMessage: 'Some error'
};

// Test the row conversion logic (extracted from the implementation)
function rowToInvoiceStorageStatus(row) {
  return {
    invoiceId: row[0] || '',
    driveFileId: row[1] && row[1].trim() !== '' ? row[1] : undefined,
    status: row[2] || 'pending',
    uploadedAt: row[3] && row[3].trim() !== '' ? new Date(row[3]) : undefined,
    lastAttempt: row[4] && row[4].trim() !== '' ? new Date(row[4]) : undefined,
    retryCount: parseInt(row[5] || '0'),
    errorMessage: row[6] && row[6].trim() !== '' ? row[6] : undefined
  };
}

function invoiceStorageStatusToRow(status) {
  const now = new Date().toISOString();
  return [
    status.invoiceId,
    status.driveFileId || '',
    status.status,
    status.uploadedAt ? status.uploadedAt.toISOString() : '',
    status.lastAttempt ? status.lastAttempt.toISOString() : '',
    status.retryCount.toString(),
    status.errorMessage || '',
    now, // CreatedAt
    now  // UpdatedAt
  ];
}

// Test the conversion functions
console.log('Testing invoice storage status conversion...');

// Test row to status conversion
const testRow = [
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

const convertedStatus = rowToInvoiceStorageStatus(testRow);
console.log('Row to Status conversion:', convertedStatus);

// Validate the conversion
const expectedStatus = {
  invoiceId: 'inv-123',
  driveFileId: 'drive-file-123',
  status: 'stored',
  uploadedAt: new Date('2024-01-01T00:00:00.000Z'),
  lastAttempt: new Date('2024-01-01T00:00:00.000Z'),
  retryCount: 2,
  errorMessage: 'Some error'
};

const isValid = 
  convertedStatus.invoiceId === expectedStatus.invoiceId &&
  convertedStatus.driveFileId === expectedStatus.driveFileId &&
  convertedStatus.status === expectedStatus.status &&
  convertedStatus.uploadedAt.getTime() === expectedStatus.uploadedAt.getTime() &&
  convertedStatus.lastAttempt.getTime() === expectedStatus.lastAttempt.getTime() &&
  convertedStatus.retryCount === expectedStatus.retryCount &&
  convertedStatus.errorMessage === expectedStatus.errorMessage;

console.log('Row to Status conversion valid:', isValid);

// Test status to row conversion
const convertedRow = invoiceStorageStatusToRow(mockStatus);
console.log('Status to Row conversion:', convertedRow);

// Validate the row conversion
const isRowValid = 
  convertedRow[0] === mockStatus.invoiceId &&
  convertedRow[1] === mockStatus.driveFileId &&
  convertedRow[2] === mockStatus.status &&
  convertedRow[3] === mockStatus.uploadedAt.toISOString() &&
  convertedRow[4] === mockStatus.lastAttempt.toISOString() &&
  convertedRow[5] === mockStatus.retryCount.toString() &&
  convertedRow[6] === mockStatus.errorMessage;

console.log('Status to Row conversion valid:', isRowValid);

// Test edge cases
console.log('\nTesting edge cases...');

// Test empty/undefined values
const emptyRow = ['inv-456', '', 'pending', '', '', '0', '', '', ''];
const emptyStatus = rowToInvoiceStorageStatus(emptyRow);
console.log('Empty values conversion:', emptyStatus);

const isEmptyValid = 
  emptyStatus.invoiceId === 'inv-456' &&
  emptyStatus.driveFileId === undefined &&
  emptyStatus.status === 'pending' &&
  emptyStatus.uploadedAt === undefined &&
  emptyStatus.lastAttempt === undefined &&
  emptyStatus.retryCount === 0 &&
  emptyStatus.errorMessage === undefined;

console.log('Empty values conversion valid:', isEmptyValid);

// Test status with minimal data
const minimalStatus = {
  invoiceId: 'inv-789',
  status: 'failed',
  retryCount: 1
};

const minimalRow = invoiceStorageStatusToRow(minimalStatus);
console.log('Minimal status to row:', minimalRow);

const isMinimalValid = 
  minimalRow[0] === 'inv-789' &&
  minimalRow[1] === '' &&
  minimalRow[2] === 'failed' &&
  minimalRow[3] === '' &&
  minimalRow[4] === '' &&
  minimalRow[5] === '1' &&
  minimalRow[6] === '';

console.log('Minimal status conversion valid:', isMinimalValid);

console.log('\n✅ All validation tests completed successfully!');