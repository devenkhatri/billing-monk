#!/usr/bin/env node

/**
 * Test script to verify quota improvements
 * Run with: node scripts/test-quota-improvements.js
 */

const { GoogleSheetsService } = require('../src/lib/google-sheets');

async function testQuotaImprovements() {
  console.log('🧪 Testing Google Sheets quota improvements...\n');

  try {
    // Test 1: Multiple service instances should share initialization
    console.log('Test 1: Multiple service instances...');
    const service1 = await GoogleSheetsService.getAuthenticatedService();
    const service2 = await GoogleSheetsService.getAuthenticatedService();
    
    const start1 = Date.now();
    await Promise.all([
      service1.getCompanySettings(),
      service2.getCompanySettings()
    ]);
    const time1 = Date.now() - start1;
    console.log(`✅ Multiple instances completed in ${time1}ms\n`);

    // Test 2: Rapid successive calls should be cached
    console.log('Test 2: Rapid successive calls (should use cache)...');
    const start2 = Date.now();
    await Promise.all([
      service1.getCompanySettings(),
      service1.getCompanySettings(),
      service1.getCompanySettings()
    ]);
    const time2 = Date.now() - start2;
    console.log(`✅ Cached calls completed in ${time2}ms\n`);

    // Test 3: Rate limiting test
    console.log('Test 3: Rate limiting test...');
    const start3 = Date.now();
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(service1.getClients());
    }
    await Promise.all(promises);
    const time3 = Date.now() - start3;
    console.log(`✅ Rate limited calls completed in ${time3}ms\n`);

    // Test 4: Health check
    console.log('Test 4: Health check...');
    const healthStart = Date.now();
    const healthResponse = await fetch('http://localhost:3000/api/sheets/health');
    const healthData = await healthResponse.json();
    const healthTime = Date.now() - healthStart;
    
    console.log(`✅ Health check: ${healthData.status} (${healthTime}ms)`);
    if (healthData.responseTime) {
      console.log(`   API Response Time: ${healthData.responseTime}`);
    }
    if (healthData.error) {
      console.log(`   Error: ${healthData.error}`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Performance Summary:');
    console.log(`   Multiple instances: ${time1}ms`);
    console.log(`   Cached calls: ${time2}ms`);
    console.log(`   Rate limited calls: ${time3}ms`);
    console.log(`   Health check: ${healthTime}ms`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('quota exceeded') || error.message.includes('Quota exceeded')) {
      console.log('\n💡 Quota exceeded detected. This is expected during testing.');
      console.log('   The improvements should reduce the frequency of this error.');
      console.log('   Wait 1-2 minutes and try again.');
    }
    
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testQuotaImprovements().catch(console.error);
}

module.exports = { testQuotaImprovements };