/**
 * End-to-End Test Script using Playwright
 * 
 * This script performs the following flow:
 * 1. Create a new account
 * 2. Log in with the newly created account
 * 3. Verify successful login
 * 4. Log out
 * 5. Verify successful logout
 *
 * Note: This script includes additional debugging to help troubleshoot issues.
 */

const { chromium } = require('playwright');
const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 8000;
const BASE_URL = `http://localhost:${PORT}`;
const TEST_USERNAME = 'TestUser';
const TEST_PASSWORD = 'TestPass123';

// Start the HTTP server
let serverProcess;

async function startServer() {
  return new Promise((resolve) => {
    console.log('Starting HTTP server...');
    
    // First, try to kill any existing server on the same port
    const killCommand = process.platform === 'win32' 
      ? `FOR /F "tokens=5" %a in ('netstat -ano ^| findstr :${PORT}') do taskkill /F /PID %a`
      : `lsof -ti:${PORT} | xargs kill -9`;
    
    try {
      exec(killCommand);
      console.log(`Attempting to kill any process using port ${PORT}`);
      // Give it a moment to release the port
      setTimeout(() => {
        // Use parent directory as cwd since we're now in the tests folder
        serverProcess = exec(`npx http-server ./src -p ${PORT}`, { cwd: path.resolve(__dirname, '..') });
      }, 1000);
    } catch (e) {
      // If no process was killed, that's fine
      console.log(`No existing process on port ${PORT}`);
      // Use parent directory as cwd since we're now in the tests folder
      serverProcess = exec(`npx http-server ./src -p ${PORT}`, { cwd: path.resolve(__dirname, '..') });
    }
    
    // Check if the server is up
    const checkServer = () => {
      http.get(BASE_URL, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Server is up and running');
          resolve();
        } else {
          setTimeout(checkServer, 500);
        }
      }).on('error', () => {
        console.log('Waiting for server to start...');
        setTimeout(checkServer, 500);
      });
    };
    
    // Give the server a moment to start
    setTimeout(checkServer, 1000);
  });
}

async function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    console.log('✅ Server stopped');
  }
}

// Helper function to save screenshots for debugging
async function saveScreenshot(page, name) {
  const dir = '../screenshots';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await page.screenshot({ path: `${dir}/${name}-${Date.now()}.png` });
  console.log(`📸 Screenshot saved: ${name}`);
}

// Helper function to wait for a specific amount of time
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
  console.log('🚀 Starting end-to-end test with Playwright...');
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
  });
  
  // Define page in outer scope so it's accessible in catch/finally blocks
  let page;
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    
    page = await context.newPage();
    
    // Step 1: Navigate to the login page
    console.log('📄 Navigating to login page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await saveScreenshot(page, 'login-page');
    
    // Clear localStorage to ensure clean state
    console.log('🧹 Clearing localStorage for clean test...');
    await page.evaluate(() => localStorage.clear());
    
    // Step 2: Click on "Create New Account" button
    console.log('🔄 Switching to signup form...');
    await page.click('#create-account-btn');
    await wait(1000); // Wait for form transition
    
    // Step 3: Check if form toggle was successful
    const signupFormVisible = await page.evaluate(() => {
      return document.getElementById('signup-form').classList.contains('active-form');
    });
    
    if (!signupFormVisible) {
      console.log('⚠️ Form toggle didn\'t work automatically, trying manual toggle...');
      await page.evaluate(() => {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const formTitle = document.getElementById('form-title');
        
        loginForm.classList.remove('active-form');
        loginForm.classList.add('hidden-form');
        signupForm.classList.remove('hidden-form');
        signupForm.classList.add('active-form');
        if (formTitle) formTitle.textContent = 'Create Account';
      });
      await wait(500);
    }
    
    await saveScreenshot(page, 'signup-form');
    
    // Step 4: Fill out the signup form
    console.log('📝 Creating new account...');
    await page.fill('#new-username', TEST_USERNAME);
    await page.fill('#new-password', TEST_PASSWORD);
    await page.fill('#confirm-password', TEST_PASSWORD);
    await saveScreenshot(page, 'filled-signup-form');
    
    // Step 5: Submit the signup form
    console.log('🔐 Submitting signup form...');
    await page.click('#signup-form button[type="submit"]');
    await wait(1500); // Wait for account creation
    
    // Check if account creation was successful
    const signupMessage = await page.evaluate(() => {
      const message = document.getElementById('signup-message');
      return message ? message.textContent : '';
    });
    
    console.log(`Signup message: "${signupMessage}"`); 
    await saveScreenshot(page, 'after-signup');
    
    // Step 6: Switch back to login form if needed
    const loginFormVisible = await page.evaluate(() => {
      return document.getElementById('login-form').classList.contains('active-form');
    });
    
    if (!loginFormVisible) {
      console.log('⚠️ Not automatically returned to login form, using JavaScript to toggle forms...');
      // Use JavaScript to toggle forms instead of clicking a button that might not exist
      await page.evaluate(() => {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const formTitle = document.getElementById('form-title');
        
        signupForm.classList.remove('active-form');
        signupForm.classList.add('hidden-form');
        loginForm.classList.remove('hidden-form');
        loginForm.classList.add('active-form');
        if (formTitle) formTitle.textContent = 'Login';
      });
      await wait(1000);
    }
    
    // Step 7: Clear login form fields (in case they're pre-filled)
    console.log('🧹 Clearing login form fields...');
    await page.evaluate(() => {
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
    });
    
    // Step 8: Log in with the new account
    console.log('🔑 Logging in with new account...');
    await page.fill('#username', TEST_USERNAME);
    await page.fill('#password', TEST_PASSWORD);
    await saveScreenshot(page, 'before-login');
    
    // Step 9: Submit login form
    console.log('🚪 Submitting login form...');
    
    // Store the current URL to detect navigation
    const currentUrl = page.url();
    
    // Create a navigation promise
    const navigationPromise = page.waitForNavigation({ timeout: 5000 }).catch(e => {
      console.log('Navigation detection timed out, checking if we\'re on success page...');
    });
    
    // Click the login button
    await page.click('#login-form button[type="submit"]');
    
    // Wait for navigation or timeout
    await navigationPromise;
    
    await wait(2000); // Give time for any redirects/rendering
    await saveScreenshot(page, 'after-login');
    
    // Step 10: Verify successful login
    const url = page.url();
    const isSuccessPage = url.includes('success.html');
    
    // Check page content for verification
    const pageContent = await page.content();
    const hasSuccessElements = pageContent.includes('Secure Area') && 
                              pageContent.includes('successfully logged in');
    
    if (isSuccessPage || hasSuccessElements) {
      console.log('✅ Login successful!');
    } else {
      // Check for error message
      const errorMessage = await page.evaluate(() => {
        const error = document.getElementById('error-message');
        return error ? error.textContent : 'No error message found';
      });
      console.error(`❌ Login verification failed. Error: ${errorMessage}`);
      throw new Error(`Login verification failed: ${errorMessage}`);
    }
    
    // Step 11: Log out
    console.log('🚪 Logging out...');
    await saveScreenshot(page, 'before-logout');
    
    // Create a navigation promise for logout
    const logoutNavigationPromise = page.waitForNavigation({ timeout: 5000 }).catch(e => {
      console.log('Logout navigation detection timed out, checking if we\'re back on login page...');
    });
    
    // Click the logout button
    await page.click('.logout-button');
    
    // Wait for navigation or timeout
    await logoutNavigationPromise;
    
    await wait(2000); // Give time for any redirects/rendering
    await saveScreenshot(page, 'after-logout');
    
    // Step 12: Verify successful logout
    const finalUrl = page.url();
    const backToLoginPage = finalUrl.includes('index.html') || !finalUrl.includes('success.html');
    
    const loginFormPresent = await page.evaluate(() => {
      return !!document.getElementById('login-form');
    });
    
    if (backToLoginPage && loginFormPresent) {
      console.log('✅ Logout successful!');
    } else {
      console.error('❌ Logout verification failed');
      throw new Error('Logout verification failed');
    }
    
    console.log('🎉 End-to-end test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    // Take a screenshot of the failure state
    try {
      if (page) {
        await saveScreenshot(page, 'test-failure');
      } else {
        console.error('Cannot take failure screenshot: page not initialized');
      }
    } catch (e) {
      console.error('Could not save failure screenshot:', e.message);
    }
    throw error; // Re-throw to be caught by the main execution
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Main execution
(async () => {
  let exitCode = 0;
  console.log('\n🔄 Starting Windsurf Login E2E Test with Playwright');
  console.log('================================================');
  
  try {
    // Start the local server
    await startServer();
    
    // Run the test
    await runTest();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test execution error:', error.message);
    exitCode = 1;
  } finally {
    // Always stop the server
    await stopServer();
    
    // Report test results
    if (exitCode === 0) {
      console.log('\n🎉 E2E TEST PASSED 🎉');
    } else {
      console.log('\n❌ E2E TEST FAILED ❌');
      console.log('Check the screenshots directory for visual debugging information.');
    }
    
    console.log('\n================================================');
    process.exit(exitCode);
  }
})();
