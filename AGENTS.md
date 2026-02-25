# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Full-stack multi-model AI chatbot: Django Ninja backend (port 8000) + Next.js 16 frontend (port 3000). See `CLAUDE.md` for full architecture details, API endpoints, and data flow.

### Running services

- **Backend**: `uv run python backend/manage.py runserver` (SQLite DB, no external services needed)
- **Frontend**: `cd frontend && npm run dev`
- At least one AI provider must be configured in `.env` for chat to work: `ANTHROPIC_API_KEY`, `GITHUB_API_KEY`, or a running Ollama instance. The app starts and the UI works without any provider, but creating conversations requires at least one available model.

### Key commands

| Task | Command |
|---|---|
| Backend lint | `uv run ruff check backend/` |
| Backend tests | `uv run pytest` |
| Frontend lint | `cd frontend && npm run lint` |
| Frontend tests | `cd frontend && npm test` |
| Frontend build | `cd frontend && npm run build` |
| DB migrations | `uv run python backend/manage.py migrate` |
| Make migrations | `uv run python backend/manage.py makemigrations` |

### Non-obvious caveats

- **Python >=3.13 required**: The VM ships with 3.12; the update script installs 3.13 via `uv python install`.
- **npm peer dep conflict**: `@testing-library/react@14` conflicts with React 19. Use `npm install --legacy-peer-deps` (already in the update script).
- **Environment files**: Copy `.env.example` -> `.env` and `frontend/.env.local.example` -> `frontend/.env.local` before first run. These are not created by the update script since they may contain user secrets.
- **Migrations**: Run `uv run python backend/manage.py migrate` after pulling changes that add new migrations. This is not in the update script to avoid brittleness.
