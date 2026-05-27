# AGENTS.md · Django 5.2 LTS · DRF 3.16 · Celery 5.5 · Postgres 16 · pytest 8

## Stack

- **Python:** 3.13.x. **uv** for env and deps (`uv.lock` is source of truth). No `pip install` directly.
- **Framework:** Django 5.2 LTS, Django REST Framework 3.16.
- **Background jobs:** Celery 5.5 with Redis 7 broker. `flower` for inspection.
- **Database:** Postgres 16. Django ORM. No second ORM.
- **Testing:** pytest 8, pytest-django, factory_boy, responses for HTTP.
- **Typing:** mypy + django-stubs on `src/project/`, ruff for lint and format.

## Run

- Sync env: `uv sync` (creates `.venv/`, installs from `uv.lock`)
- Activate: `source .venv/bin/activate`, or prefix with `uv run`
- Dev: `uv run python src/manage.py runserver 0.0.0.0:8000` (uses `DJANGO_SETTINGS_MODULE=project.settings.local`)
- Prod: `uv run gunicorn project.wsgi:application --workers 4` (or `--worker-class uvicorn.workers.UvicornWorker` if you have async views)
- Tests: `uv run pytest` (full). One test: `uv run pytest src/project/apps/users/tests/test_views.py::test_pagination -v`
- Fast iteration: `uv run pytest --reuse-db` (skips schema rebuild between runs)
- Lint: `uv run ruff check . && uv run ruff format --check .`
- Typecheck: `uv run mypy src/project/`
- Migrations: `uv run python src/manage.py makemigrations <app>` then `uv run python src/manage.py migrate`. Review the generated file before commit.
- Celery worker: `uv run celery -A project worker -l info -Q default,critical`
- Celery beat: `uv run celery -A project beat -l info`

Expected runtimes: `uv sync` ≤20s warm, full pytest ≤2m with `--reuse-db`, `runserver` cold start ≤4s.

## Architecture

```
src/
├── manage.py
└── project/
    ├── settings/
    │   ├── base.py             # Shared. Reads env via django-environ.
    │   ├── local.py            # DEBUG=True, console email, SQLite optional.
    │   └── prod.py             # DEBUG=False, sentry, secure cookies.
    ├── urls.py                 # Root URLconf. Includes per-app urls.
    ├── celery.py               # Celery app, autodiscover_tasks().
    └── apps/
        └── <domain>/           # One Django app per bounded context.
            ├── apps.py
            ├── models.py       # ORM models. Methods stay thin.
            ├── views.py        # DRF ViewSets. Endpoints thin; call services.
            ├── serializers.py  # DRF serializers. Per-action when they diverge.
            ├── services.py     # Domain logic. Pure functions, take querysets and DTOs.
            ├── tasks.py        # Celery tasks for this app. Idempotent.
            ├── urls.py         # Router. Included in project/urls.py.
            ├── admin.py        # Django admin registrations.
            └── tests/          # pytest-django tests, mirroring module names.
```

Keep the `views.py` ↔ `services.py` ↔ `models.py` split clean. Views never write to the ORM directly; services never touch `request`.

## Conventions

- **Style:** ruff with `select = ["E", "F", "I", "B", "UP", "DJ", "S"]`, line length 100. `DJ` enables Django-specific lints.
- **Settings:** never import `django.conf.settings` outside Django context. Read env once via `django-environ` in `settings/base.py`.
- **Views:** prefer DRF `ViewSet` + `Router` over function views. Default to sync. Use `async def` views only when the view's I/O is genuinely async-aware end-to-end (httpx, async ORM helpers in 5.x); mixing async views with sync ORM calls is the most common Django footgun.
- **Serializers:** explicit `fields = [...]`, never `__all__`. Validation in `validate_<field>` or `validate`.
- **Migrations:** one logical change per migration. Squash only with `squashmigrations`, never by hand-editing.
- **Errors:** services raise domain exceptions (`UserNotFoundError`); views translate via DRF `exception_handler`.
- **Celery tasks:** `@shared_task(bind=True, autoretry_for=(IOError,), retry_backoff=True, max_retries=5)`. Pass IDs, not ORM instances.

## Tests

- **Where:** under `src/project/apps/<app>/tests/test_<module>.py`. pytest-django auto-discovers.
- **DB:** real Postgres, `--reuse-db` for speed. Each test wraps in a transaction that rolls back (`@pytest.mark.django_db`). Never mock the ORM. Broken querysets pass against mocks.
- **Client:** DRF `APIClient` for endpoint tests. No live server.
- **Celery:** `CELERY_TASK_ALWAYS_EAGER=True` in test settings. Call `task.delay(...)` and it runs in-process.
- **Mocks:** external HTTP via `responses`. Time via `freezegun`. Use `factory_boy` for fixtures, not raw `Model.objects.create`.
- **Markers:** `@pytest.mark.slow` for tests over 2s. Default run excludes them.

## Ops

- **Observability:** `sentry-sdk[django,celery]` covers errors and traces for both web and worker. `django-prometheus` exposes `/metrics` for Prometheus scrape. Structured logs through `structlog` configured in `settings/base.py`.
- **CI:** GitHub Actions. One job: `uv sync --frozen`, `ruff check`, `mypy src/project/`, `pytest -n auto --reuse-db`. Cache `~/.cache/uv` and the `.tox`/`.pytest_cache` directories keyed on `uv.lock`. Postgres + Redis as service containers.
- **Deploy:** Docker image runs `gunicorn project.wsgi:application` behind a load balancer. Static files via `whitenoise` for small apps, S3 + CloudFront for larger. `manage.py migrate` runs as a separate release-phase step before web or worker boots. Fly.io and Render handle this with a deploy hook; ECS uses a one-off task.
- **Health:** `/healthz` returns 200 plus a `connection.ensure_connection()`. `/readyz` adds Redis ping and Celery `inspect.ping()`. Wire them in `project/urls.py`, exempt from auth middleware.

## External APIs

Auth-bound third-party APIs (Stripe, SendGrid, AWS, Slack, etc.) live here.

Primary pattern: `django-environ` reads `.env` and parses each var into the right Python type inside `settings/base.py`. Access through `settings.STRIPE_SECRET_KEY` (or a namespaced dataclass for grouped secrets). Boot-time validation crashes fast; nothing in views or tasks calls `os.environ` directly.

For larger teams with rotation policies: secret managers like Doppler, AWS Secrets Manager, or HashiCorp Vault inject env vars at boot. App code stays the same.

See also: [Authsome](https://authsome.dev) ships a cross-language credential layer if your stack is polyglot.

## Don't

- Don't call `.save()` inside a request loop. Use `bulk_create`, `bulk_update`, or move to a Celery task.
- Don't run migrations from inside `AppConfig.ready()`. Run `migrate` as a deploy step before the app boots.
- Don't pass ORM instances to Celery tasks. They serialize stale; pass the PK and re-fetch.
- Don't use `request.user` inside a Celery task. There is no request. Pass `user_id` and load.
- Don't catch `Exception:` in a task without re-raising or marking failure. Silent task drops are the #1 production issue.
- Don't paginate large tables with `LIMIT/OFFSET` past page 50. Use keyset (`WHERE id > :last_id ORDER BY id`).
- Don't import from `apps.<other_app>.models` inside `apps.<this_app>.models`. Cross-app circular imports surface at migration time.

## Vendor notes

- **Codex / agents.md:** canonical. Stays under the 32 KiB Codex max.
- **Cursor:** reads this file. Pair with `.cursor/rules/django.mdc` only for stack-specific globs.
- **Jules:** root AGENTS.md only. Per-app nested AGENTS.md is ignored.
- **Aider:** `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** symlink `ln -s AGENTS.md CLAUDE.md`.

---

*Production references:* [getsentry/sentry](https://github.com/getsentry/sentry/blob/master/AGENTS.md) · [prowler-cloud/prowler](https://github.com/prowler-cloud/prowler/blob/master/api/AGENTS.md) · [PostHog/posthog](https://github.com/PostHog/posthog/blob/master/AGENTS.md)
