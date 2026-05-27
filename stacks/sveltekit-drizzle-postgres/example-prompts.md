# Example prompts · SvelteKit 2 + Drizzle + Postgres + Playwright + Vitest

Prompts that should land cleanly when a coding agent has this stack's AGENTS.md loaded. Use them as smoke tests when verifying the file against a new agent.

## 1. Paginated endpoint

> Add a `GET /api/posts` route that returns posts with cursor pagination. Page size 20, sorted by `createdAt` desc. Include a Vitest integration test that hits a real Testcontainers Postgres and asserts the cursor round-trip.

What good looks like: handler in `src/routes/api/posts/+server.ts`; Drizzle query uses `.limit(20)` plus a `where(gt(posts.id, cursor))` keyset clause, no `OFFSET`; integration test in `tests/unit/posts.test.ts` boots a Testcontainers Postgres and asserts that the second-page cursor returns the expected next slice.

## 2. Idempotent background job

> Add a `sendDailyDigest()` job triggered by a `+server.ts` cron webhook at `/api/cron/digest`. It must be idempotent: if the same `digestDate` runs twice, no duplicate emails. Use a `digest_runs` row as the lock.

What good looks like: server route in `src/routes/api/cron/digest/+server.ts`; first action is an upsert into `digest_runs (date PRIMARY KEY)`; on `ON CONFLICT DO NOTHING` returning zero rows, the handler exits 200 with `{ skipped: true }`. No work happens before the lock is taken.

## 3. Migration with backfill

> The `User.timezone` column needs to become non-nullable, defaulting to UTC. Write the migration and a backfill, in that order. Two separate migrations.

What good looks like: `drizzle-kit generate` produces migration 1 adding the nullable column with default UTC; migration 2 backfills existing rows with `UPDATE users SET timezone = 'UTC' WHERE timezone IS NULL`; migration 3 (separate PR) sets NOT NULL. The agent should refuse to combine these.

## 4. Refactor / extraction

> The `+page.server.ts` for `/dashboard` is 280 lines, mixing data loading and a Form Action. Extract the data loading into `src/lib/server/dashboard.ts` and keep the Form Action in the route file. No behavior change.

What good looks like: pure function `loadDashboard(db, userId)` in `src/lib/server/dashboard.ts`; `+page.server.ts` becomes `load: ({ locals }) => loadDashboard(db, locals.user.id)`; existing tests pass unchanged; Form Action stays in the route file because it depends on `request`.

## 5. External API integration

> Add a `sendWelcomeEmail(userId)` function that sends via Resend. Pull credentials per the External APIs section. Add an MSW unit test that asserts the HTTP request shape without hitting the network.

What good looks like: implementation in `src/lib/server/email.ts` reads from `$env/static/private` (option 1), Doppler (option 2), or Authsome (option 3); MSW handler in `tests/setup.ts`; no real network call in the test; the test asserts the `Authorization` header and JSON body shape.
