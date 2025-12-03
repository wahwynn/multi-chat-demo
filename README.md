# multi-chat-demo

A full-stack chatbot application with Django Ninja backend and Next.js frontend that allows users to chat with multiple AI models simultaneously.

## Features

- Multi-model chat interface (Claude, Ollama, etc.)
- User authentication and profiles
- Conversation management
- Real-time responses from multiple AI models

## Quick Start

See [README_SETUP.md](README_SETUP.md) for detailed setup instructions.

## Testing

The project includes comprehensive test suites for both backend and frontend.

### Backend Tests

Run backend tests:
```bash
uv run pytest
```

### Frontend Tests

Run frontend tests:
```bash
cd frontend
npm test
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

## Project Structure

- `backend/`: Django backend with Django Ninja API
- `frontend/`: Next.js frontend with React and TypeScript
- `backend/chat/tests.py`: Backend test files
- `frontend/components/__tests__/`: Frontend component tests

## License

See [LICENSE](LICENSE) file for details.
