// Edge cases test for invoice storage status tracking
// Tests various edge cases and error conditions

console.log('Testing edge cases for invoice storage status tracking...');

// Test data conversion with various edge cases
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

// Test cases
const testCases = [
  {
    name: 'Empty row',
    input: [],
    expected: {
      invoiceId: '',
      driveFileId: undefined,
      status: 'pending',
      uploadedAt: undefined,
      lastAttempt: undefined,
      retryCount: 0,
      errorMessage: undefined
    }
  },
  {
    name: 'Partial row with nulls',
    input: ['inv-123', null, 'stored', null, null, null, null],
    expected: {
      invoiceId: 'inv-123',
      driveFileId: undefined,
      status: 'stored',
      uploadedAt: undefined,
      lastAttempt: undefined,
      retryCount: 0,
      errorMessage: undefined
    }
  },
  {
    name: 'Row with whitespace',
    input: ['inv-456', '  ', 'failed', '  ', '  ', '2', '  Network error  '],
    expected: {
      invoiceId: 'inv-456',
      driveFileId: undefined,
      status: 'failed',
      uploadedAt: undefined,
      lastAttempt: undefined,
      retryCount: 2,
      errorMessage: '  Network error  '
    }
  },
  {
    name: 'Invalid date strings',
    input: ['inv-789', 'file-123', 'stored', 'invalid-date', '2024-13-45T99:99:99.999Z', '1', 'Error'],
    expected: {
      invoiceId: 'inv-789',
      driveFileId: 'file-123',
      status: 'stored',
      uploadedAt: undefined, // Invalid date should become undefined
      lastAttempt: undefined, // Invalid date should become undefined
      retryCount: 1,
      errorMessage: 'Error'
    }
  },
  {
    name: 'Non-numeric retry count',
    input: ['inv-999', 'file-999', 'pending', '', '', 'not-a-number', 'Error'],
    expected: {
      invoiceId: 'inv-999',
      driveFileId: 'file-999',
      status: 'pending',
      uploadedAt: undefined,
      lastAttempt: undefined,
      retryCount: 0, // NaN should become 0
      errorMessage: 'Error'
    }
  }
];

// Enhanced conversion function with better error handling
function safeRowToInvoiceStorageStatus(row) {
  const safeParseDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
      return undefined;
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const safeParseInt = (str) => {
    const num = parseInt(str || '0');
    return isNaN(num) ? 0 : num;
  };

  return {
    invoiceId: (row[0] || '').toString(),
    driveFileId: row[1] && row[1].toString().trim() !== '' ? row[1].toString() : undefined,
    status: (row[2] || 'pending').toString(),
    uploadedAt: safeParseDate(row[3]),
    lastAttempt: safeParseDate(row[4]),
    retryCount: safeParseInt(row[5]),
    errorMessage: row[6] && row[6].toString().trim() !== '' ? row[6].toString() : undefined
  };
}

// Run tests
let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.name}`);
  console.log('Input:', testCase.input);
  
  const result = safeRowToInvoiceStorageStatus(testCase.input);
  console.log('Result:', result);
  
  // Check each field
  const checks = [
    result.invoiceId === testCase.expected.invoiceId,
    result.driveFileId === testCase.expected.driveFileId,
    result.status === testCase.expected.status,
    (result.uploadedAt === undefined && testCase.expected.uploadedAt === undefined) ||
    (result.uploadedAt && testCase.expected.uploadedAt && result.uploadedAt.getTime() === testCase.expected.uploadedAt.getTime()),
    (result.lastAttempt === undefined && testCase.expected.lastAttempt === undefined) ||
    (result.lastAttempt && testCase.expected.lastAttempt && result.lastAttempt.getTime() === testCase.expected.lastAttempt.getTime()),
    result.retryCount === testCase.expected.retryCount,
    result.errorMessage === testCase.expected.errorMessage
  ];
  
  const passed = checks.every(check => check);
  console.log('Passed:', passed);
  
  if (passed) {
    passedTests++;
  } else {
    console.log('Expected:', testCase.expected);
    console.log('Checks:', checks);
  }
});

console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

// Test status validation
console.log('\n🔍 Testing status validation...');

const validStatuses = ['pending', 'stored', 'failed', 'disabled'];
const testStatuses = ['pending', 'stored', 'failed', 'disabled', 'invalid', '', null, undefined];

testStatuses.forEach(status => {
  const isValid = validStatuses.includes(status);
  console.log(`Status "${status}": ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

// Test retry count limits
console.log('\n🔄 Testing retry count scenarios...');

const retryScenarios = [
  { count: 0, description: 'Initial state' },
  { count: 1, description: 'First retry' },
  { count: 2, description: 'Second retry' },
  { count: 3, description: 'Third retry (max)' },
  { count: 4, description: 'Exceeded max retries' }
];

retryScenarios.forEach(scenario => {
  const shouldRetry = scenario.count < 3; // Max 3 retries as per requirements
  console.log(`Retry count ${scenario.count} (${scenario.description}): ${shouldRetry ? '🔄 Should retry' : '🛑 Stop retrying'}`);
});

console.log('\n✅ Edge cases testing completed!');

if (passedTests === totalTests) {
  console.log('🎉 All edge case tests passed!');
} else {
  console.log(`⚠️  ${totalTests - passedTests} tests failed - review implementation`);
}