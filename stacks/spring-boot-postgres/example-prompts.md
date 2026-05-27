# Example prompts · Spring Boot + Postgres + JPA + Flyway + JUnit + Testcontainers

Prompts that should land cleanly when a coding agent has this stack's AGENTS.md loaded. Use them as smoke tests when verifying the file against a new agent.

## 1. Paginated endpoint

> Add a `GET /api/posts` REST endpoint that returns posts with cursor pagination. Page size 20, sorted by `createdAt` desc. Include a JUnit 5 integration test using Testcontainers Postgres that asserts the cursor round-trip.

What good looks like: controller in `posts/api/PostController.java` returning a DTO with `nextCursor`; service in `posts/domain/`; JPA repository in `posts/infrastructure/`. Test extends a shared `@Testcontainers` base, uses MockMvc, no `OFFSET` in the SQL.

## 2. Idempotent background task

> Add a `WelcomeEmailService.sendOnceFor(userId)` that sends the welcome email at most once per user. Use a `welcome_email_log` table as the dedupe key. Add a unit test plus an integration test that asserts a double-call sends exactly one email.

What good looks like: Flyway migration adds the table with a unique constraint on `user_id`; service catches `DataIntegrityViolationException` and treats it as already-sent; transactional boundary around the insert + send call. No distributed lock library.

## 3. Schema migration with backfill

> The `User.timezone` column needs to become non-nullable, defaulting to `UTC`. Write the Flyway migrations and the backfill, in that order. Separate migrations, not one.

What good looks like: `V<ts>__add_user_timezone.sql` adds nullable column with default; `V<ts+1>__backfill_user_timezone.sql` updates existing rows; `V<ts+2>__user_timezone_not_null.sql` (separate PR) sets NOT NULL. The agent should refuse to combine these.

## 4. Refactor: extract a feature slice

> The `OrderController` references both `User` and `Product` JPA entities directly. Refactor so the controller only depends on `orders/domain` types. Move JPA access into `orders/infrastructure`.

What good looks like: new DTOs in `orders/api/`, a service in `orders/domain/OrderService.java`, a repository implementation in `orders/infrastructure/`. The controller signature changes from `User`/`Product` to `OrderDto`. Existing tests updated, no behavior change.

## 5. External API integration

> Add a `StripeClient.createCustomer(email)` using Spring's `RestClient`. Pull credentials per the External APIs section. Add a WireMock-backed unit test that asserts the request shape without hitting the network.

What good looks like: `@ConfigurationProperties("integrations.stripe")` record reading from `application.yaml`; `RestClient` bean configured with the typed props; `application-test.yaml` overrides the `baseUrl` to point at WireMock; no real network call in the test.
