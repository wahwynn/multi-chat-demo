#!/usr/bin/env node

/**
 * Automated Screenshot Capture Script for Multi-Chat Demo
 *
 * This script uses Playwright to automatically capture screenshots
 * for the help documentation.
 *
 * Prerequisites:
 * - npm install playwright
 * - Application must be running at http://localhost:3000
 * - Backend must be running at http://localhost:8000
 *
 * Usage:
 *   node docs/makedocs/capture-screenshots.js
 */

// Try to load playwright from frontend/node_modules first, then fallback to global
let playwright;
try {
  playwright = require('../../frontend/node_modules/playwright');
} catch (e) {
  playwright = require('playwright');
}
const { chromium } = playwright;
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8000/api';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test credentials (adjust as needed)
const TEST_USER = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpass123'
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Create or ensure test user exists via API using Playwright's request context
async function ensureTestUser(context) {
  const request = context.request;

  try {
    // Try to login first
    console.log('Attempting to login via API...');
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        username: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    if (loginResponse.ok()) {
      console.log('✓ Test user exists and API login successful');
      return true;
    } else {
      const errorData = await loginResponse.json().catch(() => ({}));
      console.log('Login failed:', errorData);
    }
  } catch (loginError) {
    console.log('Login attempt failed, will try registration');
  }

  // If login fails, try to register
  try {
    console.log('Creating test user via API...');
    const registerResponse = await request.post(`${API_URL}/auth/register`, {
      data: {
        username: TEST_USER.username,
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });

    if (registerResponse.ok()) {
      console.log('✓ Test user created successfully via API');
      return true;
    } else {
      const errorData = await registerResponse.json().catch(() => ({}));
      console.log('Registration failed:', errorData);
    }
  } catch (registerError) {
    console.error('Failed to create test user via API:', registerError.message);
  }

  return false;
}

async function captureScreenshots() {
  console.log('Starting screenshot capture...');
  console.log(`Screenshots will be saved to: ${SCREENSHOT_DIR}`);

  const browser = await chromium.launch({ headless: false }); // Set to true for headless mode

  // Create a temporary context to create user via API
  const tempContext = await browser.newContext();
  await ensureTestUser(tempContext);
  await tempContext.close();

  // Create main context for browser
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 }, // Square aspect ratio
  });

  const page = await context.newPage();

  try {
    // 1. Welcome screen
    console.log('Capturing: 01-welcome-screen.png');
    await page.goto(BASE_URL);
    await delay(2000); // Wait for page to load
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-welcome-screen.png'),
      fullPage: true
    });

    // 2. Sign up form
    console.log('Capturing: 02-sign-up.png');
    // Click sign up if needed
    const signUpLink = page.locator('text=/Sign up|Create account/').first();
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await delay(1000);
    }
    // Highlight the "Create account" button
    await highlightElement('[data-testid="create-account-button"]');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-sign-up.png'),
      fullPage: true
    });
    await removeHighlights();

    // 3. Sign in form
    console.log('Capturing: 03-sign-in.png');
    const signInLink = page.locator('text=/Sign in|Already have an account/').first();
    if (await signInLink.isVisible()) {
      await signInLink.click();
      await delay(1000);
    }
    // Highlight the "Sign in" button
    await highlightElement('[data-testid="sign-in-button"]');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-sign-in.png'),
      fullPage: true
    });
    await removeHighlights();

    // Always login through UI (more reliable than cookie transfer)
    console.log('Logging in through UI...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(2000); // Wait for React to hydrate

    // Check if we're already logged in - be more strict about this check
    const loginIndicators = [
      'text=/Multi-Chat/i',
      'text=/New Chat/i',
      'text=/Select Models/i',
      '[class*="conversation"]',
      'button:has-text("New Chat")'
    ];

    // Also check for auth page elements to confirm we're NOT logged in
    const authIndicators = [
      'input[type="text"]',
      'input[type="email"]',
      'button:has-text("Sign in")',
      'button:has-text("Create account")'
    ];

    let isAlreadyLoggedIn = false;
    let isOnAuthPage = false;

    // Check for auth page first
    for (const indicator of authIndicators) {
      try {
        if (await page.locator(indicator).isVisible({ timeout: 2000 })) {
          isOnAuthPage = true;
          break;
        }
      } catch (e) {
        // Continue checking
      }
    }

    // Only check for login success if we're NOT on auth page
    if (!isOnAuthPage) {
      for (const indicator of loginIndicators) {
        try {
          if (await page.locator(indicator).isVisible({ timeout: 3000 })) {
            isAlreadyLoggedIn = true;
            console.log(`✓ Already logged in! Detected: ${indicator}`);
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }
    }

    if (!isAlreadyLoggedIn) {
      console.log('Not logged in, proceeding with login...');
      console.log('Not logged in, signing in through UI...');

      // Wait for auth page to load
      console.log('Waiting for auth form...');
      await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 10000 });
      await delay(1000);

      // Make sure we're on sign-in form (not sign-up)
      const isSignUpMode = await page.locator('input[type="email"]').isVisible({ timeout: 2000 }).catch(() => false);
      if (isSignUpMode) {
        console.log('Switching to sign-in form...');
        const signInToggle = page.locator('text=/Sign in|Already have an account/i').first();
        if (await signInToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
          await signInToggle.click();
          await delay(2000);
        }
      }

      // Wait for form to be ready
      console.log('Filling login form...');
      await page.waitForSelector('input[type="text"]', { timeout: 10000 });
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await delay(1000); // Wait for form to be fully ready

      // Clear and fill username
      console.log('Entering username...');
      const usernameInput = page.locator('input[type="text"]').first();
      await usernameInput.click({ clickCount: 3 });
      await usernameInput.fill('');
      await delay(300);
      await usernameInput.fill(TEST_USER.username);
      await delay(500); // Wait after filling username

      // Clear and fill password
      console.log('Entering password...');
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.fill('');
      await delay(300);
      await passwordInput.fill(TEST_USER.password);
      await delay(1000); // Wait after filling password before submitting

      // Submit form
      console.log('Submitting login form...');
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.waitFor({ state: 'visible', timeout: 10000 });
      await submitButton.waitFor({ state: 'attached', timeout: 5000 });
      await delay(500); // Wait before clicking submit

      // Click submit button
      await submitButton.click();
      console.log('Login form submitted, waiting for response...');

      // Wait for login to complete - check for multiple indicators
      await delay(2000); // Initial wait for form submission

      // Wait for either success (main app elements) or error
      let loginCompleted = false;
      let attempts = 0;
      const maxAttempts = 15; // 15 seconds total wait

      while (!loginCompleted && attempts < maxAttempts) {
        await delay(1000);
        attempts++;

        // Check for success indicators
        for (const indicator of loginIndicators) {
          try {
            if (await page.locator(indicator).isVisible({ timeout: 500 })) {
              loginCompleted = true;
              console.log(`✓ Login successful! Detected: ${indicator}`);
              break;
            }
          } catch (e) {
            // Continue checking
          }
        }

        // Check for error messages
        try {
          const errorElement = page.locator('[class*="error"], [class*="alert"], [class*="text-red"], [class*="bg-red"]').first();
          if (await errorElement.isVisible({ timeout: 500 })) {
            const errorMsg = await errorElement.textContent({ timeout: 500 }).catch(() => '');
            if (errorMsg && errorMsg.trim().length > 0) {
              console.log(`Login error detected: ${errorMsg}`);
              break; // Exit loop if error found
            }
          }
        } catch (e) {
          // No error found, continue
        }

        // Check if still on auth page
        try {
          const authForm = await page.locator('input[type="text"], input[type="email"]').isVisible({ timeout: 500 });
          if (!authForm && attempts > 3) {
            // Form disappeared, might have navigated
            await delay(2000); // Give it more time
            loginCompleted = true; // Assume success if form is gone
            break;
          }
        } catch (e) {
          // Form not found, might have navigated
          if (attempts > 3) {
            await delay(2000);
            loginCompleted = true;
            break;
          }
        }
      }

      if (!loginCompleted) {
        console.log('Login completion timeout, checking current state...');
        await delay(2000); // Final wait

        // Final verification attempt
        for (const indicator of loginIndicators) {
          try {
            if (await page.locator(indicator).isVisible({ timeout: 3000 })) {
              loginCompleted = true;
              console.log(`✓ Login successful after timeout! Detected: ${indicator}`);
              break;
            }
          } catch (e) {
            // Continue checking
          }
        }
      }

      if (!loginCompleted) {
        // Check for error messages
        const errorElement = page.locator('[class*="error"], [class*="alert"], [class*="text-red"], [class*="bg-red"]').first();
        const errorMsg = await errorElement.textContent({ timeout: 2000 }).catch(() => '');
        console.error(`Login error: ${errorMsg || 'No error message found'}`);

        // Try registration as fallback
        console.log('Trying registration as fallback...');
        const signUpToggle = page.locator('text=/Sign up|Create account|Don\'t have an account/i').first();
        if (await signUpToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
          await signUpToggle.click();
          await delay(2000);

          await page.fill('input[type="text"]', TEST_USER.username);
          await page.fill('input[type="email"]', TEST_USER.email);
          const passwordInputs = await page.locator('input[type="password"]').all();
          if (passwordInputs.length >= 2) {
            await passwordInputs[0].fill(TEST_USER.password);
            await passwordInputs[1].fill(TEST_USER.password);
          }
          await delay(500);

          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
            page.locator('button[type="submit"]').first().click()
          ]);

          await delay(2000);

          // Verify registration success
          loginSuccess = false;
          for (const indicator of loginIndicators) {
            try {
              if (await page.locator(indicator).isVisible({ timeout: 3000 })) {
                loginSuccess = true;
                break;
              }
            } catch (e) {
              // Continue checking
            }
          }
        }

        if (!loginSuccess) {
          // Take a debug screenshot
          try {
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'login-failed-debug.png'), fullPage: true });
            console.log('Debug screenshot saved: login-failed-debug.png');
          } catch (e) {
            // Ignore screenshot errors
          }
          throw new Error(`Failed to login or register. Error: ${errorMsg || 'Unknown'}. Check login-failed-debug.png for details.`);
        } else {
          console.log('✓ Registration successful!');
        }
      } else {
        console.log('✓ Login successful via UI!');
      }
    } else {
      console.log('✓ Already logged in (from API cookies)!');
    }

    // 4. New conversation sidebar
    console.log('Capturing: 04-new-conversation.png');
    await delay(2000); // Wait for main page to load
    // Highlight the "New Chat" button
    await highlightElement('[data-testid="new-chat-button"]');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-new-conversation.png'),
      fullPage: false
    });
    await removeHighlights();

    // 5. Model selection dropdown
    console.log('Capturing: 05-model-selection.png');
    const modelDropdown = page.locator('[data-testid="select-models-button"]').first();
    if (await modelDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Open dropdown
      await modelDropdown.click();
      await delay(1000);

      // Verify dropdown is open
      const dropdownOpen = await page.locator('ul:has(input[data-testid^="model-checkbox-"])').isVisible({ timeout: 2000 }).catch(() => false);

      if (dropdownOpen) {
        // Highlight model checkboxes
        await highlightElements(['input[data-testid^="model-checkbox-"]']);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '05-model-selection.png'),
          fullPage: false
        });
        await removeHighlights();

        // Close dropdown by clicking the button again (toggles it closed)
        await modelDropdown.click();
        await delay(500);

        // Verify dropdown is closed
        const dropdownStillOpen = await page.locator('ul:has(input[data-testid^="model-checkbox-"])').isVisible({ timeout: 1000 }).catch(() => false);
        if (dropdownStillOpen) {
          // Fallback: click outside the dropdown area
          await page.mouse.click(100, 100);
          await delay(500);
        }
      } else {
        // Dropdown didn't open, try clicking again
        await modelDropdown.click();
        await delay(1000);
        await highlightElements(['input[data-testid^="model-checkbox-"]']);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '05-model-selection.png'),
          fullPage: false
        });
        await removeHighlights();
        // Close dropdown
        await modelDropdown.click();
        await delay(500);
      }
    } else {
      // Fallback: capture sidebar anyway
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '05-model-selection.png'),
        fullPage: false
      });
    }

    // Create a conversation
    console.log('Creating a test conversation...');
    const newChatButton = page.locator('[data-testid="new-chat-button"]').first();
    if (await newChatButton.isVisible()) {
      await newChatButton.click();
      await delay(2000);
    }

    // 6. Rename conversation
    console.log('Capturing: 06-rename-conversation.png');
    // Wait a bit for conversation to appear
    await delay(1000);
    const conversationItem = page.locator('[class*="conversation"], [class*="cursor-pointer"]').first();
    if (await conversationItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Try to find edit button (✎ symbol)
      const editButton = conversationItem.locator('button').first();
      if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Highlight edit button before clicking
        await highlightElement(editButton);
        await editButton.click();
        await delay(1000);
        // Highlight the input field
        await highlightElement('[data-testid="conversation-title-input"]');
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '06-rename-conversation.png'),
          fullPage: false
        });
        await removeHighlights();
        await page.keyboard.press('Escape');
        await delay(500);
      } else {
        // Try double-click
        await conversationItem.dblclick();
        await delay(1000);
        // Highlight the input field
        await highlightElement('[data-testid="conversation-title-input"]');
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '06-rename-conversation.png'),
          fullPage: false
        });
        await removeHighlights();
        await page.keyboard.press('Escape');
        await delay(500);
      }
    } else {
      // Fallback: capture sidebar
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '06-rename-conversation.png'),
        fullPage: false
      });
    }

    // 7. Delete conversation dialog
    console.log('Capturing: 07-delete-conversation.png');
    await delay(500);
    // Try multiple selectors for delete button
    const deleteSelectors = [
      'button:has-text("×")',
      'button.text-error',
      'button:has-text("Delete")',
      '[title="Delete"]'
    ];
    let deleteClicked = false;
    for (const selector of deleteSelectors) {
      const deleteButton = page.locator(selector).first();
      if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deleteButton.click();
        await delay(1500);
        // Highlight the delete confirmation button
        await highlightElement('[data-testid="confirm-delete-button"]');
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '07-delete-conversation.png'),
          fullPage: false
        });
        await removeHighlights();
        deleteClicked = true;
        // Cancel delete
        const cancelButton = page.locator('button:has-text("Cancel")').first();
        if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await cancelButton.click();
          await delay(500);
        }
        break;
      }
    }
    if (!deleteClicked) {
      // Fallback: capture sidebar
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '07-delete-conversation.png'),
        fullPage: false
      });
    }

    // 8. Message input
    console.log('Capturing: 08-message-input.png');
    // Highlight the Send button
    await highlightElement('[data-testid="send-message-button"]');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '08-message-input.png'),
      fullPage: false
    });
    await removeHighlights();

    // Send a test message
    console.log('Sending a test message...');
    try {
      const messageInput = page.locator('textarea[placeholder*="message"]').first();
      if (await messageInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await messageInput.fill('Hello, this is a test message!');
        await delay(1000);
        const sendButton = page.locator('[data-testid="send-message-button"]').first();
        if (await sendButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await sendButton.click();
          // Wait a bit for message to appear, but don't wait too long for AI responses
          await delay(3000);
        }
      }
    } catch (error) {
      console.log('Note: Could not send test message, continuing with screenshots...');
    }

    // 9. Chat responses
    console.log('Capturing: 09-chat-responses.png');
    try {
      // Wait a bit more for any responses that might have started
      await delay(2000);
      if (!page.isClosed()) {
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '09-chat-responses.png'),
          fullPage: false
        });
      }
    } catch (error) {
      console.log('Warning: Could not capture chat responses screenshot');
    }

    // 10. Multi-model responses (if multiple models selected)
    console.log('Capturing: 10-multi-model-responses.png');
    try {
      if (!page.isClosed()) {
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '10-multi-model-responses.png'),
          fullPage: false
        });
      }
    } catch (error) {
      console.log('Warning: Could not capture multi-model responses screenshot');
    }

    // Helper function to find and click avatar button
    async function clickAvatar() {
      // Try data-testid first, then fallback to other selectors
      const selectors = [
        '[data-testid="avatar-button"]',
        '[class*="avatar"]',
        'button:has([class*="avatar"])',
        '[role="button"]:has([class*="avatar"])',
        '.btn-ghost.btn-circle.avatar'
      ];
      for (const selector of selectors) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await btn.click();
          await delay(1000);
          return true;
        }
      }
      return false;
    }

    // Helper function to highlight an element before screenshot
    async function highlightElement(selector, options = {}) {
      const style = options.style || 'outline: 3px solid #ff0000; outline-offset: 2px; box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.3);';
      try {
        // If selector is a Playwright locator, evaluate it
        if (typeof selector === 'object' && selector.evaluate) {
          await selector.evaluate((el, { highlightStyle }) => {
            el.setAttribute('data-screenshot-highlight', 'true');
            el.style.cssText += highlightStyle;

            // Add large red arrow with tail pointing to the element
            const rect = el.getBoundingClientRect();
            const arrowContainer = document.createElement('div');
            arrowContainer.setAttribute('data-screenshot-arrow', 'true');
            arrowContainer.style.cssText = `
              position: fixed;
              z-index: 999999;
              pointer-events: none;
              left: ${rect.left + rect.width / 2}px;
              top: ${rect.top - 150}px;
              transform: translateX(-50%);
            `;

            // Arrow tail (line)
            const tail = document.createElement('div');
            tail.style.cssText = `
              width: 8px;
              height: 50px;
              background-color: #ff0000;
              margin: 0 auto;
            `;

            // Arrowhead (triangle pointing down)
            const arrowhead = document.createElement('div');
            arrowhead.style.cssText = `
              width: 0;
              height: 0;
              border-left: 30px solid transparent;
              border-right: 30px solid transparent;
              border-top: 50px solid #ff0000;
              margin: 0 auto;
            `;

            arrowContainer.appendChild(tail);
            arrowContainer.appendChild(arrowhead);
            document.body.appendChild(arrowContainer);
          }, { highlightStyle: style });
        } else {
          // If selector is a string, use querySelector
          await page.evaluate(({ sel, highlightStyle }) => {
            const element = document.querySelector(sel);
            if (element) {
              element.setAttribute('data-screenshot-highlight', 'true');
              element.style.cssText += highlightStyle;

              // Add large red arrow with tail pointing to the element
              const rect = element.getBoundingClientRect();
              const arrowContainer = document.createElement('div');
              arrowContainer.setAttribute('data-screenshot-arrow', 'true');
              arrowContainer.style.cssText = `
                position: fixed;
                z-index: 999999;
                pointer-events: none;
                left: ${rect.left + rect.width / 2}px;
                top: ${rect.top - 150}px;
                transform: translateX(-50%);
              `;

              // Arrow tail (line)
              const tail = document.createElement('div');
              tail.style.cssText = `
                width: 8px;
                height: 100px;
                background-color: #ff0000;
                margin: 0 auto;
              `;

              // Arrowhead (triangle pointing down)
              const arrowhead = document.createElement('div');
              arrowhead.style.cssText = `
                width: 0;
                height: 0;
                border-left: 30px solid transparent;
                border-right: 30px solid transparent;
                border-top: 50px solid #ff0000;
                margin: 0 auto;
              `;

              arrowContainer.appendChild(tail);
              arrowContainer.appendChild(arrowhead);
              document.body.appendChild(arrowContainer);
            }
          }, { sel: selector, highlightStyle: style });
        }
        await delay(200); // Small delay to ensure style is applied
        return true;
      } catch (error) {
        console.log(`Warning: Could not highlight element: ${error.message}`);
        return false;
      }
    }

    // Helper function to highlight multiple elements
    async function highlightElements(selectors, options = {}) {
      for (const selector of selectors) {
        await highlightElement(selector, options);
      }
    }

    // Helper function to remove highlights
    async function removeHighlights() {
      try {
        await page.evaluate(() => {
          // Remove highlighted elements
          const highlighted = document.querySelectorAll('[data-screenshot-highlight="true"]');
          highlighted.forEach(el => {
            el.removeAttribute('data-screenshot-highlight');
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.style.boxShadow = '';
          });

          // Remove arrow elements
          const arrows = document.querySelectorAll('[data-screenshot-arrow="true"]');
          arrows.forEach(arrow => {
            arrow.remove();
          });
        });
      } catch (error) {
        // Ignore errors when removing highlights
      }
    }

    // 11. Profile menu
    console.log('Capturing: 11-profile-menu.png');
    try {
      if (page.isClosed()) {
        console.log('Warning: Page is closed, cannot capture profile menu');
      } else {
        const avatarClicked = await clickAvatar();
        if (avatarClicked) {
          await delay(1000);
          // Highlight "Edit profile" button
          await highlightElement('[data-testid="edit-profile-button"]');
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '11-profile-menu.png'),
            fullPage: false
          });
          await removeHighlights();
          console.log('✓ Captured 11-profile-menu.png');
        } else {
          console.log('Warning: Could not find avatar button');
        }
      }
    } catch (error) {
      console.log(`Warning: Could not capture profile menu screenshot: ${error.message}`);
    }

    // 12. Edit profile modal
    console.log('Capturing: 12-edit-profile.png');
    try {
      if (page.isClosed()) {
        console.log('Warning: Page is closed, cannot capture edit profile');
      } else {
        const editProfileButton = page.locator('[data-testid="edit-profile-button"]').first();
        if (await editProfileButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await editProfileButton.click();
          await delay(2000); // Wait for modal to open

          // Wait for modal to be visible
          await page.waitForSelector('.modal.modal-open', { timeout: 5000 }).catch(() => {});

          // Highlight "Save changes" button
          await highlightElement('[data-testid="save-profile-button"]');
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '12-edit-profile.png'),
            fullPage: false
          });
          await removeHighlights();
          console.log('✓ Captured 12-edit-profile.png');

          // Close modal - try multiple methods
          console.log('Closing edit profile modal...');

          // Method 1: Click Cancel button (most reliable)
          let modalClosed = false;
          try {
            const cancelButton = page.locator('button.btn-ghost:has-text("Cancel")').first();
            if (await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await cancelButton.click();
              await delay(2000); // Wait for modal to close

              // Verify modal is closed
              const modalStillOpen = await page.locator('.modal.modal-open').isVisible({ timeout: 1000 }).catch(() => false);
              if (!modalStillOpen) {
                modalClosed = true;
                console.log('✓ Modal closed via Cancel button');
              }
            }
          } catch (e) {
            console.log('Cancel button click failed, trying other methods...');
          }

          // Method 2: Click backdrop if Cancel didn't work
          if (!modalClosed) {
            try {
              const backdrop = page.locator('.modal-backdrop').first();
              if (await backdrop.isVisible({ timeout: 2000 }).catch(() => false)) {
                // Click backdrop using coordinates to avoid interception
                const box = await backdrop.boundingBox();
                if (box) {
                  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                  await delay(2000);

                  const modalStillOpen = await page.locator('.modal.modal-open').isVisible({ timeout: 1000 }).catch(() => false);
                  if (!modalStillOpen) {
                    modalClosed = true;
                    console.log('✓ Modal closed via backdrop click');
                  }
                }
              }
            } catch (e) {
              console.log('Backdrop click failed, trying Escape key...');
            }
          }

          // Method 3: Press Escape key
          if (!modalClosed) {
            await page.keyboard.press('Escape');
            await delay(2000);

            const modalStillOpen = await page.locator('.modal.modal-open').isVisible({ timeout: 1000 }).catch(() => false);
            if (!modalStillOpen) {
              modalClosed = true;
              console.log('✓ Modal closed via Escape key');
            }
          }

          // Final verification and force close if needed
          if (!modalClosed) {
            console.log('Warning: Modal still appears to be open, trying force close...');
            // Try clicking the backdrop again with force
            try {
              await page.evaluate(() => {
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                  backdrop.click();
                }
              });
              await delay(2000);
            } catch (e) {
              // Ignore
            }

            // One more Escape key press
            await page.keyboard.press('Escape');
            await delay(2000);

            console.log('Modal close attempted, continuing...');
          }
        } else {
          console.log('Warning: Edit profile button not found');
        }
      }
    } catch (error) {
      console.log(`Warning: Could not capture edit profile screenshot: ${error.message}`);
      // Try to close modal anyway
      try {
        await page.keyboard.press('Escape');
        await delay(1000);
      } catch (e) {
        // Ignore
      }
    }

    // 13. Change password
    console.log('Capturing: 13-change-password.png');
    try {
      if (page.isClosed()) {
        console.log('Warning: Page is closed, cannot capture change password');
      } else {
        // Make sure any open modals are closed first
        try {
          const modal = page.locator('.modal.modal-open').first();
          if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log('Closing any open modals first...');
            // Try Cancel button first
            const cancelBtn = page.locator('button.btn-ghost:has-text("Cancel")').first();
            if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
              await cancelBtn.click();
              await delay(2000);
            } else {
              await page.keyboard.press('Escape');
              await delay(2000);
            }
          }
        } catch (e) {
          // No modal open, continue
        }

        const avatarClicked = await clickAvatar();
        if (avatarClicked) {
          await delay(1500);
          const editProfileBtn = page.locator('text=/Edit profile|edit profile/i').first();
          if (await editProfileBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await editProfileBtn.click();
            await delay(2000); // Wait for modal to open

            // Wait for modal to be visible
            await page.waitForSelector('.modal.modal-open', { timeout: 5000 }).catch(() => {});

            const changePasswordButton = page.locator('[data-testid="change-password-button"]').first();
            if (await changePasswordButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await changePasswordButton.click();
              await delay(1500); // Wait for password form to expand
              // Highlight "Change Password" button
              await highlightElement('[data-testid="submit-change-password-button"]');
              await page.screenshot({
                path: path.join(SCREENSHOT_DIR, '13-change-password.png'),
                fullPage: false
              });
              await removeHighlights();
              console.log('✓ Captured 13-change-password.png');

              // Close modal - use same robust closing logic as edit profile
              console.log('Closing password change modal...');
              let modalClosed = false;

              // Method 1: Click Cancel button
              try {
                const cancelButton = page.locator('button.btn-ghost:has-text("Cancel")').first();
                if (await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                  await cancelButton.click();
                  await delay(2000);

                  const modalStillOpen = await page.locator('.modal.modal-open').isVisible({ timeout: 1000 }).catch(() => false);
                  if (!modalStillOpen) {
                    modalClosed = true;
                    console.log('✓ Modal closed via Cancel button');
                  }
                }
              } catch (e) {
                console.log('Cancel button click failed, trying other methods...');
              }

              // Method 2: Click backdrop
              if (!modalClosed) {
                try {
                  const backdrop = page.locator('.modal-backdrop').first();
                  if (await backdrop.isVisible({ timeout: 2000 }).catch(() => false)) {
                    const box = await backdrop.boundingBox();
                    if (box) {
                      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                      await delay(2000);

                      const modalStillOpen = await page.locator('.modal.modal-open').isVisible({ timeout: 1000 }).catch(() => false);
                      if (!modalStillOpen) {
                        modalClosed = true;
                        console.log('✓ Modal closed via backdrop click');
                      }
                    }
                  }
                } catch (e) {
                  console.log('Backdrop click failed, trying Escape key...');
                }
              }

              // Method 3: Press Escape key
              if (!modalClosed) {
                await page.keyboard.press('Escape');
                await delay(2000);

                const modalStillOpen = await page.locator('.modal.modal-open').isVisible({ timeout: 1000 }).catch(() => false);
                if (!modalStillOpen) {
                  modalClosed = true;
                  console.log('✓ Modal closed via Escape key');
                }
              }

              // Force close if still open
              if (!modalClosed) {
                console.log('Warning: Modal still open, forcing close...');
                try {
                  await page.evaluate(() => {
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                      backdrop.click();
                    }
                  });
                  await delay(2000);
                  await page.keyboard.press('Escape');
                  await delay(2000);
                  console.log('Force close attempted, continuing...');
                } catch (e) {
                  // Ignore
                }
              }
            } else {
              console.log('Warning: Change password button not found');
              // Close modal anyway
              await page.keyboard.press('Escape');
              await delay(1000);
            }
          } else {
            console.log('Warning: Edit profile button not found after avatar click');
          }
        } else {
          console.log('Warning: Could not click avatar for change password');
        }
      }
    } catch (error) {
      console.log(`Warning: Could not capture change password screenshot: ${error.message}`);
      // Try to close modal anyway
      try {
        await page.keyboard.press('Escape');
        await delay(2000);
        await page.keyboard.press('Escape'); // Press twice to be sure
        await delay(1000);
      } catch (e) {
        // Ignore
      }
    }

    // 14. Avatar upload
    console.log('Capturing: 14-avatar-upload.png');
    try {
      if (page.isClosed()) {
        console.log('Warning: Page is closed, cannot capture avatar upload');
      } else {
        // Open profile menu if not already open
        const menuVisible = await page.locator('text=/Edit profile|Dark mode|Sign out/i').isVisible({ timeout: 1000 }).catch(() => false);
        if (!menuVisible) {
          const avatarClicked = await clickAvatar();
          if (!avatarClicked) {
            console.log('Warning: Could not open profile menu for avatar upload screenshot');
            throw new Error('Could not open profile menu');
          }
          await delay(1000);
        }

        // Locate the avatar upload section (button with "Upload photo" or "Change photo" text)
        // We want to scroll this into view WITHOUT clicking it
        const avatarUploadButton = page.locator('[data-testid="upload-avatar-button"]').first();
        const buttonVisible = await avatarUploadButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (buttonVisible) {
          // Scroll the button into view without clicking
          await avatarUploadButton.scrollIntoViewIfNeeded();
          await delay(500);

          // Highlight the upload/change photo button (without clicking)
          await highlightElement(avatarUploadButton);

          // Take screenshot of the avatar section area
          // We'll capture a larger area around the button to show context
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '14-avatar-upload.png'),
            fullPage: false
          });
          await removeHighlights();
          console.log('✓ Captured 14-avatar-upload.png');
        } else {
          // Fallback: just take screenshot of the profile menu
          console.log('Warning: Avatar upload button not found, capturing profile menu');
          await delay(500);
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '14-avatar-upload.png'),
            fullPage: false
          });
          console.log('✓ Captured 14-avatar-upload.png (fallback)');
        }
      }
    } catch (error) {
      console.log(`Warning: Could not capture avatar upload screenshot: ${error.message}`);
    }

    // 15. Dark mode toggle
    console.log('Capturing: 15-dark-mode.png');
    try {
      if (!page.isClosed()) {
        // Should already be visible in profile menu, but reopen if needed
        if (!(await page.locator('text=/Dark mode/i').isVisible({ timeout: 1000 }).catch(() => false))) {
          await clickAvatar();
          await delay(500);
        }

        // Find the dark mode toggle checkbox
        const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]').first();
        const toggleVisible = await darkModeToggle.isVisible({ timeout: 2000 }).catch(() => false);

        if (toggleVisible) {
          // Check current state - if not checked, enable dark mode
          const isChecked = await darkModeToggle.isChecked().catch(() => false);

          if (!isChecked) {
            // Enable dark mode by clicking the toggle
            await darkModeToggle.click();
            await delay(1000); // Wait for theme to change
          }

          // Highlight the dark mode toggle
          await highlightElement('[data-testid="dark-mode-toggle"]');
          await delay(300); // Small delay to ensure highlight is visible

          // Take screenshot with dark mode enabled
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '15-dark-mode.png'),
            fullPage: false
          });
          await removeHighlights();

          // Restore light mode by clicking toggle again
          await darkModeToggle.click();
          await delay(1000); // Wait for theme to change back
          console.log('✓ Captured 15-dark-mode.png and restored light mode');
        } else {
          // Fallback: just take screenshot without toggling
          await highlightElement('input[type="checkbox"].toggle, label:has(input[type="checkbox"].toggle)');
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '15-dark-mode.png'),
            fullPage: false
          });
          await removeHighlights();
          console.log('✓ Captured 15-dark-mode.png (fallback - toggle not found)');
        }
      }
    } catch (error) {
      console.log(`Warning: Could not capture dark mode screenshot: ${error.message}`);
    }

    // 16. Sign out option
    console.log('Capturing: 16-sign-out.png');
    try {
      if (!page.isClosed()) {
        // Should already be visible in profile menu, but reopen if needed
        if (!(await page.locator('text=/Sign out|sign out/i').isVisible({ timeout: 1000 }).catch(() => false))) {
          await clickAvatar();
          await delay(500);
        }
        // Highlight the Sign out button
        await highlightElement('[data-testid="sign-out-button"]');
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '16-sign-out.png'),
          fullPage: false
        });
        await removeHighlights();
      }
    } catch (error) {
      console.log('Warning: Could not capture sign out screenshot');
    }

    console.log('\n✅ All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('Error capturing screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
if (require.main === module) {
  captureScreenshots().catch(error => {
    console.error('Failed to capture screenshots:', error);
    process.exit(1);
  });
}

module.exports = { captureScreenshots };
