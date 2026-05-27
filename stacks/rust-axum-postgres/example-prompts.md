# Example prompts · Rust + Axum + sqlx + Postgres + tokio

Prompts that should land cleanly when a coding agent has this stack's AGENTS.md loaded. Use them as smoke tests when verifying the file against a new agent.

## 1. Paginated endpoint

> Add a `GET /users` handler that returns users with cursor pagination. Page size 20, sorted by `id` ascending. Include an integration test using `#[sqlx::test]` that seeds 50 rows and walks two pages.

What good looks like: handler in `src/api/users.rs` is under 30 lines, calls a `db::users::list` function with a typed `ListQuery` DTO; SQL uses `WHERE id > $1 ORDER BY id LIMIT 20`, no `OFFSET`; uses `query_as!` for compile-time checking; integration test under `tests/users.rs` calls `app.oneshot(...)` via `tower::ServiceExt`.

## 2. Idempotent background job

> Add an outbox processor that pops the next `outbox` row, calls an external webhook, marks it sent. Run it every 5 seconds via `tokio::spawn`. Idempotent on retry (same row, same effect).

What good looks like: `SELECT ... FOR UPDATE SKIP LOCKED LIMIT 1` inside a transaction; status transitions `pending → in_flight → sent | failed`; `attempts` and `last_error` columns updated; outer loop uses `tokio::time::interval` with `MissedTickBehavior::Delay`. Don't use a global `lazy_static` mutex.

## 3. Migration with backfill

> The `users.timezone` column must become NOT NULL with default `'UTC'`. Write the migration sequence.

What good looks like: `sqlx migrate add -r 001_add_timezone_column` (nullable + default), then a `bin/backfill_timezone.rs` script for existing rows, then `sqlx migrate add -r 002_timezone_not_null`. Three migrations, not one. After the schema change, `cargo sqlx prepare` is run and `.sqlx/` updates are included in the diff. The agent should refuse to combine these.

## 4. Refactor and extraction

> The `/orders` handler is 180 lines with sqlx calls, validation, and Stripe API calls inline. Extract a service in `src/service/orders.rs` taking `&PgPool` and DTOs. Handler should be back under 40 lines.

What good looks like: service is framework-agnostic (no `axum::*` imports, no `IntoResponse`); returns a domain `Result<OrderConfirmed, OrderError>`; handler translates `OrderError` into `AppError` and lets `IntoResponse` do the HTTP mapping; existing tests still pass.

## 5. External API integration

> Add a `send_invoice(order_id)` function that calls Stripe's invoices API. Pull credentials per the External APIs section. Add a unit test using `wiremock` that asserts the request body and headers without hitting Stripe.

What good looks like: implementation reads credentials from the typed config struct (option 1), env injected by Doppler (option 2), or `authsome::stripe` (option 3); a `wiremock::MockServer` is started in the test and the Stripe base URL is injected; the function returns `Result<InvoiceId, AppError>` with a typed `External` variant on 5xx.
