/**
 * Global Setup for ULTRATHINK E2E Tests
 *
 * This runs once before all tests to ensure the environment is ready
 */

async function globalSetup() {
  console.log('\n🚀 ULTRATHINK E2E Test Suite - Global Setup\n');
  console.log('Checking prerequisites...');

  // Check if backend is accessible
  const maxAttempts = 30;
  let backendReady = false;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:7001/health');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend is ready:', data.status);
        backendReady = true;
        break;
      }
    } catch (error) {
      // Backend not ready, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (!backendReady) {
    throw new Error('Backend failed to start within 30 seconds');
  }

  // Check if frontend is accessible
  let frontendReady = false;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:3000');
      if (response.ok) {
        console.log('✅ Frontend is ready');
        frontendReady = true;
        break;
      }
    } catch (error) {
      // Frontend not ready, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (!frontendReady) {
    throw new Error('Frontend failed to start within 30 seconds');
  }

  console.log('\n✅ All systems ready - Starting E2E tests...\n');
}

export default globalSetup;
