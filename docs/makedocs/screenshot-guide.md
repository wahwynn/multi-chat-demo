# Screenshot Capture Guide

This guide provides instructions for capturing screenshots to include in the help documentation.

## Prerequisites

- The application should be running locally
- A browser with developer tools access
- Screenshot capture tool (browser DevTools, macOS Screenshot, or third-party tool)

## Screenshot Tools

### macOS

- **Built-in**: `Cmd + Shift + 4` for area selection, `Cmd + Shift + 3` for full screen
- **Preview**: File → Take Screenshot
- **Third-party**: CleanShot X, Snagit, etc.

### Windows

- **Built-in**: `Win + Shift + S` for Snipping Tool
- **Third-party**: Greenshot, ShareX, etc.

### Linux

- **Built-in**: `Print Screen` or `Shift + Print Screen`
- **Third-party**: Flameshot, Shutter, etc.

### Browser DevTools

- Chrome/Edge: `F12` → More tools → Capture screenshot
- Firefox: `F12` → Settings → Screenshots

## Screenshot Checklist

Capture the following screenshots and save them in the `docs/screenshots/` directory with the specified filenames:

### 1. Welcome/Authentication Screens

- [ ] `01-welcome-screen.png` - Initial landing page (before login)
- [ ] `02-sign-up.png` - Sign up form with all fields visible
- [ ] `03-sign-in.png` - Sign in form

### 2. Main Interface

- [ ] `04-new-conversation.png` - Sidebar with "New Chat" button and model selection visible
- [ ] `05-model-selection.png` - Model selection dropdown open with multiple models checked
- [ ] `06-rename-conversation.png` - Conversation being renamed (edit mode active)
- [ ] `07-delete-conversation.png` - Delete confirmation dialog

### 3. Chat Interface

- [ ] `08-message-input.png` - Message input area at bottom of screen
- [ ] `09-chat-responses.png` - Chat window showing user message and at least one AI response
- [ ] `10-multi-model-responses.png` - Multiple AI model responses displayed together

### 4. Profile & Settings

- [ ] `11-profile-menu.png` - Profile dropdown menu open
- [ ] `12-edit-profile.png` - Edit profile modal open
- [ ] `13-change-password.png` - Change password form expanded
- [ ] `14-avatar-upload.png` - Avatar section in profile menu
- [ ] `15-dark-mode.png` - Profile menu showing dark mode toggle
- [ ] `16-sign-out.png` - Profile menu with sign out option visible

## Capture Instructions

### Screenshot Specifications

- **Format**: PNG (preferred) or JPG
- **Resolution**: 1728x1080 (1080p height, 16:10 aspect ratio) - standardized for consistency
- **Aspect Ratio**: Maintain original aspect ratio
- **File Size**: Optimize images to keep under 500KB each if possible

### Step-by-Step Capture Process

1. **Start the Application**

   ```bash
   # Terminal 1: Start backend
   uv run python backend/manage.py runserver

   # Terminal 2: Start frontend
   cd frontend
   npm run dev
   ```

2. **Open Browser**

   - Navigate to `http://localhost:3000`
   - Use a clean browser window (or incognito mode)
   - Set browser zoom to 100%

3. **Capture Each Screenshot**

   **For 01-welcome-screen.png:**

   - Open the app in a logged-out state
   - Capture the full authentication page
   - Ensure the gradient background and form are visible

   **For 02-sign-up.png:**

   - Click "Sign up" if needed
   - Fill in sample data (or leave empty)
   - Capture the form with all fields visible

   **For 03-sign-in.png:**

   - Switch to sign-in view
   - Capture the sign-in form

   **For 04-new-conversation.png:**

   - Log in with a test account
   - Capture the sidebar showing:
     - Model selection dropdown
     - "New Chat" button
     - Empty or existing conversation list

   **For 05-model-selection.png:**

   - Click the model selection dropdown
   - Select multiple models (checkboxes visible)
   - Capture the open dropdown

   **For 06-rename-conversation.png:**

   - Create a conversation
   - Double-click or click edit button
   - Capture while the title is in edit mode

   **For 07-delete-conversation.png:**

   - Click delete button on a conversation
   - Capture the confirmation modal

   **For 08-message-input.png:**

   - Select a conversation
   - Capture the message input area at the bottom
   - Show placeholder text if possible

   **For 09-chat-responses.png:**

   - Send a message
   - Wait for at least one response
   - Capture showing:
     - User message with avatar
     - At least one AI response card
     - Timestamps visible

   **For 10-multi-model-responses.png:**

   - Create a conversation with multiple models
   - Send a message
   - Wait for multiple responses
   - Capture showing 2-3 different model responses

   **For 11-profile-menu.png:**

   - Click avatar in top-right
   - Capture the dropdown menu open
   - Show all menu options

   **For 12-edit-profile.png:**

   - Open profile menu
   - Click "Edit profile"
   - Capture the modal with form fields

   **For 13-change-password.png:**

   - Open edit profile modal
   - Click "Change password"
   - Capture the expanded password form

   **For 14-avatar-upload.png:**

   - Open profile menu
   - Scroll to avatar section
   - Capture showing upload/change buttons

   **For 15-dark-mode.png:**

   - Open profile menu
   - Capture showing the dark mode toggle
   - Preferably show it in the "on" state

   **For 16-sign-out.png:**

   - Open profile menu
   - Scroll to bottom
   - Capture showing sign out option

### Tips for Better Screenshots

1. **Consistency**

   - Use the same browser for all screenshots
   - Use the same theme (light or dark) unless showing theme toggle
   - Maintain consistent window size

2. **Clarity**

   - Remove any personal/sensitive information
   - Use test data that's clear and readable
   - Ensure text is legible

3. **Composition**

   - Center important elements
   - Include enough context (surrounding UI)
   - Crop unnecessary whitespace after capture

4. **Anonymity**

   - Use generic usernames (e.g., "testuser", "demo")
   - Use placeholder emails (e.g., "user@example.com")
   - Blur or replace any real personal data

5. **File Naming**
   - Use the exact filenames specified
   - Use lowercase with hyphens
   - Include the number prefix for ordering

## Post-Processing

After capturing screenshots:

1. **Review**: Check each screenshot for clarity and completeness
2. **Crop**: Remove unnecessary browser chrome or empty space
3. **Optimize**: Compress images if they're too large (use tools like TinyPNG, ImageOptim)
4. **Verify**: Ensure filenames match exactly what's referenced in the documentation

## Automated Screenshot Script

You can use Playwright or Puppeteer to automate screenshot capture. Here's a basic example:

```javascript
// screenshot-capture.js
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport size (1080p height, 16:10 aspect ratio)
  await page.setViewportSize({ width: 1728, height: 1080 });

  // Navigate to app
  await page.goto("http://localhost:3000");

  // Capture welcome screen
  await page.screenshot({ path: "docs/screenshots/01-welcome-screen.png" });

  // Continue for other screenshots...

  await browser.close();
})();
```

## Verification

After capturing all screenshots:

1. Verify all 16 screenshots exist in `docs/screenshots/`
2. Check that filenames match exactly (case-sensitive)
3. Open `docs/index.md` and verify all image references work
4. Test that images display correctly in markdown viewers

## Updating Screenshots

When the UI changes:

1. Identify which screenshots need updating
2. Follow the capture process for those specific screenshots
3. Replace the old files with new ones (keep same filenames)
4. Update documentation if UI changes affect the instructions

---

**Note**: If you're using a different theme or have custom styling, consider capturing both light and dark mode versions, or specify which theme is shown in the documentation.
