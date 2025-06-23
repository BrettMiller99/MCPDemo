// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Windsurf Login Application', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/');
  });

  test('should display the login page with correct elements', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Login/);

    // Verify the Windsurf logo is present
    const logo = page.locator('.logo img');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', 'windsurf-white-wordmark.svg');

    // Verify the heading is present
    const heading = page.locator('h1#form-title');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Welcome Back');

    // Verify the login form is visible
    const loginForm = page.locator('#login-form');
    await expect(loginForm).toBeVisible();

    // Verify the username and password fields are present
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // Verify the login button is present
    const loginButton = page.locator('#login-form button[type="submit"]');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toContainText('Login');

    // Verify the "Create New Account" button is present
    const createAccountButton = page.locator('#create-account-btn');
    await expect(createAccountButton).toBeVisible();
    await expect(createAccountButton).toContainText('Create New Account');
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.fill('#username', 'wronguser');
    await page.fill('#password', 'wrongpass');
    
    // Click the login button
    await page.click('#login-form button[type="submit"]');
    
    // Verify error message is displayed
    const errorMessage = page.locator('#error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Invalid username or password');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Enter valid credentials (default user)
    await page.fill('#username', 'brettmiller');
    await page.fill('#password', 'password');
    
    // Click the login button
    await page.click('#login-form button[type="submit"]');
    
    // Verify we are redirected to the success page
    await expect(page).toHaveURL(/success.html/);
    
    // Verify success page elements
    const successMessage = page.locator('.success-message');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('successfully logged in');
    
    // Verify the logout button is present
    const logoutButton = page.locator('.logout-button');
    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toContainText('Logout');
  });

  test('should toggle between login and signup forms', async ({ page }) => {
    // Initially, the login form should be visible
    await expect(page.locator('#login-form')).toHaveClass(/active-form/);
    await expect(page.locator('#signup-form')).toHaveClass(/hidden-form/);
    
    // Click the "Create New Account" button
    await page.click('#create-account-btn');
    
    // Verify the signup form is now visible and login form is hidden
    await expect(page.locator('#signup-form')).toHaveClass(/active-form/);
    await expect(page.locator('#login-form')).toHaveClass(/hidden-form/);
    
    // Verify the form title has changed
    await expect(page.locator('#form-title')).toContainText('Create Account');
    
    // Click the "Back to Login" button
    await page.click('#back-to-login-btn');
    
    // Verify we're back to the login form
    await expect(page.locator('#login-form')).toHaveClass(/active-form/);
    await expect(page.locator('#signup-form')).toHaveClass(/hidden-form/);
    await expect(page.locator('#form-title')).toContainText('Welcome Back');
  });

  test('should create a new account successfully', async ({ page }) => {
    // Generate a random username to avoid conflicts
    const randomUsername = `testuser_${Math.floor(Math.random() * 10000)}`;
    
    // Click the "Create New Account" button
    await page.click('#create-account-btn');
    
    // Fill out the signup form
    await page.fill('#new-username', randomUsername);
    await page.fill('#new-password', 'testpassword');
    await page.fill('#confirm-password', 'testpassword');
    
    // Submit the form
    await page.click('#signup-form button[type="submit"]');
    
    // Verify success message appears
    const signupMessage = page.locator('#signup-message');
    await expect(signupMessage).toBeVisible();
    await expect(signupMessage).toContainText('Account created successfully');
    
    // Wait for automatic redirect to login form
    await expect(page.locator('#login-form')).toHaveClass(/active-form/, { timeout: 3000 });
    
    // Try logging in with the new account
    await page.fill('#username', randomUsername);
    await page.fill('#password', 'testpassword');
    await page.click('#login-form button[type="submit"]');
    
    // Verify successful login
    await expect(page).toHaveURL(/success.html/);
  });

  test('should prevent account creation with mismatched passwords', async ({ page }) => {
    // Click the "Create New Account" button
    await page.click('#create-account-btn');
    
    // Fill out the signup form with mismatched passwords
    await page.fill('#new-username', 'newuser');
    await page.fill('#new-password', 'password1');
    await page.fill('#confirm-password', 'password2');
    
    // Submit the form
    await page.click('#signup-form button[type="submit"]');
    
    // Verify error message appears
    const signupMessage = page.locator('#signup-message');
    await expect(signupMessage).toBeVisible();
    await expect(signupMessage).toContainText('Passwords do not match');
  });

  test('should prevent duplicate username during account creation', async ({ page }) => {
    // Click the "Create New Account" button
    await page.click('#create-account-btn');
    
    // Fill out the signup form with existing username
    await page.fill('#new-username', 'brettmiller'); // Using the default username
    await page.fill('#new-password', 'newpassword');
    await page.fill('#confirm-password', 'newpassword');
    
    // Submit the form
    await page.click('#signup-form button[type="submit"]');
    
    // Verify error message appears
    const signupMessage = page.locator('#signup-message');
    await expect(signupMessage).toBeVisible();
    await expect(signupMessage).toContainText('Username already exists');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('#username', 'brettmiller');
    await page.fill('#password', 'password');
    await page.click('#login-form button[type="submit"]');
    
    // Verify we're on the success page
    await expect(page).toHaveURL(/success.html/);
    
    // Click the logout button
    await page.click('.logout-button');
    
    // Verify we're redirected back to the login page
    await expect(page).toHaveURL(/index.html/);
  });
});
