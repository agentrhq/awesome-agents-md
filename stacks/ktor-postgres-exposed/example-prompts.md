# Example prompts · Ktor + Postgres + Exposed + Kotest

Prompts that should land cleanly when a coding agent has this stack's AGENTS.md loaded. Use them as smoke tests when verifying the file against a new agent.

## 1. Paginated endpoint

> Add a `GET /api/posts` route that returns posts with cursor pagination. Page size 20, sorted by `createdAt` desc. Include a Kotest integration test using `testApplication` and a Testcontainers Postgres that asserts the cursor round-trip.

What good looks like: `Route.postRoutes()` in `posts/api/PostRoutes.kt`; Exposed table + repository in `posts/infrastructure/`; integration test under `src/test/kotlin/com/<org>/<app>/posts/`. Response is `PagedResponse<PostDto>`; no `OFFSET` in the SQL.

## 2. Idempotent background task

> Add a `WelcomeEmailJob.sendOnceFor(userId)` that sends the welcome email at most once per user. Use a `welcome_email_log` table as the dedupe key. Add a unit test plus an integration test that asserts a double-call sends exactly one email.

What good looks like: Flyway migration adds the table with `UNIQUE(user_id)`; the job inserts inside `newSuspendedTransaction` and catches `ExposedSQLException` mapped to `PSQLState.UNIQUE_VIOLATION`; structured concurrency via the application scope.

## 3. Schema migration with backfill

> The `User.timezone` column needs to become non-nullable, defaulting to `UTC`. Write the Flyway migrations and the backfill, in that order. Separate migrations, not one.

What good looks like: `V<ts>__add_user_timezone.sql` adds nullable column with default; `V<ts+1>__backfill_user_timezone.sql` updates existing rows; `V<ts+2>__user_timezone_not_null.sql` (separate PR) sets NOT NULL. The agent should refuse to combine these.

## 4. Refactor: extract a feature slice

> The route file `Application.kt` directly references `UserTable` and `ProductTable`. Refactor so each feature exposes `fun Application.installUserFeature()` and `installProductFeature()`, each composing its own routes, services, and tables.

What good looks like: new packages `users/` and `products/` with `api/`, `domain/`, `infrastructure/`; `Application.module()` calls only the install functions; existing tests keep passing, behavior unchanged.

## 5. External API integration

> Add a `StripeClient.createCustomer(email)` using Ktor's `HttpClient` with the CIO engine. Pull credentials per the External APIs section. Add a Kotest unit test using `MockEngine` that asserts the request shape without hitting the network.

What good looks like: `StripeConfig` data class loaded from `application.conf`; `HttpClient { install(ContentNegotiation) { json() }; install(Auth) }`; test installs `MockEngine` and matches on `request.url.encodedPath` and the `Authorization` header.
