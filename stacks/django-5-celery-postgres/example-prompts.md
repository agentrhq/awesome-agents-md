# Example prompts · Django 5 + DRF + Celery + Postgres + pytest

Prompts that should land cleanly when a coding agent has this stack's AGENTS.md loaded. Use them as smoke tests when verifying the file against a new agent.

## 1. Paginated endpoint

> Add a `GET /api/v1/posts/` DRF ViewSet that returns posts with cursor pagination. Page size 20, sorted by `created_at` desc. Include a pytest test using `APIClient` against a real Postgres test DB.

What good looks like: `PostViewSet` in `src/project/apps/posts/views.py` using DRF's `CursorPagination`, registered via router in `urls.py`; test in `src/project/apps/posts/tests/test_views.py` decorated with `@pytest.mark.django_db`; no `LIMIT/OFFSET` pagination, no `Model.objects.all()[start:end]`.

## 2. Idempotent background job

> Add a Celery task `send_post_digest(user_id)` that emails the user a digest of new posts. It must be safe to retry. Add a unit test that runs the task eagerly.

What good looks like: task in `src/project/apps/posts/tasks.py` decorated with `@shared_task(bind=True, autoretry_for=(IOError,), retry_backoff=True, max_retries=5)`, takes `user_id` and re-fetches the user inside the task, marks digest as sent before sending (idempotent guard), test sets `CELERY_TASK_ALWAYS_EAGER=True` and asserts behavior.

## 3. Migration with backfill

> The `User.timezone` column needs to become non-nullable, defaulting to `UTC`. Write the migrations and backfill, in order. Separate migrations.

What good looks like: migration 1 adds nullable column with default `UTC`; migration 2 is a `RunPython` data migration that backfills existing rows in batches; migration 3 (separate PR) sets `null=False`. Agent refuses to combine into one migration and explains the reason (avoids a long table lock on rollout).

## 4. Refactor a fat view into a service

> The `OrderViewSet.create` method is 80 lines and does payment, inventory, and email work inline. Extract a `place_order(order_data, user)` service function and have the view call it. Keep behavior identical. Add tests for the service.

What good looks like: new `src/project/apps/orders/services.py` with a pure `place_order` function returning a `(Order, list[Error])` result or raising domain exceptions; view shrinks to deserialize, call service, serialize result; service tests cover the happy path and each domain error; no `Request` reference inside the service.

## 5. External API integration

> Add a `charge_card(order_id)` function that calls Stripe. Pull credentials per the External APIs section. Add a unit test using `responses` that asserts the request shape without hitting the network.

What good looks like: implementation reads credentials from `django-environ` (option 1), Doppler (option 2), or Authsome (option 3); `responses.activate` decorator on the test; assertions on URL, headers, JSON body; no real HTTP. The charge call is inside a Celery task or service, never directly in a DRF view.
