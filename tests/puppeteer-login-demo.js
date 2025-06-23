const puppeteer = require('puppeteer');

/**
 * This script demonstrates automated browser actions using Puppeteer.
 * It navigates to a login page, fills out the form, submits it,
 * and takes a screenshot to verify the successful login.
 */
async function runLoginDemo() {
  console.log('Launching browser...');
  // Launch a new browser instance. The 'headless: false' option lets you see the browser UI.
  // For automated scripts, you would typically run in headless mode.
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const url = 'https://the-internet.herokuapp.com/login';
  console.log(`Navigating to ${url}...`);
  await page.goto(url);

  // --- Step 1: Fill in the login form ---
  console.log('Filling in login credentials...');
  // Use selectors to find the username and password input fields and type the credentials.
  await page.type('#username', 'tomsmith');
  await page.type('#password', 'SuperSecretPassword!');

  // --- Step 2: Click the login button ---
  console.log('Clicking login button...');
  // Find the submit button and click it. We also wait for navigation to complete.
  await Promise.all([
    page.waitForNavigation(), // Wait for the new page to load after click
    page.click('button[type="submit"]'),
  ]);

  // --- Step 3: Verify the result ---
  console.log('Verifying login success...');
  const successMessageSelector = '.flash.success';
  const successMessage = await page.$eval(successMessageSelector, el => el.textContent.trim());

  if (successMessage.includes('You logged into a secure area!')) {
    console.log('Login successful! Taking a screenshot...');
    // Take a screenshot to visually confirm the result.
    await page.screenshot({ path: 'login-success.png' });
    console.log('Screenshot saved as login-success.png');
  } else {
    console.error('Login failed.');
  }

  // --- Cleanup ---
  console.log('Closing browser...');
  await browser.close();
}

// Run the demo function and catch any potential errors.
runLoginDemo().catch(console.error);
