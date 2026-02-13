# Multi-Chat Demo

A full-stack chatbot application with Django Ninja backend and Next.js frontend that allows users to chat with multiple AI models simultaneously and compare their responses in real-time.

## Features

### Core Functionality

- **Multi-model chat interface**: Chat with multiple AI models simultaneously
  - Claude 4.5 Sonnet, Haiku, and Opus
  - Ollama models (Llama 3.2, Llama 3.1, Mistral, Phi-3)
  - GitHub Models (GPT-4.1, GPT-4o, Llama 3.2 90B Vision)
  - Parallel response generation from all selected models
- **User authentication**: Secure sign up, sign in, and logout
- **User profiles**:
  - Avatar upload with image validation and processing
  - Profile editing (username, email)
  - Password change functionality
- **Conversation management**:
  - Create conversations with custom model selections
  - Rename conversations
  - Delete conversations
  - Conversation history with context window support
  - Your selected default models are automatically saved and restored across sessions
- **Modern UI**:
  - Dark mode toggle
  - Responsive design with Tailwind CSS and DaisyUI
  - Real-time message updates
  - Loading indicators for async operations

### Technical Features

- Context window management (configurable, default: 10 recent messages)
- Secure avatar upload with image validation, resizing, and metadata stripping
- Session-based authentication with CORS support
- Comprehensive error handling

## Tech Stack

### Backend

- **Framework**: Django 5.2 with Django Ninja (REST API)
- **Language**: Python 3.13+
- **AI Integration**:
  - Anthropic Claude API
  - Ollama API (local or remote)
- **Database**: SQLite (development)
- **Package Management**: uv
- **Key Dependencies**:
  - django-ninja >= 1.5.0
  - anthropic >= 0.75.0
  - httpx >= 0.27.0
  - pillow >= 11.0.0 (for image processing)

### Frontend

- **Framework**: Next.js 16.0.6
- **Language**: TypeScript
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 3.4.18 with DaisyUI 5.5.5
- **HTTP Client**: Axios 1.13.2
- **Testing**: Jest with React Testing Library

## Quick Start

See [README_SETUP.md](README_SETUP.md) for detailed setup instructions.

### Prerequisites

- Python 3.13+ with `uv` installed
- Node.js 18+ with npm
- Anthropic API key (optional, for Claude models)
- Ollama (optional, for local Ollama models)

### Quick Setup

1. **Backend Setup**:

   ```bash
   # Install dependencies
   uv sync

   # Set up environment variables
   # Create .env file (optionally add ANTHROPIC_API_KEY for Claude models)

   # Run migrations
   uv run python backend/manage.py migrate

   # Start server
   uv run python backend/manage.py runserver
   ```

2. **Frontend Setup**:

   ```bash
   cd frontend
   npm install --legacy-peer-deps
   npm run dev
   ```

3. **Access the application**: http://localhost:3000

## User Guide

📖 **Need help using the application?** Check out the comprehensive [Documentation](docs/) with step-by-step guides, screenshots, and FAQs.

- [Quick Start Guide](docs/quick-start.md) - Get started in minutes
- [Full User Guide](docs/index.md) - Complete documentation with screenshots
- [FAQ](docs/faq.md) - Frequently asked questions

## Presentations

🎥 **Interactive Slideshows**:

- [Demo Slideshow](docs/demo-slideshow.html) - Product features and user experience walkthrough
- [Tech Slideshow](docs/tech-slideshow.html) - Technical architecture, testing, and CI/CD overview

## API Endpoints

### Authentication (`/api/auth/`)

- `GET /me` - Get current user info
- `POST /login` - Sign in
- `POST /logout` - Sign out
- `POST /register` - Create account
- `PATCH /profile` - Update profile
- `POST /change-password` - Change password
- `POST /avatar` - Upload avatar
- `DELETE /avatar` - Delete avatar

### Chat (`/api/chat/`)

- `GET /conversations` - List all conversations
- `POST /conversations` - Create new conversation
- `GET /conversations/{id}` - Get conversation with messages
- `PATCH /conversations/{id}` - Update conversation title
- `DELETE /conversations/{id}` - Delete conversation
- `POST /conversations/{id}/messages` - Send message and get responses

## Testing

The project includes comprehensive test suites for both backend and frontend.

### Backend Tests

Run all backend tests:

```bash
uv run pytest
```

Run with coverage:

```bash
uv run pytest --cov=chat --cov-report=html
```

Run specific test files:

```bash
uv run pytest backend/tests/test_models.py
uv run pytest backend/tests/test_api.py
uv run pytest backend/tests/test_auth_api.py
uv run pytest backend/tests/test_chatbot.py
```

### Frontend Tests

Run all frontend tests:

```bash
cd frontend
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

Run in watch mode:

```bash
npm run test:watch
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

## Automated Screenshot Capture

The project includes an automated screenshot capture script using Playwright for generating documentation screenshots. See [docs/makedocs/screenshot-guide.md](docs/makedocs/screenshot-guide.md) for detailed instructions.

## Project Structure

```
multi-chat-demo/
├── backend/                 # Django backend
│   ├── chat/               # Main chat application
│   │   ├── models.py       # Database models (UserProfile, Conversation, Message)
│   │   ├── api.py          # Chat API endpoints
│   │   ├── auth_api.py     # Authentication API endpoints
│   │   ├── chatbot.py      # AI model integration (Claude, Ollama)
│   │   ├── schemas.py      # API schemas
│   │   └── test_*.py       # Test files
│   ├── config/             # Django configuration
│   │   ├── settings.py     # Django settings
│   │   └── urls.py         # URL routing
│   └── manage.py           # Django management script
├── frontend/               # Next.js frontend
│   ├── app/                # Next.js app directory
│   │   ├── page.tsx        # Main page component
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── AuthPage.tsx    # Authentication UI
│   │   ├── ChatWindow.tsx  # Chat display component
│   │   ├── ConversationList.tsx  # Conversation sidebar
│   │   ├── MessageInput.tsx      # Message input component
│   │   └── ThemeProvider.tsx     # Theme context
│   ├── lib/                # Utility libraries
│   │   ├── api.ts          # API client functions
│   │   └── types.ts        # TypeScript type definitions
│   └── components/__tests__/  # Component tests
├── docs/                   # User documentation (GitHub Docs format)
│   ├── index.md            # Main user guide
│   ├── quick-start.md      # Quick start guide
│   ├── faq.md              # Frequently asked questions
│   ├── makedocs/           # Build tools and guides
│   │   ├── capture-screenshots.js
│   │   ├── create-placeholders.html
│   │   └── screenshot-guide.md  # Automated screenshot instructions
│   └── screenshots/        # Documentation screenshots
├── pyproject.toml          # Python project configuration
├── README_SETUP.md         # Detailed setup instructions
└── TESTING.md              # Testing documentation
```

## Development

### Backend Commands

```bash
# Run development server
uv run python backend/manage.py runserver

# Create migrations
uv run python backend/manage.py makemigrations

# Apply migrations
uv run python backend/manage.py migrate

# Create superuser
uv run python backend/manage.py createsuperuser

# Run tests
uv run pytest

# Type checking
uv run mypy backend/
```

### Frontend Commands

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint

# Run tests
npm test
```

## Environment Variables

### Backend (.env)

- `ANTHROPIC_API_KEY` - Your Anthropic API key (optional, for Claude models)
- `GITHUB_API_KEY` - GitHub fine-grained personal access token with `models: read` scope (required for GitHub Models)
- `OLLAMA_BASE_URL` - Ollama API base URL (default: http://localhost:11434)
- `CHAT_CONTEXT_WINDOW_SIZE` - Number of recent messages to include in context (default: 10)

### Frontend (.env.local)

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000/api)

## Supported AI Models

### Claude Models (via Anthropic API)

- `claude-sonnet-4-5` - Claude 4.5 Sonnet
- `claude-haiku-4-5` - Claude 4.5 Haiku
- `claude-opus-4-5` - Claude 4.5 Opus

### Ollama Models (via Ollama API)

- `ollama-llama3.2` - Llama 3.2
- `ollama-llama3.1` - Llama 3.1
- `ollama-mistral` - Mistral
- `ollama-phi3` - Phi-3

**Note**: Ollama models require a running Ollama instance. Install from [ollama.ai](https://ollama.ai) and ensure the models are pulled locally.

### GitHub Models (via GitHub Models API)

- `github-openai/gpt-4.1` - OpenAI GPT-4.1
- `github-openai/gpt-4o-mini` - OpenAI GPT-4o Mini
- `github-openai/gpt-4o` - OpenAI GPT-4o
- `github-meta/llama-3.2-90b-vision-instruct` - Meta Llama 3.2 90B Vision

**Note**: GitHub Models require a fine-grained personal access token with `models: read` scope. Create one at [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens). See [GitHub Models API docs](https://docs.github.com/en/rest/models/inference).

## License

See [LICENSE](LICENSE) file for details.
