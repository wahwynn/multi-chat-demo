# Testing Guide

This document describes how to run tests for the multi-chat-demo project.

## Backend Tests (Django/Python)

The backend uses pytest for testing with pytest-django for Django integration.

### Setup

1. Install dependencies:

   ```bash
   uv sync
   ```

2. Run migrations (tests use a test database):
   ```bash
   uv run python backend/manage.py migrate
   ```

### Running Tests

Run all backend tests:

```bash
uv run pytest
```

Run tests with coverage:

```bash
uv run pytest --cov=chat --cov-report=html
```

Run specific test files:

```bash
uv run pytest backend/chat/test_models.py
uv run pytest backend/chat/test_api.py
uv run pytest backend/chat/test_auth_api.py
uv run pytest backend/chat/test_chatbot.py
```

Run tests in watch mode:

```bash
uv run pytest --watch
```

### Test Structure

- `test_models.py`: Tests for Django models (UserProfile, Conversation, Message)
- `test_api.py`: Tests for chat API endpoints
- `test_auth_api.py`: Tests for authentication API endpoints
- `test_chatbot.py`: Tests for chatbot integration functions (with mocking)

### Test Coverage

The test suite covers:

- Model validation and relationships
- API endpoint authentication and authorization
- API request/response handling
- Error handling
- Edge cases and boundary conditions

## Frontend Tests (Next.js/React)

The frontend uses Jest and React Testing Library for component testing.

### Setup

1. Install dependencies:

   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```

   **Note**: The `--legacy-peer-deps` flag is required due to React 19 compatibility with some testing libraries that expect React 18.

### Running Tests

Run all frontend tests:

```bash
cd frontend
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Test Structure

- `components/__tests__/MessageInput.test.tsx`: Tests for MessageInput component (12 tests)
- `components/__tests__/ChatWindow.test.tsx`: Tests for ChatWindow component (9 tests)
- `lib/__tests__/api.test.ts`: Tests for API client functions (16 tests covering authApi and chatApi)

### Test Configuration

The frontend test setup includes:

- Jest configuration via `jest.config.js` (Next.js Jest preset)
- Test setup file `jest.setup.js` with:
  - `@testing-library/jest-dom` matchers
  - Mock for `Element.prototype.scrollIntoView` (required for jsdom compatibility)
- Axios mocking for API tests (axios.create is mocked to return a consistent instance)

### Writing New Tests

When adding new components or features:

1. Create test files in the same directory structure with `.test.tsx` or `.test.ts` extension
2. Use React Testing Library for component tests
3. Mock external dependencies (API calls, etc.)
4. Test user interactions and component behavior
5. Aim for high coverage of critical paths

## Continuous Integration

For CI/CD pipelines:

**Backend:**

```bash
uv run pytest --cov=chat --cov-report=xml
```

**Frontend:**

```bash
cd frontend && npm test -- --coverage --watchAll=false
```

**Note**: Make sure dependencies are installed with `npm install --legacy-peer-deps` before running tests.

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock external services (APIs, file system, etc.)
3. **Coverage**: Aim for >80% code coverage on critical paths
4. **Naming**: Use descriptive test names that explain what is being tested
5. **Arrange-Act-Assert**: Structure tests with clear setup, action, and assertion phases
