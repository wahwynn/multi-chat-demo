# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Full-stack chatbot app: Django Ninja backend (port 8000) + Next.js frontend (port 3000) with SQLite. See `CLAUDE.md` for full architecture and API docs.

### Running services

```bash
# Backend (from repo root)
uv run python backend/manage.py migrate
uv run python backend/manage.py runserver 0.0.0.0:8000

# Frontend (from frontend/)
cd frontend && npm run dev
```

### Lint / Test / Build

| Service  | Lint                          | Test                              | Build                        |
|----------|-------------------------------|-----------------------------------|------------------------------|
| Backend  | `uv run ruff check backend/` | `uv run pytest backend/`         | N/A                          |
| Frontend | `npm run lint` (in frontend/) | `npm test` (in frontend/)        | `npm run build` (in frontend/) |

### Gotchas

- Python **>=3.13** is required (`pyproject.toml`). The VM ships with 3.12; `uv python install 3.13` is needed before `uv sync`.
- Frontend `npm install` needs `--legacy-peer-deps` due to `@testing-library/react@14` peer conflict with React 19.
- AI model providers (Anthropic, GitHub Models, Ollama) are all optional. The app starts and users can register/login without any API keys, but at least one provider must be configured for chat to work. The `GITHUB_API_KEY` secret enables GitHub Models.
- Backend `.env` and frontend `.env.local` are created from their `.example` counterparts; they are gitignored.
