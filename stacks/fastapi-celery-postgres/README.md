---
stack_slug: fastapi-celery-postgres
display_name: FastAPI 0.136 · Celery 5.5 · Postgres 16 · pytest 8
components: [fastapi-0.136, celery-5.5, redis-7, postgres-16, sqlalchemy-2, alembic, pytest-8, ruff, mypy, uv, python-3.14]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# FastAPI + Celery + Postgres + pytest

The default modern Python web API stack. Async FastAPI, Celery for jobs that must complete, SQLAlchemy 2.0 async over Postgres, uv as the universal package manager. Python 3.14.

## Why these choices

- **FastAPI over Flask or Django.** Async-native, typed via Pydantic, OpenAPI for free.
- **Celery over RQ or arq.** Largest operator ecosystem, flower, retries, dead-letter, beat scheduler.
- **SQLAlchemy 2.0 async.** The 1.x sync API is on its way out. 2.0 lets the API layer stay async end-to-end.
- **uv over pip + venv + poetry.** 10-100x faster, single tool for lock, sync, and run.
- **ruff over black + isort + flake8.** One tool, one config, faster.
- **Python 3.14 over 3.13.** Free-threaded build matured further; the GIL-bound path still wins on tooling, async perf, and typing improvements.

## What to tune

- Drop Celery beat if you don't need scheduled jobs.
- For tiny services, swap Celery for [arq](https://arq-docs.helpmanual.io/) (asyncio-native, lighter).
- Drop Alembic only if you genuinely don't need migrations (rare; most apps need it within a month).
- Swap factory_boy for [polyfactory](https://polyfactory.litestar.dev/) if you prefer typed factories.

## Verification

`verified_with` is empty until someone attaches verification logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
