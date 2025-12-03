# Multi-Chat Demo - Setup Instructions

A full-stack chatbot application with Django Ninja backend and Next.js frontend.

## Prerequisites

- Python 3.11+ with `uv` installed
- Node.js 18+ with npm
- Anthropic API key (get one at https://console.anthropic.com/)

## Backend Setup (Django)

1. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

2. **Install dependencies:**
   ```bash
   uv sync
   ```

3. **Run migrations:**
   ```bash
   uv run python backend/manage.py migrate
   ```

4. **Create a superuser (optional, for Django admin):**
   ```bash
   uv run python backend/manage.py createsuperuser
   ```

5. **Run the development server:**
   ```bash
   uv run python backend/manage.py runserver
   ```

   The backend API will be available at http://localhost:8000/api/

## Frontend Setup (Next.js)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   # The default backend URL is already set to http://localhost:8000/api
   ```

3. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

   Note: The `--legacy-peer-deps` flag is required due to a peer dependency conflict between React 19 and some testing libraries that expect React 18. This is safe to use and will not affect functionality.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at http://localhost:3000/

## Running the Application

1. Start the Django backend in one terminal:
   ```bash
   uv run python backend/manage.py runserver
   ```

2. Start the Next.js frontend in another terminal:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

## Features

- Create multiple conversation threads
- Chat with Claude AI assistant
- View conversation history
- Delete conversations
- Responsive UI with Tailwind CSS

## API Endpoints

- `GET /api/chat/conversations` - List all conversations
- `POST /api/chat/conversations` - Create a new conversation
- `GET /api/chat/conversations/{id}` - Get a conversation with messages
- `DELETE /api/chat/conversations/{id}` - Delete a conversation
- `POST /api/chat/conversations/{id}/messages` - Send a message

## Tech Stack

### Backend
- Django 5.2
- Django Ninja (API framework)
- Anthropic Claude API
- SQLite database

### Frontend
- Next.js 16
- React
- TypeScript
- Tailwind CSS
- Axios

## Development

### Backend Commands
```bash
# Run tests
uv run pytest

# Create migrations
uv run python backend/manage.py makemigrations

# Apply migrations
uv run python backend/manage.py migrate

# Access Django admin
# Visit http://localhost:8000/admin
```

### Frontend Commands
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```
