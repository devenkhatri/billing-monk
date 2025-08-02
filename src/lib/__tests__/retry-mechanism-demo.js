// Demo script to show retry mechanism functionality
// This is a simplified demonstration of the retry logic

class MockGoogleDriveService {
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 8000,
      backoffMultiplier: 2
    };
  }

  async executeWithRetry(operation, operationName, retryable = true) {
    let lastError;
    let attempt = 0;

    while (attempt <= this.retryConfig.maxRetries) {
      try {
        console.log(`🔄 Attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1} for ${operationName}`);
        return await operation();
      } catch (error) {
        lastError = error;
        attempt++;

        // Simulate error parsing
        const isRetryable = retryable && (
          error.code === 'NETWORK_ERROR' || 
          error.code === 'QUOTA_ERROR' ||
          error.code === 'SERVER_ERROR'
        );

        if (!isRetryable || attempt > this.retryConfig.maxRetries) {
          console.log(`❌ ${operationName} failed permanently: ${error.message}`);
          throw error;
        }

        // Calculate delay with exponential backoff
        let delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelay
        );

        // Add jitter for quota errors
        if (error.code === 'QUOTA_ERROR') {
          delay = delay * (1 + Math.random() * 0.5);
        }

        console.log(`⏳ ${operationName} failed (attempt ${attempt}/${this.retryConfig.maxRetries + 1}), retrying in ${Math.round(delay)}ms: ${error.message}`);
        
        // Simulate delay (shortened for demo)
        await new Promise(resolve => setTimeout(resolve, delay / 10)); // Speed up for demo
      }
    }

    throw lastError;
  }

  async simulateNetworkErrorThenSuccess() {
    let attemptCount = 0;
    
    return this.executeWithRetry(async () => {
      attemptCount++;
      
      if (attemptCount <= 2) {
        const error = new Error('Network timeout');
        error.code = 'NETWORK_ERROR';
        throw error;
      }
      
      return { success: true, message: 'Upload completed successfully!' };
    }, 'uploadInvoicePDF');
  }

  async simulateAuthErrorNoRetry() {
    return this.executeWithRetry(async () => {
      const error = new Error('Authentication failed');
      error.code = 'AUTH_ERROR';
      throw error;
    }, 'uploadInvoicePDF', false); // Not retryable
  }

  async simulateQuotaErrorWithJitter() {
    let attemptCount = 0;
    
    return this.executeWithRetry(async () => {
      attemptCount++;
      
      if (attemptCount <= 2) {
        const error = new Error('Quota exceeded');
        error.code = 'QUOTA_ERROR';
        throw error;
      }
      
      return { success: true, message: 'Upload completed after quota retry!' };
    }, 'uploadInvoicePDF');
  }
}

async function demonstrateRetryMechanism() {
  console.log('🚀 Google Drive Retry Mechanism Demo\n');
  console.log('=' .repeat(50));
  
  const service = new MockGoogleDriveService();

  // Demo 1: Network error with successful retry
  console.log('\n📡 Demo 1: Network Error with Retry');
  console.log('-'.repeat(30));
  try {
    const result = await service.simulateNetworkErrorThenSuccess();
    console.log(`✅ Success: ${result.message}`);
  } catch (error) {
    console.log(`❌ Final failure: ${error.message}`);
  }

  // Demo 2: Authentication error (no retry)
  console.log('\n🔐 Demo 2: Authentication Error (No Retry)');
  console.log('-'.repeat(30));
  try {
    await service.simulateAuthErrorNoRetry();
  } catch (error) {
    console.log(`❌ Expected failure: ${error.message}`);
  }

  // Demo 3: Quota error with jitter
  console.log('\n📊 Demo 3: Quota Error with Jitter');
  console.log('-'.repeat(30));
  try {
    const result = await service.simulateQuotaErrorWithJitter();
    console.log(`✅ Success: ${result.message}`);
  } catch (error) {
    console.log(`❌ Final failure: ${error.message}`);
  }

  console.log('\n🎉 Demo completed! The retry mechanism handles:');
  console.log('• ✅ Exponential backoff for retryable errors');
  console.log('• ✅ Immediate failure for non-retryable errors');
  console.log('• ✅ Jitter for quota/rate limit errors');
  console.log('• ✅ Configurable max retry attempts');
}

// Run the demo
demonstrateRetryMechanism().catch(console.error);