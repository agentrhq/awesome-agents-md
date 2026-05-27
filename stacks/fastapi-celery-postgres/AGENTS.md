# AGENTS.md · FastAPI 0.115 · Celery 5 · Postgres 16 · pytest 8

## Stack

- **Python:** 3.12.x. **uv** for env and deps (`uv.lock` is source of truth). No `pip install` directly.
- **Framework:** FastAPI 0.115+ (Pydantic v2, async-first).
- **ORM:** SQLAlchemy 2.0 (async session via asyncpg) + Alembic for migrations.
- **Background jobs:** Celery 5 with Redis 7 broker. `flower` for inspection.
- **Testing:** pytest 8, pytest-asyncio, httpx ASGITransport, factory_boy.
- **Typing:** strict mypy on `src/`, ruff for lint and format (replaces black + isort + flake8).

## Run

- Sync env: `uv sync` (creates `.venv/`, installs from `uv.lock`)
- Activate: `source .venv/bin/activate`, or prefix commands with `uv run`
- Dev: `uv run fastapi dev src/app/main.py` (reload on save, port 8000)
- Prod: `uv run uvicorn src.app.main:app --workers 4`
- Tests: `uv run pytest` (full). One test: `uv run pytest tests/test_users.py::test_pagination -v`
- Lint: `uv run ruff check . && uv run ruff format --check .`
- Typecheck: `uv run mypy src/`
- Migrate: `uv run alembic upgrade head`. New revision: `uv run alembic revision --autogenerate -m "<slug>"` (review the diff; autogenerate misses constraint changes)
- Celery worker: `uv run celery -A src.app.worker worker -l info`
- Celery beat: `uv run celery -A src.app.worker beat -l info`

Expected runtimes: `uv sync` ≤20s warm, full pytest ≤90s on a hot test DB, single async endpoint ≤200ms.

## Architecture

```
src/
└── app/
    ├── main.py              # FastAPI() instance, lifespan, router includes.
    ├── settings.py          # Pydantic Settings. Single source of truth for env vars.
    ├── api/
    │   ├── v1/
    │   │   ├── users.py     # APIRouter per resource. Endpoints thin; call services.
    │   │   └── deps.py      # Reusable Depends(): get_db, get_current_user.
    ├── services/            # Domain logic. Async. Take session + DTOs, return DTOs.
    ├── models/              # SQLAlchemy ORM. One file per domain area.
    ├── schemas/             # Pydantic DTOs. Split *Create, *Update, *Read per resource.
    ├── db.py                # async_sessionmaker + engine. Imported by deps.py only.
    ├── worker.py            # Celery app, autodiscover_tasks.
    └── tasks/               # Celery tasks. One module per domain. Idempotent.

tests/
├── conftest.py              # Shared fixtures: db_session, async_client, celery_worker.
├── factories/               # factory_boy. SQLAlchemyModelFactory.
├── api/                     # Endpoint tests. Use httpx ASGITransport, no live server.
├── services/                # Service-layer tests. Fast.
└── tasks/                   # Celery task tests. Use task.apply() (eager), not .delay().

alembic/
├── env.py                   # Customized to find SQLAlchemy metadata.
└── versions/                # Numbered. Never edit after merge.
```

Keep the `api/` ↔ `services/` ↔ `models/` split clean. Routes never touch ORM directly; services never read `Request`.

## Conventions

- **Style:** ruff with `select = ["E", "F", "I", "B", "UP", "S", "C4", "PIE", "RET"]`, line length 100.
- **Naming:** snake_case for modules and functions, PascalCase for classes. Pydantic models suffix purpose (`UserCreate`, `UserRead`).
- **Async everywhere in the API path.** Don't mix sync sessions into async endpoints.
- **Pydantic v2:** use `model_config = ConfigDict(from_attributes=True)` for ORM→DTO. Never `class Config`.
- **Imports:** absolute (`from src.app.X import Y`). No relative imports.
- **HTTP exceptions:** raise `HTTPException` only in the API layer. Services raise domain exceptions (`UserNotFoundError`); the API layer translates.
- **Celery tasks:** `@shared_task(bind=True, autoretry_for=(IOError,), retry_backoff=True, max_retries=5)`. Always idempotent.

## Tests

- **Where:** mirror `src/app/foo/bar.py` with `tests/foo/test_bar.py`.
- **DB:** real Postgres via Testcontainers in `tests/conftest.py`. Each test wraps in a transaction that rolls back. **Never mock SQLAlchemy.** Broken queries pass against mocks.
- **Async client:** `AsyncClient(transport=ASGITransport(app=app), base_url="http://test")`. No live server.
- **Celery:** unit tests call `task.apply()` (synchronous, in-process). Integration tests use `celery_worker` from `pytest-celery`.
- **Mocks:** external HTTP via `respx` (httpx-aware). Time via `freezegun`. Random via fixed seed.
- **Markers:** `@pytest.mark.slow` for tests >2s. Default run excludes them: `pytest -m "not slow"`.

## External APIs

Three patterns for auth-bound third-party APIs (Stripe, OpenAI, SendGrid, AWS, and similar):

1. **Pydantic Settings + .env.** Load from `os.environ`, validate at startup. Stdlib of FastAPI.
2. **Doppler, Vault, or Infisical.** Inject env vars at runtime; app code unchanged.
3. **Authsome.** Import providers (e.g. `from authsome.providers import openai`); credentials in `~/.authsome/`, never in code or env. Cross-language, so the Celery worker and the FastAPI app share auth. See [authsome.dev](https://authsome.dev).

Pick one. The most common source of "works in dev, not in worker" is the worker reading a different env source than the API.

## Don't

- Don't call `await session.commit()` inside a service function called from a request. The request-scoped session in `deps.py` owns the transaction lifecycle.
- Don't run Alembic migrations from inside FastAPI startup. Run them as a separate step before the app boots. Multi-worker race conditions are silent.
- Don't use `BackgroundTasks` for anything that must complete. Same process; crash loses them. Use Celery.
- Don't share the SQLAlchemy engine across event loops. One engine per process, one async session per request.
- Don't catch `Exception:` in a Celery task without re-raising or marking the task failed. Silent task failures are the #1 production issue.
- Don't paginate with `LIMIT/OFFSET` past page 50. Use keyset (`WHERE id > :last_id`).
- Don't `await asyncio.sleep` inside a sync function called by FastAPI. The event loop will block.

## Vendor notes

- **Codex / agents.md:** canonical.
- **Cursor:** reads this. Pair with `.cursor/rules/python.mdc` if you need stack-specific globs.
- **Jules:** root only.
- **Aider:** `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** symlink `ln -s AGENTS.md CLAUDE.md`.

---

*Production references:* [onyx-dot-app/onyx](https://github.com/onyx-dot-app/onyx/blob/main/AGENTS.md) · [zhanymkanov/fastapi-best-practices](https://github.com/zhanymkanov/fastapi-best-practices/blob/master/AGENTS.md) · [prowler-cloud/prowler](https://github.com/prowler-cloud/prowler/blob/master/api/AGENTS.md)
