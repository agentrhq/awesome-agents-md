# Example prompts · .NET 9 + ASP.NET Core + EF Core + Postgres + xUnit

Prompts that should land cleanly when a coding agent has this stack's AGENTS.md loaded. Use them as smoke tests when verifying the file against a new agent.

## 1. Paginated endpoint

> Add a `GET /users` Minimal API that returns users with cursor pagination. Page size 20, sorted by `Id` asc. Include an xUnit integration test using `WebApplicationFactory` and Testcontainers Postgres that asserts the cursor round-trip.

What good looks like: handler in `src/Api/Endpoints/UsersEndpoints.cs` using `MapGroup("/users")`; EF Core query uses `Where(x => x.Id > lastId).OrderBy(x => x.Id).Take(20).AsNoTracking()`, no `Skip`; test class in `tests/Api.Tests/UsersEndpointsTests.cs` uses `IAsyncLifetime` to start a Postgres container, hits the endpoint via `HttpClient`, asserts both pages.

## 2. Idempotent background job

> Add a hosted service `DailyDigestService : BackgroundService` that runs at 09:00 UTC. It must be idempotent: if the same `digestDate` is processed twice, no duplicate emails. Use a `DigestRuns` row as the lock.

What good looks like: `BackgroundService` registered via `AddHostedService`; first action inside the loop is an upsert into `DigestRuns (Date PRIMARY KEY)` using `ExecuteSqlInterpolated` with `ON CONFLICT DO NOTHING`; only proceeds if the insert affected one row; structured logging on the skip path.

## 3. Migration with backfill

> The `User.Timezone` column needs to become non-nullable, defaulting to UTC. Write the migration and a backfill, in that order. Two separate migrations.

What good looks like: `dotnet ef migrations add AddTimezoneNullable` adds the column with default UTC, nullable; `dotnet ef migrations add BackfillTimezone` runs raw SQL `UPDATE Users SET Timezone = 'UTC' WHERE Timezone IS NULL`; a third migration (separate PR) flips the column to NOT NULL. The agent should refuse to combine these.

## 4. Refactor / extraction

> The `UsersEndpoints.cs` file is 320 lines, mixing endpoint mapping, DTO projection, and a complex search predicate builder. Extract the search-predicate logic into `Application/Users/Queries/SearchUsersQuery.cs`. No behavior change.

What good looks like: new file `src/Application/Users/Queries/SearchUsersQuery.cs` containing the `IQueryable<User>` predicate composition; `UsersEndpoints.cs` shrinks to thin endpoint handlers that call the query; `Application.Users.Queries` does not reference `Microsoft.AspNetCore.*`; existing tests pass unchanged.

## 5. External API integration

> Add a `SendWelcomeEmailAsync(userId)` use case that sends via Stripe-equivalent (use SendGrid). Pull credentials per the External APIs section. Add an xUnit test using `HttpMessageHandler` mocking that asserts the HTTP request shape without hitting the network.

What good looks like: `IEmailClient` interface in `Application/`; `SendGridEmailClient` implementation in `Infrastructure/ExternalServices/`; credentials read via `IOptions<SendGridOptions>` from `appsettings.json` + User Secrets (option 1), Vault (option 2), or Authsome (option 3); test substitutes a fake `HttpMessageHandler` via NSubstitute and asserts the `Authorization` header and JSON body shape; no real network call.
