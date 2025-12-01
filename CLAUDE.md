# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack chatbot application with a Django Ninja backend and Next.js/React frontend. Users can create multiple conversation threads and chat with Claude AI. The repository uses `uv` for Python package management and npm for JavaScript dependencies.

## Python Package Management

This project uses `uv` exclusively for all Python package management operations. DO NOT use pip, pip-tools, poetry, or conda.

### Essential Commands

```bash
# Install dependencies
uv sync

# Add a new dependency
uv add <package>

# Remove a dependency
uv remove <package>

# Run Python scripts
uv run python <script>.py

# Run Python tools (e.g., pytest, ruff)
uv run pytest
uv run ruff

# Create/manage virtual environment
uv venv
```

### Project Setup

For new contributors or fresh clones:

```bash
# Backend setup
# 1. Copy environment file and add ANTHROPIC_API_KEY
cp .env.example .env

# 2. Sync dependencies
uv sync

# 3. Run migrations
uv run python manage.py migrate

# 4. Run the Django server
uv run python manage.py runserver

# Frontend setup (in a separate terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

## Architecture

### Backend (Django)

- **Framework**: Django 5.2 with Django Ninja for REST API
- **Database**: SQLite (default, can be changed in settings.py)
- **API Structure**: All endpoints are prefixed with `/api/` and routed through `backend/urls.py`
- **Chat App** (`chat/`):
  - `models.py`: Defines `Conversation` and `Message` models
  - `api.py`: Django Ninja router with REST endpoints for chat operations
  - `chatbot.py`: Handles Anthropic Claude API integration
  - `schemas.py`: Pydantic schemas for request/response validation
  - `admin.py`: Django admin configuration for models

**Key Backend Patterns**:
- CORS is configured to allow requests from Next.js frontend (localhost:3000)
- Messages are stored with conversation history for context-aware responses
- The Anthropic API key is loaded from environment variables via `python-dotenv`

### Frontend (Next.js)

- **Framework**: Next.js 16 with App Router, React, TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios for API communication
- **Structure**:
  - `app/page.tsx`: Main chat interface with state management
  - `components/`: Reusable UI components
    - `ConversationList.tsx`: Sidebar showing all conversations
    - `ChatWindow.tsx`: Message display area
    - `MessageInput.tsx`: Text input for sending messages
  - `lib/`:
    - `api.ts`: API client with all backend endpoints
    - `types.ts`: TypeScript interfaces matching backend schemas

**Key Frontend Patterns**:
- Client-side rendering with React hooks for state management
- Optimistic UI updates with error handling
- Auto-scrolling chat window
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

### Data Flow

1. User sends message → Frontend creates/selects conversation
2. Frontend POST to `/api/chat/conversations/{id}/messages`
3. Backend saves user message to database
4. Backend calls Anthropic Claude API with conversation history
5. Backend saves assistant response and returns both messages
6. Frontend updates UI with new messages

## Development Workflow

### Backend Development
- All Python dependencies must be managed through `uv add` and `uv remove`
- Use `uv run` to execute Python scripts and tools
- Run `uv run python manage.py makemigrations` after model changes
- Run `uv run python manage.py migrate` to apply migrations
- Access Django admin at http://localhost:8000/admin

### Frontend Development
- Run `npm run dev` for development server with hot reload
- Run `npm run build` to check for TypeScript/build errors
- Run `npm run lint` to check for linting issues

## API Endpoints

All endpoints are available at `http://localhost:8000/api/chat/`:

- `GET /conversations` - List all conversations
- `POST /conversations` - Create a new conversation (body: `{title: string}`)
- `GET /conversations/{id}` - Get conversation with all messages
- `DELETE /conversations/{id}` - Delete a conversation
- `POST /conversations/{id}/messages` - Send message and get AI response (body: `{content: string}`)

Django Ninja provides automatic API documentation at `http://localhost:8000/api/docs`

## Environment Variables

### Backend (.env)
- `ANTHROPIC_API_KEY`: Your Anthropic API key for Claude integration (required)
- `SECRET_KEY`: Django secret key (auto-generated, keep secure in production)
- `DEBUG`: Django debug mode (set to False in production)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000/api)

## Project Configuration

The `.gitignore` is configured for:
- Python build artifacts, caches, and virtual environments
- Node.js modules and build outputs
- Environment files (.env, .env.local)
- IDE-specific files (PyCharm, VSCode, Cursor)
- Database files (db.sqlite3)
