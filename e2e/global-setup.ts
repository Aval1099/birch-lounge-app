import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 30000 });
    
    // Clear any existing data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('✅ Application is ready for testing');
  } catch (error) {
    console.error('❌ Failed to setup application:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
