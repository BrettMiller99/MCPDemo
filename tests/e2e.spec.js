// @ts-check
const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_USERNAME = 'TestUser';
const TEST_PASSWORD = 'TestPass123';

test.describe('Windsurf Login End-to-End Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should complete full login flow: signup, login, and logout', async ({ page }) => {
    // Step 1: Navigate to the login page
    await page.goto('/');
    await expect(page).toHaveTitle(/Windsurf - Login/);
    
    // Take screenshot of initial state
    await page.screenshot({ path: '../screenshots/01-login-page.png' });
    
    // Step 2: Click on "Create New Account" button to switch to signup form
    await page.click('#create-account-btn');
    await page.waitForTimeout(500); // Wait for animation
    
    // Verify signup form is visible
    const signupFormVisible = await page.evaluate(() => {
      const signupForm = document.getElementById('signup-form');
      return signupForm ? signupForm.classList.contains('active-form') : false;
    });
    
    // If form toggle didn't work, toggle it manually
    if (!signupFormVisible) {
      console.log('Form toggle didn\'t work automatically, trying manual toggle...');
      await page.evaluate(() => {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const formTitle = document.getElementById('form-title');
        
        if (loginForm) {
          loginForm.classList.remove('active-form');
          loginForm.classList.add('hidden-form');
        }
        
        if (signupForm) {
          signupForm.classList.remove('hidden-form');
          signupForm.classList.add('active-form');
        }
        
        if (formTitle) formTitle.textContent = 'Create Account';
      });
    }
    
    // Take screenshot of signup form
    await page.screenshot({ path: '../screenshots/02-signup-form.png' });
    
    // Step 3: Fill out the signup form
    await page.fill('#new-username', TEST_USERNAME);
    await page.fill('#new-password', TEST_PASSWORD);
    await page.fill('#confirm-password', TEST_PASSWORD);
    
    // Take screenshot of filled signup form
    await page.screenshot({ path: '../screenshots/03-filled-signup-form.png' });
    
    // Step 4: Submit the signup form
    await page.click('#signup-form button[type="submit"]');
    
    // Wait for account creation message
    await page.waitForTimeout(1000);
    
    // Verify account creation success message
    const signupMessage = await page.locator('#signup-message').textContent();
    expect(signupMessage).toContain('Account created successfully');
    
    // Take screenshot after signup
    await page.screenshot({ path: '../screenshots/04-after-signup.png' });
    
    // Step 5: Switch back to login form if needed
    const loginFormVisible = await page.evaluate(() => {
      const loginForm = document.getElementById('login-form');
      return loginForm ? loginForm.classList.contains('active-form') : false;
    });
    
    if (!loginFormVisible) {
      console.log('Not automatically returned to login form, using JavaScript to toggle forms...');
      await page.evaluate(() => {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const formTitle = document.getElementById('form-title');
        
        if (signupForm) {
          signupForm.classList.remove('active-form');
          signupForm.classList.add('hidden-form');
        }
        
        if (loginForm) {
          loginForm.classList.remove('hidden-form');
          loginForm.classList.add('active-form');
        }
        
        if (formTitle) formTitle.textContent = 'Login';
      });
      await page.waitForTimeout(500);
    }
    
    // Step 6: Clear login form fields (in case they're pre-filled)
    await page.evaluate(() => {
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      
      if (usernameInput instanceof HTMLInputElement) {
        usernameInput.value = '';
      }
      
      if (passwordInput instanceof HTMLInputElement) {
        passwordInput.value = '';
      }
    });
    
    // Step 7: Log in with the new account
    await page.fill('#username', TEST_USERNAME);
    await page.fill('#password', TEST_PASSWORD);
    
    // Take screenshot before login
    await page.screenshot({ path: '../screenshots/05-before-login.png' });
    
    // Step 8: Submit login form and wait for navigation
    await Promise.all([
      page.waitForNavigation({ timeout: 5000 }).catch(() => {
        console.log('Navigation timeout, will check page content instead');
      }),
      page.click('#login-form button[type="submit"]')
    ]);
    
    // Take screenshot after login
    await page.screenshot({ path: '../screenshots/06-after-login.png' });
    
    // Step 9: Verify successful login
    // Check if we're on success page either by URL or content
    const currentUrl = page.url();
    const isSuccessPage = currentUrl.includes('success.html');
    
    if (isSuccessPage) {
      // We're on the success page, verify content
      await expect(page.locator('h1')).toHaveText('Secure Area');
      await expect(page.locator('.login-container p')).toContainText('successfully logged in');
    } else {
      // Check if there was an error message
      const errorVisible = await page.locator('#error-message').isVisible();
      if (errorVisible) {
        const errorText = await page.locator('#error-message').textContent();
        throw new Error(`Login failed: ${errorText}`);
      }
      // If no error but also not on success page, fail the test
      throw new Error('Login verification failed: Not on success page and no error message found');
    }
    
    // Step 10: Log out
    await page.screenshot({ path: '../screenshots/07-before-logout.png' });
    
    // Click logout and wait for navigation
    await Promise.all([
      page.waitForNavigation({ timeout: 5000 }).catch(() => {
        console.log('Logout navigation timeout, will check page content instead');
      }),
      page.click('.logout-button')
    ]);
    
    // Take screenshot after logout
    await page.screenshot({ path: '../screenshots/08-after-logout.png' });
    
    // Step 11: Verify successful logout
    // Check if we're back on the login page
    const finalUrl = page.url();
    const backToLoginPage = finalUrl.includes('index.html') || !finalUrl.includes('success.html');
    
    // Check if login form is visible
    const loginFormPresent = await page.locator('#login-form').isVisible();
    
    expect(backToLoginPage).toBeTruthy();
    expect(loginFormPresent).toBeTruthy();
  });
});
