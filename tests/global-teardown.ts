/**
 * Global Teardown for ULTRATHINK E2E Tests
 *
 * This runs once after all tests complete
 */

async function globalTeardown() {
  console.log('\n✅ ULTRATHINK E2E Test Suite - Complete\n');
  console.log('Test results saved to test-results/');
  console.log('HTML report available at: playwright-report/index.html');
}

export default globalTeardown;
