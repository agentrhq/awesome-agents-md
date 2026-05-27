# Example prompts · Tauri 2 + Rust + React + Vite + SQLite

Prompts that should land cleanly when a coding agent has this stack's AGENTS.md loaded. Use them as smoke tests when verifying the file against a new agent.

## 1. Paginated query (Rust command + React hook)

> Add a `get_posts(cursor, limit)` Tauri command returning posts with cursor pagination, page size 20, sorted by `created_at` desc. Add a typed wrapper in `src/lib/invoke.ts` and a React hook `usePosts()` using `@tanstack/react-query`'s `useInfiniteQuery`.

What good looks like: command in `src-tauri/src/commands/posts.rs` with `#[tauri::command]`, returns `Result<PagedPosts, AppError>`; sqlx query uses keyset pagination not OFFSET; capability added in `src-tauri/capabilities/main.json`; typed wrapper `getPosts(cursor, limit)`; hook `useInfiniteQuery({ queryKey: ['posts'], getNextPageParam })`.

## 2. Idempotent background task

> Add a `SyncWorker` in the Rust backend that polls a remote API every 15 minutes and writes new posts to SQLite. Idempotent on duplicate insert. Expose a Tauri command to trigger an immediate sync. Add a Rust unit test that asserts running the sync twice with the same response inserts each post once.

What good looks like: a `tokio::spawn` long-lived task in `setup()`; `INSERT ... ON CONFLICT DO NOTHING` via sqlx; the manual command shares the same function; unit test injects a fake HTTP client trait.

## 3. SQLite migration with backfill

> The `users.timezone` column needs to become non-nullable, defaulting to `UTC`. Add the sqlx migrations and the backfill, in that order. Separate migration files, not one.

What good looks like: `<ts>__add_user_timezone.sql` adds nullable column with default; `<ts+1>__backfill_user_timezone.sql` updates existing rows; `<ts+2>__user_timezone_not_null.sql` (separate PR) does the SQLite table rebuild to enforce NOT NULL. The agent should refuse to combine these because SQLite forbids `ALTER COLUMN ... SET NOT NULL`.

## 4. Refactor: typed invoke wrapper

> The codebase calls `invoke('get_user', { id })` directly from components in three places. Refactor: add `src/lib/invoke.ts` with a typed `getUser(id: string): Promise<User>`, update call sites, add a Vitest test that mocks the wrapper.

What good looks like: every `invoke()` call goes through `src/lib/invoke.ts`; the wrapper imports the Rust command's argument and return types from a shared `src/types/ipc.ts`; components depend only on the wrapper; the Vitest test mocks `getUser` via `vi.mock('@/lib/invoke')`.

## 5. External API integration with OS keyring

> Add a `StripeClient` in Rust that calls `POST /v1/customers`. Pull the API key from the OS keyring per the External APIs section. Add a Rust unit test using `httpmock` that asserts the request shape without hitting the network.

What good looks like: `keyring::Entry::new("my-app", "stripe_api_key")` reads the secret at first call; client uses `reqwest` with a custom `Authorization: Bearer ...` header; unit test starts `httpmock::MockServer`, configures the client base URL to point at it, asserts the request body. No literal API key in source, no `VITE_STRIPE_SECRET` env var.
