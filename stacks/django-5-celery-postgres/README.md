---
stack_slug: django-5-celery-postgres
display_name: Django 5.1 · DRF 3.15 · Celery 5.4 · Postgres 16 · pytest 8
components: [django-5, drf-3.15, celery-5.4, redis-7, postgres-16, pytest-8]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Django 5 + DRF + Celery + Postgres + pytest

The mainstream Python web stack for teams that want batteries included: admin, auth, ORM, migrations, and a deep ecosystem. DRF for JSON APIs, Celery for anything that can't finish in a request.

## Why these choices

- **Django over FastAPI when you want the admin and the ORM.** Django ORM is mature, migrations are part of the framework, the admin pays for itself the first time a non-engineer needs to fix data.
- **DRF over plain Django views for JSON.** Serializers, ViewSets, and the router give you a consistent CRUD shape without writing it five times.
- **Celery + Redis over RQ or Solid Queue.** Largest ecosystem, best observability tooling (flower, sentry integration), retries and beat schedules in one binary.
- **pytest-django over Django's test runner.** Fixtures are composable, `--reuse-db` is dramatically faster, plugins for factories and freezing time are first-class.
- **Sync views by default.** DRF's async support is partial; mixing async views with sync ORM calls is the most common Django performance footgun. Push concurrency to Celery instead.

## What to tune

- Drop DRF and use plain Django views if the product is server-rendered HTML, not JSON.
- If background work is light, replace Celery with `django-q2` or Django's built-in `async_task` and skip the Redis dependency.
- Swap mypy + django-stubs for `pyright` if you prefer Pylance integration in editors.
- If the team standardizes on `poetry` or `pip-tools`, swap the `uv` commands but keep the lockfile-as-source-of-truth rule.

## Verification

Pilot entry. `verified_with` is empty until a maintainer runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the run logs per [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
