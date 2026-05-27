# Example prompts · Go 1.23 + chi + pgx + sqlc + testify

Prompts that should land cleanly when a coding agent has this stack's AGENTS.md loaded. Use them as smoke tests when verifying the file against a new agent.

## 1. Paginated endpoint

> Add a `GET /posts` handler on the chi router that returns posts with cursor pagination. Page size 20, sorted by `created_at` desc. Include a testify test that hits the handler via `httptest`.

What good looks like: query in `internal/db/queries/posts.sql` named `ListPostsAfter`, run `sqlc generate`, generated method on `Queries`; handler in `internal/api/handlers/posts.go` parses `?cursor=` query, calls service, uses `writeJSON`; service in `internal/service/posts` calls the sqlc method; test under the same package uses `httptest.NewRequest` and `httptest.NewRecorder`, asserts the JSON shape and cursor round-trip via `require.NoError` then `assert.Equal`. No `OFFSET`.

## 2. Idempotent background job

> Add a goroutine-driven worker that polls a `pending_emails` table every 5 seconds and sends each one. Must be safe to run multiple replicas. Add a unit test.

What good looks like: worker struct in `internal/worker/emails`, runs in its own goroutine started from `cmd/api/main.go` with a `context.Context` derived from the server's shutdown ctx; SQL uses `SELECT ... FOR UPDATE SKIP LOCKED LIMIT 10` to claim rows; marks rows `sent_at = NOW()` in the same transaction before sending so retries don't double-send; test runs against a Testcontainers Postgres and asserts the row state transition.

## 3. Migration with backfill

> The `users.timezone` column needs to become `NOT NULL` with default `UTC`. Write the migrations and backfill, in order. Separate migration files.

What good looks like: `internal/db/migrations/0007_add_users_timezone_nullable.up.sql` adds the nullable column with default `UTC`; `0008_backfill_users_timezone.up.sql` runs `UPDATE users SET timezone = 'UTC' WHERE timezone IS NULL`; `0009_users_timezone_not_null.up.sql` (separate PR) adds the `NOT NULL` constraint. Each `.up.sql` has a matching `.down.sql`. Agent refuses to combine them and explains the lock risk on a large table.

## 4. Refactor a fat handler into a service

> `handleCreateOrder` is 90 lines and does Stripe charging, inventory updates, and email enqueue inline. Extract a `service.Orders.PlaceOrder(ctx, dto)` method. Keep behavior identical. Add a service test.

What good looks like: new `internal/service/orders/service.go` with a `Service` struct holding dependencies (`*Queries`, Stripe client, email worker) injected via constructor; `PlaceOrder` returns `(*domain.Order, error)` with wrapped errors using `%w`; handler shrinks to decode, call service, encode; service test uses real Postgres via Testcontainers and an `httptest.NewServer` for Stripe.

## 5. External API integration

> Add a `ChargeCard(ctx, orderID)` method that calls Stripe. Pull credentials per the External APIs section. Add a testify test using `httptest.NewServer` that asserts the request shape without hitting the real network.

What good looks like: implementation reads credentials from `internal/config` (option 1: viper/env), Doppler (option 2), or Authsome (option 3); the Stripe client is injected, not constructed inside the function; test stands up an `httptest.NewServer`, points the client at it, asserts URL path, headers, and body; uses `require.NoError` for the call and `assert.Equal` for each field. Function takes `ctx` as first arg and threads it into the HTTP request via `http.NewRequestWithContext`.
