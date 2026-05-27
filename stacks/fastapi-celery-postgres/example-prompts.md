# Example prompts · FastAPI + Celery + Postgres + pytest

Prompts that should land cleanly with this AGENTS.md loaded. Use as verification smoke tests.

## 1. Paginated endpoint

> Add `GET /api/v1/users` returning users with keyset pagination (20 per page) by id desc. Include a pytest test using httpx ASGITransport.

What good looks like: `src/app/api/v1/users.py` APIRouter; `UserRead` Pydantic DTO; service in `src/app/services/users.py`; test in `tests/api/test_users.py` using AsyncClient; no LIMIT/OFFSET past page 50.

## 2. Idempotent Celery task

> Add a Celery task `send_welcome_email(user_id)` that sends via SendGrid. Idempotent. Retry on IOError up to 5 times with exponential backoff.

What good looks like: `src/app/tasks/email.py` with `@shared_task(bind=True, autoretry_for=(IOError,), retry_backoff=True, max_retries=5)`; idempotency check at top; test in `tests/tasks/test_email.py` using `task.apply()`.

## 3. Alembic migration with backfill

> The `users.timezone` column needs to become NOT NULL, default 'UTC'. Write the Alembic revision plus a backfill script, in two separate revisions.

What good looks like: revision A adds nullable column with default; revision B backfills; revision C (later PR) sets NOT NULL. The agent should not combine these.

## 4. Service-layer extraction

> The endpoint `POST /api/v1/posts` has 80 lines of logic inline. Extract to `src/app/services/posts.py`. Add a service-layer test.

What good looks like: thin endpoint that calls `await create_post(session, data)`; service returns `PostRead`; service-layer test in `tests/services/test_posts.py`; no `HTTPException` in the service.

## 5. External API integration

> Add an `OpenAIClient` that hits the chat completion endpoint. Use the External APIs pattern from AGENTS.md. Stub the call via respx in a unit test.

What good looks like: implementation reads credentials per the chosen pattern (env, Doppler, or Authsome); `respx` mock in the test; no real network call.
