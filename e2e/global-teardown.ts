import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global E2E test teardown...');
  
  // Cleanup operations if needed
  console.log('✅ Global teardown completed');
}

export default globalTeardown;
