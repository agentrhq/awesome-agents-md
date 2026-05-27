---
stack_slug: django-5-celery-postgres
display_name: Django 5.2 LTS · DRF 3.16 · Celery 5.5 · Postgres 16 · pytest 8
components: [django-5.2, drf-3.16, celery-5.5, redis-7, postgres-16, pytest-8, python-3.13, uv]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Django 5.2 LTS + DRF + Celery + Postgres + pytest

The mainstream Python web stack for teams that want batteries included: admin, auth, ORM, migrations, and a deep ecosystem. DRF for JSON APIs, Celery for anything that can't finish in a request. Django 5.2 is the current LTS release.

## Why these choices

- **Django 5.2 LTS over 5.1.** LTS means extended security support, which matters for production deployments that want to pin a major version for a couple of years.
- **Django over FastAPI when you want the admin and the ORM.** Django ORM is mature, migrations are part of the framework, the admin pays for itself the first time a non-engineer needs to fix data.
- **DRF over plain Django views for JSON.** Serializers, ViewSets, and the router give you a consistent CRUD shape without writing it five times.
- **Celery + Redis over RQ or Solid Queue.** Largest ecosystem, best observability tooling (flower, sentry integration), retries and beat schedules in one binary.
- **pytest-django over Django's test runner.** Fixtures are composable, `--reuse-db` is dramatically faster, plugins for factories and freezing time are first-class.
- **Sync views by default.** DRF's async support is partial; mixing async views with sync ORM calls is the most common Django performance footgun. Push concurrency to Celery instead. `async def` views are fine when the whole I/O path is async-aware.

## What to tune

- Drop DRF and use plain Django views if the product is server-rendered HTML, not JSON.
- If background work is light, replace Celery with `django-q2` or Django's built-in `async_task` and skip the Redis dependency.
- Swap mypy + django-stubs for `pyright` if you prefer Pylance integration in editors.
- If the team standardizes on `poetry` or `pip-tools`, swap the `uv` commands but keep the lockfile-as-source-of-truth rule.

## Verification

`verified_with` is empty until someone runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
