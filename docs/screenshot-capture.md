# Automated Screenshot Capture

The project includes an automated screenshot capture script that uses Playwright to generate screenshots for the help documentation.

## Prerequisites

- Playwright installed (included in frontend dependencies)
- Application running at `http://localhost:3000`
- Backend API running at `http://localhost:8000`

## Running the Screenshot Script

1. **Start the application** (if not already running):

   ```bash
   # Terminal 1: Start backend
   uv run python backend/manage.py runserver

   # Terminal 2: Start frontend
   cd frontend
   npm run dev
   ```

2. **Run the screenshot script**:

   ```bash
   node docs/makedocs/capture-screenshots.js
   ```

   Or from the project root:

   ```bash
   node docs/makedocs/capture-screenshots.js
   ```

3. **Screenshots will be saved** to `docs/screenshots/` directory:
   - `01-welcome-screen.png`
   - `02-sign-up.png`
   - `03-sign-in.png`
   - `04-new-conversation.png`
   - `05-model-selection.png`
   - `06-rename-conversation.png`
   - `07-delete-conversation.png`
   - `08-message-input.png`
   - `09-chat-responses.png`
   - `10-multi-model-responses.png`
   - `11-profile-menu.png`
   - `12-edit-profile.png`
   - `13-change-password.png`
   - `14-avatar-upload.png`
   - `15-dark-mode.png`
   - `16-sign-out.png`

## How It Works

The script:

- Automatically creates a test user if one doesn't exist
- Navigates through the application UI
- Captures screenshots at key interaction points
- Saves all screenshots to the `docs/screenshots/` directory

## Manual Screenshot Capture

For manual screenshot capture, see [makedocs/screenshot-guide.md](makedocs/screenshot-guide.md) for detailed instructions and best practices.
