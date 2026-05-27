# Example prompts · Bun + Hono + SQLite + Drizzle + bun:test

Prompts that should land cleanly when a coding agent has this stack's AGENTS.md loaded. Use them as smoke tests when verifying the file against a new agent.

## 1. Paginated endpoint

> Add a `GET /posts` route that returns posts with cursor pagination. Page size 20, sorted by `created_at` desc. Include a `bun:test` test that uses an in-memory SQLite, seeds 50 posts, and asserts the cursor round-trip across two pages.

What good looks like: handler in `src/routes/posts.ts` chained off a `new Hono()`; uses Drizzle's `.where(lt(posts.createdAt, cursor)).limit(20)`; no `OFFSET`; test uses `app.request("/posts?cursor=...")` and `setSystemTime` for deterministic timestamps.

## 2. Idempotent background job

> Add an in-process retry worker that processes a `jobs` table every 5 seconds: claim a row with `UPDATE ... WHERE id = ? AND status = 'pending' RETURNING *`, run the work, mark `done` or `failed`. Idempotent on re-claim.

What good looks like: file in `src/lib/worker.ts` invoked from `src/index.ts`; uses `setInterval` and `db.transaction(...)`; claim and update happen in one transaction; failure increments `attempts` and only marks `failed` past a max. Don't spawn a Node worker thread; this is single-process Bun.

## 3. Migration with backfill

> The `users.timezone` column needs to become non-nullable, defaulting to UTC. Write the Drizzle schema change and the migration sequence.

What good looks like: edit `src/db/schema.ts`; run `drizzle-kit generate`; produces migration 1 (add nullable column with default), then a `src/db/backfills/<slug>.ts` script for existing rows, then migration 2 setting NOT NULL. Three steps, not one. The agent should refuse to combine them.

## 4. Refactor and extraction

> The `/users` route handler has grown to 220 lines with embedded validation and DB calls. Extract a `src/services/users.ts` module with pure functions taking `(db, input)`. The handler should be back under 40 lines.

What good looks like: service functions are framework-agnostic (no `Context` argument, no `HTTPException`); route file imports them and translates errors at the boundary; existing tests still pass without modification.

## 5. External API integration

> Add a `sendWelcomeEmail(userId)` function that sends via Resend. Pull credentials per the External APIs section. Add a `bun:test` unit test that asserts the HTTP request shape without hitting the network.

What good looks like: implementation reads from `Bun.env` (option 1), Doppler (option 2), or Authsome (option 3); test mocks `fetch` with `mock()` from `bun:test` or uses `msw`; no real network call. The function does not throw on transient errors; it returns a Result-shaped object.
